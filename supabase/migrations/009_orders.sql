-- =====================================================================
-- 009_orders.sql — checkout (build step 6)
-- Run ONCE in Supabase → SQL Editor, after 001–008.
--
--   1. delivery_quote()   — delivery zone + charge for a pincode (anyone can ask)
--   2. place_order()      — the ONLY way to create an order. Prices, add-ons and
--                           delivery are read from the database, never from the
--                           browser. Tracked stock is reserved ('online_order').
--   3. submit_utr()       — customer enters the 12-digit UPI reference
--   4. cancel_my_order()  — customer cancels before paying; stock goes back
--
-- Customers still cannot insert/update orders directly (002 gives them SELECT only).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Delivery zones get a fixed key, so the admin can rename a zone or change
-- its charge (step 9) without breaking the pincode rule below.
-- ---------------------------------------------------------------------
update public.settings
set delivery_zones = (
  select jsonb_agg(
           z || jsonb_build_object('key', case z ->> 'name'
                                            when 'Mumbai & Navi Mumbai' then 'local'
                                            when 'Rest of Maharashtra'  then 'maharashtra'
                                            else 'india' end)
           order by ord)
  from jsonb_array_elements(delivery_zones) with ordinality as e (z, ord)
)
where id = 1 and jsonb_array_length(delivery_zones) > 0;

-- ---------------------------------------------------------------------
-- 1. delivery_quote(pincode, number of sarees)
--    local       = Mumbai 400001–400104 and Navi Mumbai / Panvel node pincodes
--    maharashtra = other pincodes starting 40–44 (except 403xxx, which is Goa)
--    india       = everything else
--    Charge = zone charge for the first saree + extra charge for each other saree.
-- ---------------------------------------------------------------------
create function public.delivery_quote(p_pincode text, p_sarees integer default 1)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_pin   integer;
  v_key   text;
  v_zone  jsonb;
  v_extra numeric;
begin
  if p_pincode is null or p_pincode !~ '^[1-9][0-9]{5}$' then
    raise exception 'Enter a valid 6-digit pincode';
  end if;
  if p_sarees is null or p_sarees < 1 or p_sarees > 20 then
    raise exception 'Number of sarees must be between 1 and 20';
  end if;
  v_pin := p_pincode::integer;

  v_key := case
    when v_pin between 400001 and 400104
      or v_pin = 400614 or v_pin between 400701 and 400710          -- Navi Mumbai (Belapur–Airoli)
      or v_pin between 410206 and 410210 or v_pin = 410218          -- Panvel, Kamothe, Kharghar, Kalamboli
      then 'local'
    when left(p_pincode, 2) between '40' and '44' and left(p_pincode, 3) <> '403'
      then 'maharashtra'
    else 'india'
  end;

  select z, s.extra_saree_delivery_charge
    into v_zone, v_extra
    from public.settings s, jsonb_array_elements(s.delivery_zones) as z
   where s.id = 1 and z ->> 'key' = v_key;
  if v_zone is null then
    raise exception 'Delivery charges are not set up yet. Please contact the shop.';
  end if;

  return jsonb_build_object(
    'zone',   v_zone ->> 'name',
    'charge', (v_zone ->> 'charge')::numeric + v_extra * (p_sarees - 1)
  );
end;
$$;
revoke execute on function public.delivery_quote(text, integer) from public;
grant execute on function public.delivery_quote(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. place_order(items, address)
--    items   = [{"variant_id": uuid, "qty": 1-10, "addons": [service uuid, ...]}, ...]
--    address = {"full_name", "phone", "line1", "line2", "city", "state", "pincode"}
--    Returns {"id", "order_no", "total"}.
-- ---------------------------------------------------------------------
create function public.place_order(p_items jsonb, p_address jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid       uuid := auth.uid();
  v_item      jsonb;
  v_variant   uuid;
  v_qty       integer;
  v_row       record;
  v_addon_ids uuid[];
  v_addons    jsonb;
  v_addon_sum numeric;
  v_lines     jsonb := '[]';
  v_line      jsonb;
  v_subtotal  numeric := 0;
  v_addons_total numeric := 0;
  v_sarees    integer := 0;
  v_quote     jsonb;
  v_address   jsonb;
  v_order     public.orders;
begin
  if v_uid is null then
    raise exception 'Please log in to place an order' using errcode = '42501';
  end if;

  -- Stop one account from holding back stock with many unpaid orders
  if (select count(*) from public.orders
       where user_id = v_uid and status = 'payment_pending' and upi_utr is null
         and created_at > now() - interval '1 day') >= 3 then
    raise exception 'You already have 3 unpaid orders. Please pay or cancel them first (My Account → My Orders).';
  end if;

  -- Address: same rules as the addresses table
  v_address := jsonb_build_object(
    'full_name', btrim(p_address ->> 'full_name'),
    'phone',     btrim(p_address ->> 'phone'),
    'line1',     btrim(p_address ->> 'line1'),
    'line2',     nullif(btrim(coalesce(p_address ->> 'line2', '')), ''),
    'city',      btrim(p_address ->> 'city'),
    'state',     btrim(p_address ->> 'state'),
    'pincode',   btrim(p_address ->> 'pincode'));
  if coalesce(char_length(v_address ->> 'full_name'), 0) not between 2 and 100 then
    raise exception 'Enter the full name for delivery';
  end if;
  if coalesce(v_address ->> 'phone', '') !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a 10-digit mobile number';
  end if;
  if coalesce(char_length(v_address ->> 'line1'), 0) not between 3 and 200
     or coalesce(char_length(v_address ->> 'line2'), 0) > 200 then
    raise exception 'Enter the house / street address (3–200 characters)';
  end if;
  if coalesce(char_length(v_address ->> 'city'), 0) not between 2 and 60
     or coalesce(char_length(v_address ->> 'state'), 0) not between 2 and 60 then
    raise exception 'Enter the city and state';
  end if;
  if coalesce(v_address ->> 'pincode', '') !~ '^[1-9][0-9]{5}$' then
    raise exception 'Enter a valid 6-digit pincode';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Your bag is empty (or has more than 20 sarees)';
  end if;

  -- Pass 1: check every line and lock its colour row (in a fixed order, so two
  -- orders for the same colour wait for each other instead of deadlocking)
  for v_item in
    select value from jsonb_array_elements(p_items) order by value ->> 'variant_id'
  loop
    begin
      v_variant := (v_item ->> 'variant_id')::uuid;
      v_qty     := (v_item ->> 'qty')::integer;
      select coalesce(array_agg(a::uuid), '{}') into v_addon_ids
        from jsonb_array_elements_text(coalesce(v_item -> 'addons', '[]')) as a;
    exception when others then
      raise exception 'Something in your bag is not valid. Please remove it and add it again.';
    end;
    if v_qty is null or v_qty not between 1 and 10 then
      raise exception 'Quantity must be between 1 and 10';
    end if;
    if v_lines @> jsonb_build_array(jsonb_build_object('variant_id', v_variant)) then
      raise exception 'The same colour is in your bag twice';
    end if;

    select v.id, v.color_name, v.stock, p.id as product_id, p.name, p.price
      into v_row
      from public.product_variants v
      join public.products p on p.id = v.product_id
     where v.id = v_variant and v.is_active and p.is_active
       for update of v;
    if not found then
      raise exception 'A saree in your bag is no longer available. Please remove it and try again.';
    end if;
    if v_row.stock is not null and v_row.stock < v_qty then
      raise exception 'Sorry, only % left of % (%)', v_row.stock, v_row.name, v_row.color_name;
    end if;

    -- Add-ons: only active services marked as online add-ons, each at most once
    if cardinality(v_addon_ids) <> (select count(distinct x) from unnest(v_addon_ids) x) then
      raise exception 'An add-on was chosen twice';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'price', s.price) order by s.sort_order), '[]'),
           coalesce(sum(s.price), 0)
      into v_addons, v_addon_sum
      from public.services s
     where s.id = any (v_addon_ids) and s.is_online_addon and s.is_active;
    if jsonb_array_length(v_addons) <> cardinality(v_addon_ids) then
      raise exception 'That add-on is not available online';
    end if;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'variant_id', v_row.id, 'product_id', v_row.product_id, 'name', v_row.name,
      'color', v_row.color_name, 'price', v_row.price, 'qty', v_qty,
      'tracked', v_row.stock is not null, 'addons', v_addons));
    v_subtotal     := v_subtotal + v_row.price * v_qty;
    v_addons_total := v_addons_total + v_addon_sum * v_qty;
    v_sarees       := v_sarees + v_qty;
  end loop;

  if v_sarees > 20 then
    raise exception 'At most 20 sarees per order. For bigger orders please WhatsApp the shop.';
  end if;

  v_quote   := public.delivery_quote(v_address ->> 'pincode', v_sarees);
  v_address := v_address || jsonb_build_object('zone', v_quote ->> 'zone');

  insert into public.orders (user_id, subtotal, addons_total, delivery_charge, total, shipping_address)
  values (v_uid, v_subtotal, v_addons_total, (v_quote ->> 'charge')::numeric,
          v_subtotal + v_addons_total + (v_quote ->> 'charge')::numeric, v_address)
  returning * into v_order;

  -- Pass 2: save the lines and reserve tracked stock
  for v_line in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (order_id, product_id, variant_id, name_snapshot, color_snapshot, unit_price, qty, addons)
    values (v_order.id, (v_line ->> 'product_id')::uuid, (v_line ->> 'variant_id')::uuid,
            v_line ->> 'name', left(v_line ->> 'color', 40), (v_line ->> 'price')::numeric,
            (v_line ->> 'qty')::integer, v_line -> 'addons');

    if (v_line ->> 'tracked')::boolean then
      update public.product_variants
         set stock = stock - (v_line ->> 'qty')::integer
       where id = (v_line ->> 'variant_id')::uuid;
      insert into public.stock_movements (variant_id, change, reason, note, order_id, created_by)
      values ((v_line ->> 'variant_id')::uuid, -(v_line ->> 'qty')::integer, 'online_order',
              'Order ' || v_order.order_no, v_order.id, v_uid);
    end if;
  end loop;

  return jsonb_build_object('id', v_order.id, 'order_no', v_order.order_no, 'total', v_order.total);
end;
$$;
revoke execute on function public.place_order(jsonb, jsonb) from public, anon;
grant execute on function public.place_order(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- restore_order_stock(): gives back whatever stock an order still holds.
-- Internal helper for cancel_my_order (and the admin reject/cancel in step 7).
-- Nobody can call it directly.
-- ---------------------------------------------------------------------
create function public.restore_order_stock(p_order_id uuid, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_held record;
begin
  for v_held in
    select variant_id, -sum(change)::integer as qty
      from public.stock_movements
     where order_id = p_order_id and reason in ('online_order', 'order_cancelled')
     group by variant_id
    having -sum(change) > 0
     order by variant_id
  loop
    update public.product_variants set stock = coalesce(stock, 0) + v_held.qty where id = v_held.variant_id;
    insert into public.stock_movements (variant_id, change, reason, note, order_id, created_by)
    values (v_held.variant_id, v_held.qty, 'order_cancelled', p_note, p_order_id, auth.uid());
  end loop;
end;
$$;
revoke execute on function public.restore_order_stock(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. submit_utr(order, utr): customer enters the 12-digit UPI reference.
--    Can be corrected until the shop verifies the payment.
-- ---------------------------------------------------------------------
create function public.submit_utr(p_order_id uuid, p_utr text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_utr text := regexp_replace(coalesce(p_utr, ''), '\s', '', 'g');
begin
  if v_utr !~ '^[0-9]{12}$' then
    raise exception 'The UTR / UPI reference number has 12 digits';
  end if;

  update public.orders
     set upi_utr = v_utr
   where id = p_order_id and user_id = auth.uid()
     and status = 'payment_pending' and payment_status = 'pending';
  if not found then
    raise exception 'This order is not waiting for payment';
  end if;
exception
  when unique_violation then
    raise exception 'This UTR number is already used on another order. Please check it.';
end;
$$;
revoke execute on function public.submit_utr(uuid, text) from public, anon;
grant execute on function public.submit_utr(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. cancel_my_order(order): only before paying (no UTR yet).
--    After paying, the customer asks the shop on WhatsApp (refund by UPI).
-- ---------------------------------------------------------------------
create function public.cancel_my_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_no text;
begin
  update public.orders
     set status = 'cancelled'
   where id = p_order_id and user_id = auth.uid()
     and status = 'payment_pending' and upi_utr is null
  returning order_no into v_order_no;
  if not found then
    raise exception 'This order can no longer be cancelled here. Please WhatsApp the shop.';
  end if;

  perform public.restore_order_stock(p_order_id, 'Order ' || v_order_no || ' cancelled by customer');
end;
$$;
revoke execute on function public.cancel_my_order(uuid) from public, anon;
grant execute on function public.cancel_my_order(uuid) to authenticated;
