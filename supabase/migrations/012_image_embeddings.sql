-- =====================================================================
-- 012_image_embeddings.sql — visual search ("Similar sarees", "Search by photo")
-- Run ONCE in Supabase → SQL Editor, after 011.
--
-- Every saree photo gets a 512-number "fingerprint" (an image embedding from the
-- CLIP ViT-B/32 model). Photos that look alike have fingerprints that are close.
--
--   1. product_image_embeddings — one row per photo; admins only (even reading)
--   2. similar_sarees()         — sarees that look like a given saree (anyone)
--   3. search_by_embedding()    — sarees that look like a customer's photo (anyone).
--                                  The photo itself never leaves the customer's
--                                  browser: only its fingerprint is sent.
--   4. admin_save_embedding()   — store the fingerprint of a newly added photo
--
-- The fingerprints themselves are never returned to customers.
-- =====================================================================

create extension if not exists vector with schema extensions;

create table public.product_image_embeddings (
  image_id    uuid primary key references public.product_images (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  variant_id  uuid references public.product_variants (id) on delete cascade,
  embedding   extensions.vector(512) not null,
  model       text not null default 'clip-vit-base-patch32' check (char_length(model) <= 60),
  created_at  timestamptz not null default now()
);
create index product_image_embeddings_product_idx on public.product_image_embeddings (product_id);

revoke all on public.product_image_embeddings from anon, authenticated;
grant select on public.product_image_embeddings to authenticated;           -- RLS: admins only
alter table public.product_image_embeddings enable row level security;
create policy "product_image_embeddings: admin read" on public.product_image_embeddings
  for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- similar_sarees(saree, how many) → other live sarees, most alike first.
-- The saree is represented by the average of its photos' fingerprints;
-- each other saree scores by its closest photo.
-- ---------------------------------------------------------------------
create function public.similar_sarees(p_product_id uuid, p_limit integer default 8)
returns table (product_id uuid, score real)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_centre extensions.vector(512);
begin
  if p_limit is null or p_limit not between 1 and 24 then
    raise exception 'Limit must be between 1 and 24';
  end if;

  select extensions.avg(e.embedding) into v_centre
    from public.product_image_embeddings e
    join public.products p on p.id = e.product_id
   where e.product_id = p_product_id and p.is_active;
  if v_centre is null then
    return;                                     -- unknown, hidden or not yet processed: no suggestions
  end if;

  return query
    select e.product_id, (1 - min(e.embedding operator(extensions.<=>) v_centre))::real as score
      from public.product_image_embeddings e
      join public.products p on p.id = e.product_id and p.is_active
      left join public.product_variants v on v.id = e.variant_id
     where e.product_id <> p_product_id
       and (e.variant_id is null or v.is_active)
     group by e.product_id
     order by score desc
     limit p_limit;
end;
$$;
revoke execute on function public.similar_sarees(uuid, integer) from public;
grant execute on function public.similar_sarees(uuid, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- search_by_embedding(fingerprint of the customer's photo, how many)
-- → live sarees, best-matching photo per saree (its colour too), most alike first
-- ---------------------------------------------------------------------
create function public.search_by_embedding(p_embedding extensions.vector, p_limit integer default 12)
returns table (product_id uuid, variant_id uuid, image_id uuid, score real)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_embedding is null or extensions.vector_dims(p_embedding) <> 512 then
    raise exception 'Expected a 512-number photo fingerprint';
  end if;
  if p_limit is null or p_limit not between 1 and 24 then
    raise exception 'Limit must be between 1 and 24';
  end if;

  return query
    select best.product_id, best.variant_id, best.image_id, best.score
      from (
        select distinct on (e.product_id)
               e.product_id, e.variant_id, e.image_id,
               (1 - (e.embedding operator(extensions.<=>) p_embedding::extensions.vector(512)))::real as score
          from public.product_image_embeddings e
          join public.products p on p.id = e.product_id and p.is_active
          left join public.product_variants v on v.id = e.variant_id
         where e.variant_id is null or v.is_active
         order by e.product_id, e.embedding operator(extensions.<=>) p_embedding::extensions.vector(512)
      ) best
     order by best.score desc
     limit p_limit;
end;
$$;
revoke execute on function public.search_by_embedding(extensions.vector, integer) from public;
grant execute on function public.search_by_embedding(extensions.vector, integer) to anon, authenticated;

-- ---------------------------------------------------------------------
-- admin_save_embedding(photo, fingerprint, model) — for photos added in the admin panel
-- ---------------------------------------------------------------------
create function public.admin_save_embedding(p_image_id uuid, p_embedding extensions.vector, p_model text default 'clip-vit-base-patch32')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_img public.product_images;
begin
  if not public.is_admin() then
    raise exception 'Only admins can save photo fingerprints' using errcode = '42501';
  end if;
  if p_embedding is null or extensions.vector_dims(p_embedding) <> 512 then
    raise exception 'Expected a 512-number photo fingerprint';
  end if;
  select * into v_img from public.product_images where id = p_image_id;
  if not found then
    raise exception 'Photo not found';
  end if;

  insert into public.product_image_embeddings (image_id, product_id, variant_id, embedding, model)
  values (v_img.id, v_img.product_id, v_img.variant_id, p_embedding::extensions.vector(512), coalesce(p_model, 'clip-vit-base-patch32'))
  on conflict (image_id) do update
    set product_id = excluded.product_id, variant_id = excluded.variant_id,
        embedding = excluded.embedding, model = excluded.model, created_at = now();
end;
$$;
revoke execute on function public.admin_save_embedding(uuid, extensions.vector, text) from public, anon;
grant execute on function public.admin_save_embedding(uuid, extensions.vector, text) to authenticated;
