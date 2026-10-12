-- =====================================================================
-- 011_product_events.sql — shopping activity for future recommendations
-- Run ONCE in Supabase → SQL Editor, after 010.
--
-- Records which sarees are viewed, wishlisted, added to the bag and ordered
-- on our own website. No names, emails, phones or addresses are stored:
-- only the saree, the colour, the kind of event, a random browser id
-- (session_id, kept in localStorage) and — when logged in — the account id.
--
--   1. product_events table: nobody can write it directly; only admins can read it
--   2. log_event()           — the ONLY way in: checks the saree, de-duplicates,
--                              rate-limits per browser, ignores admins' own clicks
--   3. admin_product_insights() — counts per saree for the admin dashboard
-- =====================================================================

create table public.product_events (
  id          bigint generated always as identity primary key,
  product_id  uuid not null references public.products (id) on delete cascade,
  variant_id  uuid references public.product_variants (id) on delete set null,
  event       text not null check (event in ('view', 'wishlist_add', 'bag_add', 'order_placed')),
  user_id     uuid references public.profiles (id) on delete set null,
  session_id  text not null check (session_id ~ '^[A-Za-z0-9-]{8,64}$'),
  created_at  timestamptz not null default now()
);
create index product_events_created_at_idx on public.product_events (created_at desc);
create index product_events_session_idx on public.product_events (session_id, created_at desc);
create index product_events_product_idx on public.product_events (product_id, event, created_at desc);

revoke all on public.product_events from anon, authenticated;
grant select on public.product_events to authenticated;            -- RLS below: admins only
alter table public.product_events enable row level security;
create policy "product_events: admin read" on public.product_events
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- log_event(saree, event, browser id, colour?) → true if recorded
-- Quietly returns false (no error) for duplicates, rate limits and admins,
-- so the shop pages never break because of it.
-- ---------------------------------------------------------------------
create function public.log_event(
  p_product_id uuid,
  p_event      text,
  p_session_id text,
  p_variant_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_event is null or p_event not in ('view', 'wishlist_add', 'bag_add', 'order_placed') then
    raise exception 'Unknown event';
  end if;
  if p_session_id is null or p_session_id !~ '^[A-Za-z0-9-]{8,64}$' then
    raise exception 'Invalid session id';
  end if;
  if not exists (select 1 from public.products where id = p_product_id and is_active) then
    raise exception 'Saree not found';
  end if;
  if p_variant_id is not null and not exists (
    select 1 from public.product_variants where id = p_variant_id and product_id = p_product_id
  ) then
    raise exception 'Colour does not belong to this saree';
  end if;

  -- The owner's own clicks would skew the numbers
  if public.is_admin() then
    return false;
  end if;

  -- An "order placed" event must match a real order by this customer in the last 15 minutes
  if p_event = 'order_placed' then
    if v_uid is null or not exists (
      select 1 from public.orders o join public.order_items i on i.order_id = o.id
       where o.user_id = v_uid and i.product_id = p_product_id
         and o.created_at > now() - interval '15 minutes'
    ) then
      raise exception 'No matching order';
    end if;
  end if;

  -- Rate limit: at most 60 events per browser in 10 minutes
  if (select count(*) from public.product_events
       where session_id = p_session_id and created_at > now() - interval '10 minutes') >= 60 then
    return false;
  end if;

  -- De-duplicate: the same saree + event from the same browser counts once
  -- per 30 minutes (views, wishlist, bag) or once per 15 minutes (orders)
  if exists (select 1 from public.product_events
              where session_id = p_session_id and product_id = p_product_id and event = p_event
                and created_at > now() - case when p_event = 'order_placed'
                                              then interval '15 minutes' else interval '30 minutes' end) then
    return false;
  end if;

  insert into public.product_events (product_id, variant_id, event, user_id, session_id)
  values (p_product_id, p_variant_id, p_event, v_uid, p_session_id);
  return true;
end;
$$;
revoke execute on function public.log_event(uuid, text, text, uuid) from public;
grant execute on function public.log_event(uuid, text, text, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
-- admin_product_insights(days) → one row per saree with activity
-- ---------------------------------------------------------------------
create function public.admin_product_insights(p_days integer default 30)
returns table (product_id uuid, code text, name text, views bigint, wishlists bigint, bag_adds bigint, orders bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see insights' using errcode = '42501';
  end if;
  if p_days is null or p_days not between 1 and 365 then
    raise exception 'Days must be between 1 and 365';
  end if;

  return query
    select p.id, p.code, p.name,
           count(*) filter (where e.event = 'view'),
           count(*) filter (where e.event = 'wishlist_add'),
           count(*) filter (where e.event = 'bag_add'),
           count(*) filter (where e.event = 'order_placed')
      from public.product_events e
      join public.products p on p.id = e.product_id
     where e.created_at > now() - make_interval(days => p_days)
     group by p.id, p.code, p.name;
end;
$$;
revoke execute on function public.admin_product_insights(integer) from public, anon;
grant execute on function public.admin_product_insights(integer) to authenticated;
