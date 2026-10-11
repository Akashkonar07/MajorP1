-- =====================================================================
-- 008_catalogue_variants.sql — reshape the database for the REAL catalogue
-- (project brief §2 and §7, brief of 11 Oct 2026)
--   1. Remove the 12 sample sarees and the 5 provisional categories
--   2. Add the 9 real categories
--   3. Products: colour variants, private base price, price rule, new fields
--   4. Stock lives on colour variants (NULL = not tracked yet)
--   5. services table (tailoring price list) + settings (UPI, delivery zones)
--   6. Public 'products' storage bucket (admin-only uploads)
-- Run ONCE in Supabase → SQL Editor, after 001–007.
-- Then run the seed script (scripts/seed-catalogue.mjs) to load the 49 sarees.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Safety check: only sample data may exist at this point
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from public.products where not is_placeholder) then
    raise exception 'Real products already exist — this migration expects only the sample sarees';
  end if;
  if exists (select 1 from public.orders) then
    raise exception 'Orders already exist — review before running this migration';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. Remove sample sarees and provisional categories
-- ---------------------------------------------------------------------
delete from public.product_images where product_id in (select id from public.products where is_placeholder);
delete from public.stock_movements;                      -- only the sample opening stock
delete from public.products where is_placeholder;
delete from public.categories;                            -- the 5 provisional ones

-- ---------------------------------------------------------------------
-- 2. The 9 real categories (project brief §2)
-- ---------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Silk Sarees',           'silk-sarees'),
  ('Georgette Sarees',      'georgette-sarees'),
  ('Designer Sarees',       'designer-sarees'),
  ('Bandhani Sarees',       'bandhani-sarees'),
  ('Banarasi Sarees',       'banarasi-sarees'),
  ('Paithani Sarees',       'paithani-sarees'),
  ('Festive Specials',      'festive-specials'),
  ('Cotton & Linen Sarees', 'cotton-linen-sarees'),
  ('Chiffon Sarees',        'chiffon-sarees')
on conflict (slug) do update set name = excluded.name, is_active = true;

-- ---------------------------------------------------------------------
-- 3. Products: new fields; stock/colour/MRP move to variants (or are not used)
-- ---------------------------------------------------------------------
drop function public.adjust_stock(uuid, integer, text, text);   -- re-created for variants below

alter table public.products
  add column work            text check (char_length(work) <= 300),
  add column blouse_details  text check (char_length(blouse_details) <= 300),
  add column saree_length_m  numeric(4, 2) check (saree_length_m is null or saree_length_m between 1 and 12),
  add column price_is_manual boolean not null default false;      -- true = admin overrode the price rule

alter table public.products
  drop column stock,
  drop column mrp,                  -- no MRP / strike-through unless the owner gives one
  drop column color,
  drop column color_hex,
  drop column low_stock_threshold;

-- Product codes: VLS-001 style (3 digits, like the catalogue). Highest real code is VLS-053.
create or replace function public.next_product_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  v bigint := nextval('public.product_code_seq');
begin
  return 'VLS-' || case when v < 1000 then lpad(v::text, 3, '0') else v::text end;
end;
$$;
alter table public.products alter column code set default public.next_product_code();
select setval('public.product_code_seq', 53);
revoke execute on function public.next_product_code() from public, anon;
grant execute on function public.next_product_code() to authenticated;

-- Admins may write the new columns too (stock is no longer on products)
grant insert (work, blouse_details, saree_length_m, price_is_manual) on public.products to authenticated;
grant update (work, blouse_details, saree_length_m, price_is_manual) on public.products to authenticated;

-- ---------------------------------------------------------------------
-- 3b. Private base price + price rule
-- ---------------------------------------------------------------------
create table public.product_costs (
  product_id  uuid primary key references public.products (id) on delete cascade,
  base_price  numeric(10, 2) not null check (base_price > 0),
  updated_at  timestamptz not null default now()
);
create trigger product_costs_set_updated_at
  before update on public.product_costs
  for each row execute function public.set_updated_at();

-- Owner's rule: website price = base + 300 if base < 1100, else base + 500
create or replace function public.website_price(p_base numeric)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select p_base + case when p_base < 1100 then 300 else 500 end;
$$;
revoke execute on function public.website_price(numeric) from public, anon;
grant execute on function public.website_price(numeric) to authenticated;

-- When a base price is saved, update the website price (unless the admin overrode it)
create or replace function public.apply_price_rule()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
     set price = public.website_price(new.base_price)
   where id = new.product_id
     and not price_is_manual;
  return new;
end;
$$;
revoke execute on function public.apply_price_rule() from public, anon, authenticated;

create trigger product_costs_apply_price_rule
  after insert or update of base_price on public.product_costs
  for each row execute function public.apply_price_rule();

-- ---------------------------------------------------------------------
-- 4. Colour variants (stock NULL = not tracked yet, project brief §2)
-- ---------------------------------------------------------------------
create table public.product_variants (
  id                   uuid primary key default gen_random_uuid(),
  product_id           uuid not null references public.products (id) on delete cascade,
  color_name           text not null check (char_length(color_name) between 1 and 40),
  color_hex            text check (color_hex ~ '^#[0-9a-fA-F]{6}$'),
  stock                integer check (stock is null or stock >= 0),   -- change ONLY via adjust_stock()
  low_stock_threshold  integer not null default 1 check (low_stock_threshold >= 0),
  is_active            boolean not null default true,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (product_id, color_name)
);
create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- Images can belong to one colour (variant_id) or be shared by all colours (NULL)
alter table public.product_images
  add column variant_id uuid references public.product_variants (id) on delete cascade;
create index product_images_variant_id_idx on public.product_images (variant_id);
grant insert (variant_id) on public.product_images to authenticated;
grant update (variant_id) on public.product_images to authenticated;

-- Stock register is per colour now
alter table public.stock_movements drop column product_id;
alter table public.stock_movements
  add column variant_id uuid not null references public.product_variants (id) on delete restrict;
create index stock_movements_variant_id_idx on public.stock_movements (variant_id);

-- Orders remember which colour was bought
alter table public.order_items
  add column variant_id     uuid references public.product_variants (id) on delete set null,
  add column color_snapshot text check (char_length(color_snapshot) <= 40);

-- adjust_stock(): the ONLY way to change a colour's online stock. Admin only.
-- If stock is NULL (not tracked yet), the first change starts counting from 0.
create function public.adjust_stock(
  p_variant_id uuid,
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
  v_stock  integer;
  v_before integer;
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

  select stock into v_stock from public.product_variants where id = p_variant_id for update;
  if not found then
    raise exception 'Colour not found';
  end if;
  v_before := coalesce(v_stock, 0);
  if v_before + p_change < 0 then
    raise exception 'Not enough stock: only % left', v_before;
  end if;

  update public.product_variants set stock = v_before + p_change where id = p_variant_id;

  insert into public.stock_movements (variant_id, change, reason, note, created_by)
  values (p_variant_id, p_change, p_reason, p_note, auth.uid());

  insert into public.admin_activity_log (admin_id, action, entity, entity_id, details)
  values (auth.uid(), 'stock_' || p_reason, 'product_variants', p_variant_id::text,
          jsonb_build_object('change', p_change, 'stock_before', v_stock,
                             'stock_after', v_before + p_change, 'note', p_note));

  return v_before + p_change;
end;
$$;
revoke execute on function public.adjust_stock(uuid, integer, text, text) from public, anon;
grant execute on function public.adjust_stock(uuid, integer, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- 5. Services (tailoring price list, project brief §2) + settings
-- ---------------------------------------------------------------------
create table public.services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique check (char_length(name) between 2 and 80),
  price            numeric(10, 2) not null check (price >= 0),
  duration_text    text check (char_length(duration_text) <= 40),
  is_online_addon  boolean not null default false,   -- only fall beading + pico
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

insert into public.services (name, price, duration_text, is_online_addon, sort_order) values
  ('Fall beading',                     70,  '1–2 days', true,  1),
  ('Pico',                             30,  '1–2 days', true,  2),
  ('Blouse stitching — basic',         250, '~4 days',  false, 3),
  ('Blouse stitching — with lining',   400, '~4 days',  false, 4),
  ('Blouse stitching — prince cut',    450, '~4 days',  false, 5),
  ('Blouse stitching — designer',      550, '~4 days',  false, 6),
  ('Blouse stitching — padded',        650, '~4 days',  false, 7),
  ('Lehenga stitching',                750, 'Ask',      false, 8),
  ('Dress / kurta set with lining',    700, 'Ask',      false, 9),
  ('Dress / kurta set without lining', 450, 'Ask',      false, 10),
  ('Blouse alteration',                40,  'Ask',      false, 11),
  ('Other alteration',                 60,  'Ask',      false, 12)
on conflict (name) do nothing;

-- Fix the UPI ID check from 001: Postgres allows at most {..,255} in a pattern
alter table public.settings drop constraint settings_upi_id_check;
alter table public.settings add constraint settings_upi_id_check
  check (upi_id ~ '^[a-zA-Z0-9._-]{2,255}@[a-zA-Z]{2,64}$');

alter table public.settings
  add column payee_name                  text check (char_length(payee_name) <= 60),
  add column shop_hours                   text check (char_length(shop_hours) <= 60),
  add column delivery_zones               jsonb not null default '[]' check (jsonb_typeof(delivery_zones) = 'array'),
  add column extra_saree_delivery_charge  numeric(10, 2) not null default 30 check (extra_saree_delivery_charge >= 0);
alter table public.settings
  drop column delivery_charge_maharashtra,
  drop column delivery_charge_rest_of_india,
  drop column fall_beading_price;                      -- now in services
grant update (payee_name, shop_hours, delivery_zones, extra_saree_delivery_charge) on public.settings to authenticated;

update public.settings
set upi_id                      = 'Q89619611@ybl',
    payee_name                  = 'Vaibhav Lakshmi',
    shop_hours                  = '10 AM – 10 PM',
    delivery_zones              = '[{"name": "Mumbai & Navi Mumbai", "charge": 60},
                                    {"name": "Rest of Maharashtra", "charge": 80},
                                    {"name": "Rest of India", "charge": 120}]',
    extra_saree_delivery_charge = 30
where id = 1;

-- ---------------------------------------------------------------------
-- 6. Permissions + Row Level Security for the new tables
-- ---------------------------------------------------------------------
revoke all on public.product_costs, public.product_variants, public.services from anon, authenticated;

-- product_costs: admins only, even for reading (her private base price)
grant select, insert (product_id, base_price), update (base_price) on public.product_costs to authenticated;
-- variants + services: everyone reads; admins write ('stock' is not writable: use adjust_stock)
grant select on public.product_variants, public.services to anon, authenticated;
grant insert (product_id, color_name, color_hex, low_stock_threshold, is_active, sort_order),
      update (color_name, color_hex, low_stock_threshold, is_active, sort_order),
      delete
  on public.product_variants to authenticated;
grant insert (name, price, duration_text, is_online_addon, sort_order, is_active),
      update (name, price, duration_text, is_online_addon, sort_order, is_active)
  on public.services to authenticated;

alter table public.product_costs    enable row level security;
alter table public.product_variants enable row level security;
alter table public.services         enable row level security;

create policy "product_costs: admin read" on public.product_costs
  for select to authenticated using ((select public.is_admin()));
create policy "product_costs: admin insert" on public.product_costs
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_costs: admin update" on public.product_costs
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "product_variants: read visible or admin" on public.product_variants
  for select to anon, authenticated
  using ((select public.is_admin()) or (is_active and exists (
    select 1 from public.products p where p.id = product_id and p.is_active)));
create policy "product_variants: admin insert" on public.product_variants
  for insert to authenticated with check ((select public.is_admin()));
create policy "product_variants: admin update" on public.product_variants
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "product_variants: admin delete" on public.product_variants
  for delete to authenticated using ((select public.is_admin()));

create policy "services: read active or admin" on public.services
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "services: admin insert" on public.services
  for insert to authenticated with check ((select public.is_admin()));
create policy "services: admin update" on public.services
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- Activity log for the new tables. product_costs has no 'id' column, so the
-- log function now also falls back to product_id. (CREATE OR REPLACE keeps permissions.)
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
  values (auth.uid(), lower(tg_op), tg_table_name,
          coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'product_id', v_old ->> 'product_id'),
          v_details);

  return coalesce(new, old);
end;
$$;

create trigger product_costs_audit
  after insert or update or delete on public.product_costs
  for each row execute function public.audit_admin_change();
create trigger product_variants_audit
  after insert or update or delete on public.product_variants
  for each row execute function public.audit_admin_change();
create trigger services_audit
  after insert or update or delete on public.services
  for each row execute function public.audit_admin_change();

-- ---------------------------------------------------------------------
-- 7. 'products' storage bucket: anyone can view, only admins change
--    (the seed script uploads with the service_role key, which bypasses RLS)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public             = true,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "products bucket: admin upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "products bucket: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'products' and (select public.is_admin()))
  with check (bucket_id = 'products' and (select public.is_admin()));
create policy "products bucket: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'products' and (select public.is_admin()));
