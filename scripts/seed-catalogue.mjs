// Loads the real catalogue (catalogue/products.json) into Supabase and uploads
// the photos to the public 'products' storage bucket, keeping the same paths.
//
// Uses the SERVICE_ROLE key from scripts/.env (git-ignored). That key skips all
// security rules, so it must only ever be used here — never in client/.
//
// Safe to re-run: sarees, colours and photo rows are matched by code / colour /
// path and updated, never duplicated. Photos already in storage are skipped
// (pass --force to upload them again). Online stock is never touched.
//
// Run from the scripts/ folder:   npm run seed
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'catalogue');
const BUCKET = 'products';
const FORCE = process.argv.includes('--force');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in scripts/.env (see scripts/.env.example)');
  process.exit(1);
}
if (key.startsWith('sb_publishable_')) {
  console.error('That is the publishable key. The seed script needs the SECRET (service_role) key.');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// Swatch colours for the colour names in the catalogue. Two-tone / pattern names
// ("Beige & Red", "Cream Check") use their first colour. Unknown names get no swatch.
const HEX = {
  Aqua: '#00b5b8', Beige: '#d9c4a0', Black: '#1c1c1c', Blue: '#2a5db0', Brown: '#7b4a2d',
  Cherry: '#9b1b30', Coral: '#f0765f', Cream: '#f3e5c8', 'Dark Purple': '#4b1f5e', 'Dark Wine': '#4a0e1e',
  Gold: '#c9a227', Green: '#2e7d32', Grey: '#8a8a8a', 'Grey Green': '#7d8f7a', Lavender: '#b39ddb',
  Lemon: '#f2e35c', 'Light Pink': '#f6c1cc', 'Light Purple': '#c3a3d9', Lime: '#a6cf3a', Magenta: '#c2185b',
  Maroon: '#6d0f2a', Mehendi: '#6b7d2a', Morpich: '#0f6e6e', Mustard: '#d4a017', Navy: '#1f2a52',
  Olive: '#6b6b2a', Orange: '#ef7d22', 'Parrot Green': '#5bbf3b', Peach: '#f6b99b', Pink: '#e86a9a',
  Pista: '#b8d8a0', Purple: '#7b4fa0', Rani: '#d4116e', 'Rani Pink': '#d4116e', Red: '#c62828',
  Rose: '#e8798e', 'Rose Red': '#d32f50', 'Royal Blue': '#1a3c8f', Rust: '#b7410e', Sage: '#9caf88',
  'Sky Blue': '#7ec8e3', Teal: '#00796b', 'Teal Blue': '#1f6f8b', 'Tomato Red': '#e5452f',
  Violet: '#6a3fa0', White: '#fafafa', Wine: '#722f37', Yellow: '#f4c430',
};
const swatch = name => {
  if (HEX[name]) return HEX[name];
  const first = name.split(' & ')[0].replace(/\s+(Check|Floral|Ajrakh|Stripe)$/i, '');
  return HEX[first] ?? null;
};

const fail = (what, error) => {
  console.error(`✘ ${what}: ${error.message}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
const catalogue = JSON.parse(await readFile(join(ROOT, 'products.json'), 'utf8'));
const products = catalogue.products;

// Check every photo exists before changing anything
const allImages = products.flatMap(p => [...p.variants.flatMap(v => v.images), ...(p.shared_images ?? [])]);
const missing = allImages.filter(p => !existsSync(join(ROOT, p)));
if (missing.length) fail('Photos missing on disk', new Error(missing.slice(0, 5).join(', ')));
if (allImages.some(p => p.startsWith('unmatched/'))) fail('Safety check', new Error('unmatched/ photos must never be published'));
console.log(`Catalogue: ${products.length} sarees, ${products.reduce((s, p) => s + p.variants.length, 0)} colours, ${allImages.length} photos\n`);

const { data: cats, error: catErr } = await db.from('categories').select('id, name');
if (catErr) fail('Reading categories (did you run migration 008?)', catErr);
const categoryId = Object.fromEntries(cats.map(c => [c.name, c.id]));
const unknownCats = [...new Set(products.map(p => p.category))].filter(c => !categoryId[c]);
if (unknownCats.length) fail('Unknown categories', new Error(unknownCats.join(', ')));

// Uploads a list of photos, a few at a time, skipping ones already in storage
async function uploadPhotos(code, paths) {
  let existing = new Set();
  if (!FORCE) {
    const { data, error } = await db.storage.from(BUCKET).list(`images/${code}`, { limit: 1000 });
    if (error) fail(`Listing storage for ${code}`, error);
    existing = new Set(data.map(f => `images/${code}/${f.name}`));
  }
  const todo = paths.filter(p => !existing.has(p));
  for (let i = 0; i < todo.length; i += 6) {
    await Promise.all(todo.slice(i, i + 6).map(async path => {
      const body = await readFile(join(ROOT, path));
      const { error } = await db.storage.from(BUCKET).upload(path, body, {
        contentType: 'image/webp', cacheControl: '31536000', upsert: true,
      });
      if (error) fail(`Uploading ${path}`, error);
    }));
  }
  return todo.length;
}

let uploaded = 0;
for (const [n, p] of products.entries()) {
  // 1. The saree (matched by code)
  const { data: prod, error: prodErr } = await db.from('products').upsert({
    code: p.code,
    name: p.name,
    description: p.description,
    category_id: categoryId[p.category],
    fabric: p.fabric,
    occasions: p.occasions,
    price: p.price,
    blouse_included: p.blouse_included,
    is_active: true,
    is_placeholder: false,
  }, { onConflict: 'code' }).select('id').single();
  if (prodErr) fail(`Saving ${p.code}`, prodErr);

  // 2. Her private base price (admin-only table). The price rule trigger re-checks the website price.
  const { error: costErr } = await db.from('product_costs')
    .upsert({ product_id: prod.id, base_price: p.base_price }, { onConflict: 'product_id' });
  if (costErr) fail(`Saving base price for ${p.code}`, costErr);

  // 3. Colours (matched by saree + colour name). 'stock' is not sent, so it stays NULL / unchanged.
  const { data: variants, error: varErr } = await db.from('product_variants').upsert(
    p.variants.map((v, i) => ({
      product_id: prod.id, color_name: v.color_name, color_hex: swatch(v.color_name), sort_order: i, is_active: true,
    })),
    { onConflict: 'product_id,color_name' },
  ).select('id, color_name');
  if (varErr) fail(`Saving colours for ${p.code}`, varErr);
  const variantId = Object.fromEntries(variants.map(v => [v.color_name, v.id]));

  // 4. Photos: upload files, then save one row per photo (matched by path)
  uploaded += await uploadPhotos(p.code, [...p.variants.flatMap(v => v.images), ...(p.shared_images ?? [])]);
  const imageRows = [
    ...p.variants.flatMap(v => v.images.map((path, i) => ({
      product_id: prod.id, variant_id: variantId[v.color_name], storage_path: path, sort_order: i,
    }))),
    ...(p.shared_images ?? []).map((path, i) => ({
      product_id: prod.id, variant_id: null, storage_path: path, sort_order: 100 + i,
    })),
  ];
  const { error: imgErr } = await db.from('product_images').upsert(imageRows, { onConflict: 'storage_path' });
  if (imgErr) fail(`Saving photo rows for ${p.code}`, imgErr);

  console.log(`✔ ${String(n + 1).padStart(2)}/${products.length} ${p.code}  ${p.variants.length} colours  ₹${p.price}  ${p.name}`);
}

// Summary straight from the database
const count = async table => (await db.from(table).select('*', { count: 'exact', head: true })).count;
console.log(`\nUploaded ${uploaded} new photos${FORCE ? ' (forced)' : ''}.`);
console.log(`Database now has: ${await count('products')} sarees, ${await count('product_variants')} colours, ` +
  `${await count('product_images')} photo rows, ${await count('product_costs')} base prices.`);
