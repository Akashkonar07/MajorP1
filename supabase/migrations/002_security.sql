-- =====================================================================
-- 002_security.sql — who can read/write what (project brief §9)
-- Two layers:
--   1. GRANTs   = which tables/columns a role may touch at all
--   2. RLS      = which ROWS they may touch
-- Roles: anon = not logged in, authenticated = logged in (customer or admin)
-- =====================================================================

-- ---------------------------------------------------------------------
-- is_admin(): the ONE admin check used by every policy and admin function
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Layer 1: start from NOTHING, then grant only what the app needs
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tables/functions created LATER are also closed until a migration grants them explicitly
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Public catalogue (visitors can browse)
grant select on public.categories, public.products, public.product_images, public.settings to anon, authenticated;

-- Customer's own data
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;           -- NOT role
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.orders, public.order_items to authenticated;          -- writes only via functions

-- Admin-only tables (RLS below limits rows to admins)
grant select on public.stock_movements, public.admin_activity_log to authenticated;

-- Admin catalogue writes. Note: 'stock', 'code' and 'slug' are NOT in these lists,
-- so nobody can set them directly — stock changes go through adjust_stock().
grant insert (name, description, category_id, fabric, color, color_hex, occasions, care_instructions,
              price, mrp, low_stock_threshold, blouse_included, is_active, is_placeholder)
  on public.products to authenticated;
grant update (name, description, category_id, fabric, color, color_hex, occasions, care_instructions,
              price, mrp, low_stock_threshold, blouse_included, is_active, is_placeholder)
  on public.products to authenticated;
grant usage on sequence public.product_code_seq to authenticated;             -- auto product code

grant insert (product_id, storage_path, sort_order), delete on public.product_images to authenticated;
grant update (sort_order) on public.product_images to authenticated;

grant insert (name, slug, is_active), update (name, slug, is_active), delete on public.categories to authenticated;

grant update (upi_id, whatsapp_number, delivery_charge_maharashtra, delivery_charge_rest_of_india,
              fall_pico_price, banners, shop_info)
  on public.settings to authenticated;

-- ---------------------------------------------------------------------
-- Layer 2: Row Level Security on EVERY table
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.addresses          enable row level security;
alter table public.categories         enable row level security;
alter table public.products           enable row level security;
alter table public.product_images     enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;
alter table public.stock_movements    enable row level security;
alter table public.settings           enable row level security;
alter table public.admin_activity_log enable row level security;

-- profiles: see/edit your own; admins see all. (Role can't be changed: no column grant.)
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- addresses: only your own; admins can read (to see delivery details)
create policy "addresses: owner full access" on public.addresses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "addresses: admin read" on public.addresses
  for select to authenticated
  using ((select public.is_admin()));

-- categories: everyone sees active ones; admins see and change all
create policy "categories: read active or admin" on public.categories
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin update" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

-- products: everyone sees active ones; admins see hidden ones and edit. No deleting (hide instead).
create policy "products: read active or admin" on public.products
  for select to anon, authenticated
  using (is_active or (select public.is_admin()));
create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- product_images: visible when the saree is visible; admins manage
create policy "product_images: read if product visible" on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_active or (select public.is_admin()))
  ));
create policy "product_images: admin insert" on public.product_images
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_images: admin update" on public.product_images
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_images: admin delete" on public.product_images
  for delete to authenticated using ((select public.is_admin()));

-- orders / order_items: customers see only their own; admins see all.
-- No insert/update policies: orders change only through database functions (steps 6–7).
create policy "orders: read own or admin" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "order_items: read own or admin" on public.order_items
  for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
  ));

-- stock register + activity log: admins read only. Nobody edits or deletes rows.
create policy "stock_movements: admin read" on public.stock_movements
  for select to authenticated using ((select public.is_admin()));
create policy "admin_activity_log: admin read" on public.admin_activity_log
  for select to authenticated using ((select public.is_admin()));

-- settings: everyone reads (WhatsApp number, delivery charges, UPI ID are public); admins edit
create policy "settings: read" on public.settings
  for select to anon, authenticated using (true);
create policy "settings: admin update" on public.settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
