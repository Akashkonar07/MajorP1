// Computes a visual "fingerprint" (CLIP ViT-B/32 image embedding, 512 numbers) for
// every saree photo and saves it in product_image_embeddings (migration 012).
// These power "Similar sarees" and "Search by photo" on the website.
//
// The website uses the SAME model in the browser, so customer photos and catalogue
// photos are compared like with like.
//
// Uses the SERVICE_ROLE key from scripts/.env (git-ignored) — never from client/.
// Safe to re-run: photos that already have a fingerprint are skipped
// (pass --force to redo them all).
//
// Run from the scripts/ folder:   npm run embed
import { createClient } from '@supabase/supabase-js';
import { AutoProcessor, CLIPVisionModelWithProjection, RawImage } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/clip-vit-base-patch32';
const MODEL_NAME = 'clip-vit-base-patch32';
const FORCE = process.argv.includes('--force');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in scripts/.env (see scripts/.env.example)');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

// Reads every row of a table, 1000 at a time
async function fetchAll(table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

// Downloads a photo with a time limit and up to 3 tries (a stuck download must not stop the run)
async function download(photoUrl) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(photoUrl, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.blob();
    } catch (e) {
      if (attempt === 3) throw e;
    }
  }
}

const unit = values => {
  const n = Math.hypot(...values);
  return values.map(x => x / n);
};

const images = await fetchAll('product_images', 'id, product_id, variant_id, storage_path');
const done = new Set((await fetchAll('product_image_embeddings', 'image_id, model'))
  .filter(r => r.model === MODEL_NAME).map(r => r.image_id));
const todo = FORCE ? images : images.filter(i => !done.has(i.id));
console.log(`${images.length} photos, ${done.size} already done, ${todo.length} to process`);
if (!todo.length) process.exit(0);

console.log('Loading the image model (first run downloads about 85 MB)…');
const processor = await AutoProcessor.from_pretrained(MODEL_ID);
const vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: 'q8' });

let ok = 0;
const failed = [];
const started = Date.now();
for (const [n, img] of todo.entries()) {
  try {
    const photoUrl = `${url}/storage/v1/object/public/products/${img.storage_path}`;
    const image = await RawImage.fromBlob(await download(photoUrl));
    const { image_embeds } = await vision(await processor(image));
    const embedding = unit(Array.from(image_embeds.data));
    const { error } = await db.from('product_image_embeddings').upsert({
      image_id: img.id, product_id: img.product_id, variant_id: img.variant_id,
      embedding: JSON.stringify(embedding), model: MODEL_NAME,
    });
    if (error) throw error;
    ok++;
  } catch (e) {
    failed.push(`${img.storage_path}: ${e.message}`);
  }
  if ((n + 1) % 25 === 0 || n + 1 === todo.length) {
    console.log(`  ${n + 1}/${todo.length}  (${((Date.now() - started) / (n + 1)).toFixed(0)} ms per photo)`);
  }
}
console.log(`Done: ${ok} saved, ${failed.length} failed`);
for (const f of failed) console.log('  ✗', f);
process.exitCode = failed.length ? 1 : 0;
