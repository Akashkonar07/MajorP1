-- =====================================================================
-- 007_two_inventories.sql — align the database with the updated project brief
--   1. Online stock and shop stock are SEPARATE: remove "sold in shop"
--   2. settings.fall_pico_price → fall_beading_price
--   3. orders.payment_method (UPI only for now; 'cod' is future scope)
--   4. Private shop inventory: shop_items + shop_stock_movements (admin-only)
--   5. Private 'shop-item-photos' storage bucket (admin-only)
--   6. shop_info: short postal address for display + Maps address for links
-- Run ONCE in Supabase → SQL Editor, after 001–006.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Online stock: no "sold in shop" any more (project brief §8)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.stock_movements where reason = 'shop_sale') then
    raise exception 'stock_movements already has shop_sale rows — review them before running this migration';
  end if;
end;
$$;

drop function if exists public.sold_in_shop(uuid);

alter table public.stock_movements drop constraint stock_movements_reason_check;
alter table public.stock_movements add constraint stock_movements_reason_check
  check (reason in ('new_stock', 'online_order', 'order_cancelled', 'return', 'adjustment'));

-- Same function as in 003, minus 'shop_sale'. (CREATE OR REPLACE keeps its permissions.)
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
  if p_reason is null or p_reason not in ('new_stock', 'return', 'adjustment') then
    raise exception 'Reason must be new_stock, return or adjustment';
  end if;
  if p_reason in ('new_stock', 'return') and p_change < 0 then
    raise exception 'New stock and returns must add stock (positive number)';
  end if;
  if char_length(p_note) > 300 then
    raise exception 'Note is too long (max 300 characters)';
  end if;

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

-- ---------------------------------------------------------------------
-- 2. Service is called "fall & beading / pico" (project brief §2)
-- ---------------------------------------------------------------------
alter table public.settings rename column fall_pico_price to fall_beading_price;

-- ---------------------------------------------------------------------
-- 3. Payment method: only 'upi' allowed for now. To add Cash on Delivery
--    later, drop and re-create orders_payment_method_check with 'cod'.
-- ---------------------------------------------------------------------
alter table public.orders
  add column payment_method text not null default 'upi'
  constraint orders_payment_method_check check (payment_method in ('upi'));

-- ---------------------------------------------------------------------
-- 4. Private shop inventory — completely independent of products
-- ---------------------------------------------------------------------
create sequence public.shop_item_code_seq;

create table public.shop_items (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique
                         default ('SHOP-' || lpad(nextval('public.shop_item_code_seq')::text, 4, '0')),
  name                 text not null check (char_length(name) between 2 and 120),
  category             text check (char_length(category) <= 60),
  fabric               text check (char_length(fabric) <= 60),
  color                text check (char_length(color) <= 60),
  cost_price           numeric(10, 2) check (cost_price is null or cost_price >= 0),   -- her own records
  selling_price        numeric(10, 2) not null check (selling_price > 0),
  qty                  integer not null default 0 check (qty >= 0),   -- change ONLY via adjust_shop_stock()
  low_stock_threshold  integer not null default 1 check (low_stock_threshold >= 0),
  photo_path           text check (char_length(photo_path) <= 300),  -- in the private 'shop-item-photos' bucket
  notes                text check (char_length(notes) <= 1000),
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index shop_items_is_active_idx on public.shop_items (is_active);

create trigger shop_items_set_updated_at
  before update on public.shop_items
  for each row execute function public.set_updated_at();

create table public.shop_stock_movements (
  id            bigint generated always as identity primary key,
  shop_item_id  uuid not null references public.shop_items (id) on delete restrict,
  change        integer not null check (change <> 0),
  reason        text not null check (reason in ('received', 'sold', 'returned', 'damaged', 'adjustment')),
  note          text check (char_length(note) <= 300),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index shop_stock_movements_item_idx on public.shop_stock_movements (shop_item_id);
create index shop_stock_movements_created_at_idx on public.shop_stock_movements (created_at desc);

-- Permissions: nothing for visitors; logged-in users get table access, but RLS
-- below lets ONLY admins see or change any row (project brief §9.1).
revoke all on public.shop_items, public.shop_stock_movements from anon, authenticated;
revoke all on sequence public.shop_item_code_seq from anon, authenticated;
grant select on public.shop_items, public.shop_stock_movements to authenticated;
grant insert (name, category, fabric, color, cost_price, selling_price, low_stock_threshold, photo_path, notes, is_active)
  on public.shop_items to authenticated;
grant update (name, category, fabric, color, cost_price, selling_price, low_stock_threshold, photo_path, notes, is_active)
  on public.shop_items to authenticated;
grant usage on sequence public.shop_item_code_seq to authenticated;

alter table public.shop_items           enable row level security;
alter table public.shop_stock_movements enable row level security;

create policy "shop_items: admin read" on public.shop_items
  for select to authenticated using ((select public.is_admin()));
create policy "shop_items: admin insert" on public.shop_items
  for insert to authenticated with check ((select public.is_admin()));
create policy "shop_items: admin update" on public.shop_items
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "shop_stock_movements: admin read" on public.shop_stock_movements
  for select to authenticated using ((select public.is_admin()));

-- Activity log: also skip 'qty' (adjust_shop_stock logs it itself).
-- CREATE OR REPLACE keeps the permissions set in 006.
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
  if not public.is_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_object_agg(n.key, jsonb_build_object('from', v_old -> n.key, 'to', n.value)), '{}')
      into v_details
      from jsonb_each(v_new) as n
     where n.value is distinct from v_old -> n.key
       and n.key not in ('updated_at', 'stock', 'qty');
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

create trigger shop_items_audit
  after insert or update or delete on public.shop_items
  for each row execute function public.audit_admin_change();

-- adjust_shop_stock(): the ONLY way to change shop qty. Admin only, never below 0,
-- writes shop_stock_movements + activity log. Returns the new qty.
create or replace function public.adjust_shop_stock(
  p_item_id uuid,
  p_change  integer,
  p_reason  text,
  p_note    text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qty integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change shop stock' using errcode = '42501';
  end if;
  if p_change is null or p_change = 0 or abs(p_change) > 1000 then
    raise exception 'Quantity change must be a whole number between -1000 and 1000 (not 0)';
  end if;
  if p_reason is null or p_reason not in ('received', 'sold', 'returned', 'damaged', 'adjustment') then
    raise exception 'Reason must be received, sold, returned, damaged or adjustment';
  end if;
  if p_reason in ('received', 'returned') and p_change < 0 then
    raise exception 'Received and returned must add stock (positive number)';
  end if;
  if p_reason in ('sold', 'damaged') and p_change > 0 then
    raise exception 'Sold and damaged must reduce stock (negative number)';
  end if;
  if char_length(p_note) > 300 then
    raise exception 'Note is too long (max 300 characters)';
  end if;

  select qty into v_qty from public.shop_items where id = p_item_id for update;
  if not found then
    raise exception 'Shop item not found';
  end if;
  if v_qty + p_change < 0 then
    raise exception 'Not enough stock: only % left', v_qty;
  end if;

  update public.shop_items set qty = qty + p_change where id = p_item_id;

  insert into public.shop_stock_movements (shop_item_id, change, reason, note, created_by)
  values (p_item_id, p_change, p_reason, p_note, auth.uid());

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'shop_stock_' || p_reason, 'shop_items', p_item_id::text,
          jsonb_build_object('change', p_change, 'qty_before', v_qty,
                             'qty_after', v_qty + p_change, 'note', p_note));

  return v_qty + p_change;
end;
$$;

revoke execute on function public.adjust_shop_stock(uuid, integer, text, text) from public, anon;
grant execute on function public.adjust_shop_stock(uuid, integer, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Private bucket for shop-item photos (NOT public, admins only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('shop-item-photos', 'shop-item-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = false,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "shop-item-photos: admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'shop-item-photos' and (select public.is_admin()));
create policy "shop-item-photos: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'shop-item-photos' and (select public.is_admin()));
create policy "shop-item-photos: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'shop-item-photos' and (select public.is_admin()))
  with check (bucket_id = 'shop-item-photos' and (select public.is_admin()));
create policy "shop-item-photos: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'shop-item-photos' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- 6. Shop info: short postal address for display, Maps address for links
-- ---------------------------------------------------------------------
update public.settings
set shop_info = shop_info || jsonb_build_object(
  'address',      'Shop No. 15, Soormalhar Apartment, Sector 36, Near Shree Mahalaxmi Ladies Tailor, Kamothe, Navi Mumbai – 410209, Maharashtra',
  'maps_address', 'Vaibhav Laxmi Saree, Shop No. 15, Soormalhar Apartment Complex, Nirmala CHS, Sector 36, Kamothe, Mansarovar, Thane, Panvel, Maharashtra 410209, India',
  'gstin',        '27AQSPM3230A1Z2'
)
where id = 1;
