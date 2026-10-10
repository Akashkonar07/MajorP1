-- =====================================================================
-- 003_functions.sql — stock changes + automatic admin activity log
-- (Order functions such as place_order come in build steps 6–7.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Automatic activity log: any admin change to these tables writes a row
-- to admin_activity_log by itself (project brief §9.7), so the app can't forget.
-- ---------------------------------------------------------------------
create or replace function public.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old     jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new     jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_details jsonb;
begin
  -- Only changes made by a logged-in admin are logged (setup scripts are skipped)
  if not public.is_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    -- Record only the fields that changed. Stock is skipped: adjust_stock() logs it itself.
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', v_old -> n.key, 'to', n.value)), '{}')
      into v_details
      from jsonb_each(v_new) as n
     where n.value is distinct from v_old -> n.key
       and n.key not in ('updated_at', 'stock');
    if v_details = '{}' then
      return new;
    end if;
  else
    v_details := coalesce(v_new, v_old);
  end if;

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), lower(tg_op), tg_table_name, coalesce(v_new ->> 'id', v_old ->> 'id'), v_details);

  return coalesce(new, old);
end;
$$;

create trigger products_audit
  after insert or update or delete on public.products
  for each row execute function public.audit_admin_change();
create trigger product_images_audit
  after insert or update or delete on public.product_images
  for each row execute function public.audit_admin_change();
create trigger categories_audit
  after insert or update or delete on public.categories
  for each row execute function public.audit_admin_change();
create trigger settings_audit
  after insert or update or delete on public.settings
  for each row execute function public.audit_admin_change();

-- ---------------------------------------------------------------------
-- adjust_stock(): the ONLY way to change a saree's stock from the app.
-- Admin only. Never lets stock go below 0. Writes the stock register
-- (stock_movements) and the activity log in the same transaction.
-- Returns the new stock.
-- ---------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_change     integer,
  p_reason     text,
  p_note       text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stock integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change stock' using errcode = '42501';
  end if;
  if p_change is null or p_change = 0 or abs(p_change) > 1000 then
    raise exception 'Stock change must be a whole number between -1000 and 1000 (not 0)';
  end if;
  -- online_order / order_cancelled are used only by the order functions (steps 6–7)
  if p_reason is null or p_reason not in ('new_stock', 'shop_sale', 'return', 'adjustment') then
    raise exception 'Reason must be new_stock, shop_sale, return or adjustment';
  end if;
  if p_reason in ('new_stock', 'return') and p_change < 0 then
    raise exception 'New stock and returns must add stock (positive number)';
  end if;
  if p_reason = 'shop_sale' and p_change > 0 then
    raise exception 'A shop sale must reduce stock (negative number)';
  end if;
  if char_length(p_note) > 300 then
    raise exception 'Note is too long (max 300 characters)';
  end if;

  -- Lock the saree row so two admins can't change it at the same moment
  select stock into v_stock from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Saree not found';
  end if;
  if v_stock + p_change < 0 then
    raise exception 'Not enough stock: only % left', v_stock;
  end if;

  update public.products set stock = stock + p_change where id = p_product_id;

  insert into public.stock_movements (product_id, change, reason, note, created_by)
  values (p_product_id, p_change, p_reason, p_note, auth.uid());

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'stock_' || p_reason, 'products', p_product_id::text,
          jsonb_build_object('change', p_change, 'stock_before', v_stock,
                             'stock_after', v_stock + p_change, 'note', p_note));

  return v_stock + p_change;
end;
$$;

-- "Sold in shop" button: −1 with reason shop_sale (project brief §8)
create or replace function public.sold_in_shop(p_product_id uuid)
returns integer
language sql
security definer
set search_path = ''
as $$
  select public.adjust_stock(p_product_id, -1, 'shop_sale', 'Sold in shop');
$$;

-- Logged-in users may call these (the admin check is inside); visitors may not.
revoke execute on function public.adjust_stock(uuid, integer, text, text) from public, anon;
revoke execute on function public.sold_in_shop(uuid) from public, anon;
grant execute on function public.adjust_stock(uuid, integer, text, text) to authenticated;
grant execute on function public.sold_in_shop(uuid) to authenticated;
