-- =====================================================================
-- 005_seed.sql — starting data
--   • 5 PROVISIONAL categories (real list still being collected from the shop)
--   • 12 SAMPLE sarees (is_placeholder = true) — same as server/data/products.json
--   • the single settings row
-- Safe to run twice: it does nothing if the sample data already exists.
-- =====================================================================

do $$
begin
  if exists (select 1 from public.products where is_placeholder) then
    raise notice 'Sample data already present — nothing to do.';
    return;
  end if;

  insert into public.categories (name, slug) values
    ('Daily Wear',          'daily-wear'),
    ('Cotton & Linen',      'cotton-linen'),
    ('Silk Sarees',         'silk-sarees'),
    ('Georgette & Chiffon', 'georgette-chiffon'),
    ('Party Wear',          'party-wear')
  on conflict (slug) do nothing;

  -- Codes VLS-0001 … VLS-0012 match the old ids 1 … 12
  insert into public.products
    (code, name, description, category_id, fabric, color, color_hex, occasions, care_instructions,
     price, mrp, stock, is_placeholder)
  select 'VLS-' || lpad(v.n::text, 4, '0'), v.name, v.description, c.id, v.fabric, v.color, v.color_hex, v.occasions, v.care,
         v.price, v.mrp, v.stock, true
  from (values
      (1, 'Printed Cotton Daily Wear Saree', 'A light, breathable printed cotton saree for everyday wear at home or work.', 'cotton-linen', 'Cotton', 'Mustard Yellow', '#d4a017',
       array['Daily Wear']::text[], array['Wash: Hand wash separately in cold water for the first few washes.', 'Dry: Dry in shade to keep the colour bright.']::text[], 349, 449, 8),
      (2, 'Bandhani Print Georgette Saree', 'A flowy georgette saree with a bandhani-style print, easy to drape for festivals and functions.', 'georgette-chiffon', 'Georgette', 'Red', '#b71c1c',
       array['Festive']::text[], array['Wash: Gentle hand wash in cold water or dry clean.', 'Iron: Low heat, on the reverse side.']::text[], 699, 899, 5),
      (3, 'Floral Chiffon Party Saree', 'A soft chiffon saree with a floral print and a simple border, light enough to wear all evening.', 'georgette-chiffon', 'Chiffon', 'Pastel Pink', '#f4a6b7',
       array['Party']::text[], array['Wash: Dry clean recommended.', 'Iron: Low heat only.']::text[], 849, 999, 4),
      (4, 'Banarasi-Style Art Silk Saree', 'An art silk saree with a Banarasi-style woven zari border and pallu, suited to weddings and pujas.', 'silk-sarees', 'Art Silk', 'Maroon', '#6d0f2a',
       array['Wedding']::text[], array['Wash: Dry clean only.', 'Storage: Fold in a cotton cloth and keep away from direct sunlight.']::text[], 1499, 1899, 3),
      (5, 'Semi Paithani Silk Saree', 'A semi silk saree with a Paithani-style peacock border, a favourite for Maharashtrian festivals.', 'silk-sarees', 'Semi Silk', 'Royal Blue', '#1a3c8f',
       array['Festive']::text[], array['Wash: Dry clean only.', 'Storage: Fold in a cotton cloth and keep away from direct sunlight.']::text[], 1899, 2299, 2),
      (6, 'Kanjivaram-Style Soft Silk Saree', 'A soft silk saree with a Kanjivaram-style contrast zari border. Lightweight and comfortable for long ceremonies.', 'silk-sarees', 'Soft Silk', 'Bottle Green', '#0b4d2c',
       array['Wedding']::text[], array['Wash: Dry clean only.', 'Storage: Fold in a cotton cloth and refold every few months.']::text[], 2499, 2999, 1),
      (7, 'Cotton Silk Temple Border Saree', 'A cotton silk saree with a contrast temple border, comfortable for long pujas and family functions.', 'cotton-linen', 'Cotton Silk', 'Ivory', '#e9dfc4',
       array['Festive']::text[], array['Wash: First wash dry clean; later gentle hand wash in cold water.', 'Iron: Medium heat.']::text[], 1199, 1399, 4),
      (8, 'Linen Saree with Tassels', 'A crisp linen-blend saree with tassels on the pallu, smart for office and day events.', 'cotton-linen', 'Linen', 'Mint Green', '#98d7c2',
       array['Office Wear']::text[], array['Wash: Hand wash in cold water.', 'Iron: Medium heat while slightly damp.']::text[], 999, 1199, 6),
      (9, 'Plain Crepe Saree with Lace Border', 'A wrinkle-resistant plain crepe saree with a thin lace border. Easy to maintain for daily office use.', 'daily-wear', 'Crepe', 'Navy Blue', '#1f2a52',
       array['Office Wear']::text[], array['Wash: Machine wash on gentle cycle inside a laundry bag.', 'Iron: Low heat.']::text[], 549, 699, 7),
      (10, 'Embroidered Organza Saree', 'A sheer organza saree with light thread embroidery, made for evening parties and receptions.', 'party-wear', 'Organza', 'Purple', '#7b4fa0',
       array['Party']::text[], array['Wash: Dry clean only.', 'Storage: Store on a padded hanger or fold loosely.']::text[], 1699, 1999, 3),
      (11, 'Printed Synthetic Daily Wear Saree', 'An easy-care printed synthetic saree for daily use. Quick to dry and does not need ironing.', 'daily-wear', 'Synthetic', 'Turquoise', '#1fa2a6',
       array['Daily Wear']::text[], array['Wash: Machine wash on gentle cycle.', 'Dry: Dry in shade.']::text[], 249, null, 12),
      (12, 'Zari Border Tissue Saree', 'A shimmering tissue saree with a wide zari border for weddings and receptions.', 'party-wear', 'Tissue', 'Gold', '#c9a227',
       array['Wedding']::text[], array['Wash: Dry clean only.', 'Storage: Fold in a cotton cloth, away from moisture.']::text[], 2899, null, 0)
  ) as v(n, name, description, category_slug, fabric, color, color_hex, occasions, care, price, mrp, stock)
  join public.categories c on c.slug = v.category_slug;

  -- Next saree added by an admin gets VLS-0013
  perform setval('public.product_code_seq', 12);

  -- Opening stock goes into the stock register so it matches products.stock
  insert into public.stock_movements (product_id, change, reason, note)
  select id, stock, 'new_stock', 'Opening stock (sample data)'
  from public.products
  where is_placeholder and stock > 0;
end;
$$;

-- Settings: WhatsApp + shop info are known. UPI ID, delivery charges and fall/pico
-- price are left EMPTY on purpose (not yet confirmed by the shop) — checkout will
-- refuse to run until an admin fills them in on the Settings page.
insert into public.settings (id, whatsapp_number, shop_info)
values (1, '919320079225', jsonb_build_object(
  'name',       'Vaibhav Laxmi Saree',
  'since',      2016,
  'proprietor', 'Mrs. Mamta Bhandari',
  'address',    'Vaibhav Laxmi Saree, Shop No. 15, Soormalhar Apartment Complex, Nirmala CHS, Sector 36, Kamothe, Mansarovar, Thane, Panvel, Maharashtra 410209, India',
  'phone',      '+91 93200 79225',
  'email',      'mamtavaibhavlaxmi@gmail.com',
  'hours',      '10:00 AM – 10:00 PM'
))
on conflict (id) do nothing;
