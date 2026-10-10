-- =====================================================================
-- 001_schema.sql — tables for Vaibhav Laxmi Saree (project brief §7)
-- Run ONCE in Supabase → SQL Editor. Run the migration files in number order.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Shared trigger: keep updated_at current on every UPDATE
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: one row per login (id = auth user id)
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 100),
  phone       text check (phone ~ '^[6-9][0-9]{9}$'),          -- 10-digit Indian mobile
  role        text not null default 'customer' check (role in ('customer', 'admin')),
  created_at  timestamptz not null default now()
);

-- Every new sign-up gets a profile. Role is ALWAYS 'customer' here;
-- admins are only made by hand with SQL (project brief §9.3).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 100)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- addresses: saved delivery addresses for My Account (extra to §7, approved)
-- ---------------------------------------------------------------------
create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  full_name   text not null check (char_length(full_name) between 2 and 100),
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1       text not null check (char_length(line1) between 3 and 200),
  line2       text check (char_length(line2) <= 200),
  city        text not null check (char_length(city) between 2 and 60),
  state       text not null check (char_length(state) between 2 and 60),
  pincode     text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses (user_id);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products (sarees)
-- ---------------------------------------------------------------------
create sequence public.product_code_seq;

create table public.products (
  id                   uuid primary key default gen_random_uuid(),
  code                 text not null unique
                         default ('VLS-' || lpad(nextval('public.product_code_seq')::text, 4, '0')),
  name                 text not null check (char_length(name) between 3 and 120),
  slug                 text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description          text check (char_length(description) <= 2000),
  category_id          uuid references public.categories (id) on delete set null,
  fabric               text check (char_length(fabric) <= 60),
  color                text check (char_length(color) <= 60),
  color_hex            text check (color_hex ~ '^#[0-9a-fA-F]{6}$'),     -- colour block until photos exist
  occasions            text[] not null default '{}',
  care_instructions    text[] not null default '{}',
  price                numeric(10, 2) not null check (price > 0),
  mrp                  numeric(10, 2) check (mrp is null or mrp >= price),
  stock                integer not null default 0 check (stock >= 0),  -- change ONLY via adjust_stock()
  low_stock_threshold  integer not null default 1 check (low_stock_threshold >= 0),
  blouse_included      boolean not null default true,
  is_active            boolean not null default true,                   -- false = hidden from shop
  is_placeholder       boolean not null default false,                  -- true = sample product
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);

-- Slug (used in URLs) is made automatically from the name + code, e.g. "cotton-saree-vls-0001"
create or replace function public.set_product_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := trim(both '-' from regexp_replace(lower(new.name), '[^a-z0-9]+', '-', 'g'))
                || '-' || lower(new.code);
  end if;
  return new;
end;
$$;

create trigger products_set_slug
  before insert on public.products
  for each row execute function public.set_product_slug();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- product_images (files live in the 'product-images' storage bucket)
-- ---------------------------------------------------------------------
create table public.product_images (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references public.products (id) on delete cascade,
  storage_path  text not null unique check (char_length(storage_path) <= 300),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images (product_id);

-- ---------------------------------------------------------------------
-- orders + order_items (created only by the place_order function, step 6)
-- ---------------------------------------------------------------------
create sequence public.order_no_seq;

create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_no          text not null unique
                      default ('VLS' || lpad(nextval('public.order_no_seq')::text, 5, '0')),
  user_id           uuid not null references public.profiles (id) on delete restrict,
  status            text not null default 'payment_pending' check (status in (
                      'payment_pending', 'payment_verified', 'packed', 'shipped', 'delivered',
                      'cancelled', 'return_requested', 'returned', 'exchange_requested')),
  subtotal          numeric(10, 2) not null check (subtotal >= 0),
  addons_total      numeric(10, 2) not null default 0 check (addons_total >= 0),
  delivery_charge   numeric(10, 2) not null default 0 check (delivery_charge >= 0),
  total             numeric(10, 2) not null,
  shipping_address  jsonb not null,
  upi_utr           text unique check (upi_utr ~ '^[0-9]{12}$'),       -- 12-digit UPI reference
  payment_status    text not null default 'pending' check (payment_status in ('pending', 'verified', 'rejected')),
  courier           text check (char_length(courier) <= 60),
  tracking_no       text check (char_length(tracking_no) <= 60),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_total_matches check (total = subtotal + addons_total + delivery_charge)
);
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     uuid references public.products (id) on delete set null,
  name_snapshot  text not null,                       -- saree name at the time of ordering
  unit_price     numeric(10, 2) not null check (unit_price > 0),
  qty            integer not null check (qty between 1 and 10),
  addons         jsonb not null default '{}'          -- e.g. {"fall_pico": true}
);
create index order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- stock_movements: the stock register (one row per stock change)
-- ---------------------------------------------------------------------
create table public.stock_movements (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete restrict,
  change      integer not null check (change <> 0),
  reason      text not null check (reason in (
                'new_stock', 'online_order', 'shop_sale', 'order_cancelled', 'return', 'adjustment')),
  note        text check (char_length(note) <= 300),
  order_id    uuid references public.orders (id) on delete set null,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index stock_movements_product_id_idx on public.stock_movements (product_id);
create index stock_movements_created_at_idx on public.stock_movements (created_at desc);

-- ---------------------------------------------------------------------
-- settings: exactly one row (id = 1)
-- ---------------------------------------------------------------------
create table public.settings (
  id                             smallint primary key default 1 check (id = 1),
  upi_id                         text check (upi_id ~ '^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$'),
  whatsapp_number                text check (whatsapp_number ~ '^91[6-9][0-9]{9}$'),
  delivery_charge_maharashtra    numeric(10, 2) check (delivery_charge_maharashtra >= 0),
  delivery_charge_rest_of_india  numeric(10, 2) check (delivery_charge_rest_of_india >= 0),
  fall_pico_price                numeric(10, 2) check (fall_pico_price >= 0),
  banners                        jsonb not null default '[]',
  shop_info                      jsonb not null default '{}',
  updated_at                     timestamptz not null default now()
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- admin_activity_log: append-only record of every admin change
-- ---------------------------------------------------------------------
create table public.admin_activity_log (
  id          bigint generated always as identity primary key,
  admin_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity      text not null,
  entity_id   text,
  details     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index admin_activity_log_created_at_idx on public.admin_activity_log (created_at desc);
