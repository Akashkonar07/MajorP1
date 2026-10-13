import { supabase } from './supabase';
import { FABRIC_FAMILIES, OCCASIONS } from './catalogue';
import { compressPhoto } from './admin';

// Visual search with the CLIP ViT-B/32 image model, run inside the browser.
// The same model made the catalogue fingerprints (scripts/embed-catalogue.mjs),
// so a customer's photo and the shop's photos are compared like with like.
// The photo itself never leaves the device: only its 512-number fingerprint is sent.
// The image model (85 MB) is downloaded only when someone uses photo search, then cached.

const MODEL_ID = 'Xenova/clip-vit-base-patch32';
export const MODEL_NAME = 'clip-vit-base-patch32';

let libPromise;
let visionPromise;
let colourPromise;

const unit = v => {
  const n = Math.hypot(...v);
  return v.map(x => x / n);
};
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);

function lib() {
  libPromise ??= import('@huggingface/transformers').then(t => {
    t.env.allowLocalModels = false;
    return t;
  });
  return libPromise;
}

// onProgress(percent) while the model downloads (first time only)
export function loadVision(onProgress) {
  visionPromise ??= (async () => {
    const t = await lib();
    const files = {};
    const progress_callback = p => {
      if (p.status === 'progress' && p.total) {
        files[p.file] = [p.loaded, p.total];
        const [done, total] = Object.values(files).reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
        onProgress?.(Math.round((100 * done) / total));
      }
    };
    const [processor, model] = await Promise.all([
      t.AutoProcessor.from_pretrained(MODEL_ID),
      t.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: 'q8', progress_callback }),
    ]);
    return { t, processor, model };
  })();
  visionPromise.catch(() => { visionPromise = undefined; });   // allow a retry after a network error
  return visionPromise;
}

// File/Blob (a photo the person picked) or a URL → 512 numbers
export async function embedImage(source, onProgress) {
  const { t, processor, model } = await loadVision(onProgress);
  let image;
  if (typeof source === 'string') image = await t.RawImage.fromURL(source);
  else image = await t.RawImage.fromBlob(await compressPhoto(source).catch(() => source));   // big phone photos are shrunk first
  const { image_embeds } = await model(await processor(image));
  return unit(Array.from(image_embeds.data));
}

// ---- Customer: search by photo, similar sarees --------------------------------------
export async function searchByPhoto(file, onProgress) {
  const embedding = await embedImage(file, onProgress);
  const { data, error } = await supabase.rpc('search_by_embedding', { p_embedding: JSON.stringify(embedding), p_limit: 12 });
  if (error) throw error;
  return data;              // [{ product_id, variant_id, image_id, score }]
}

export async function fetchSimilar(productId, limit = 8) {
  const { data, error } = await supabase.rpc('similar_sarees', { p_product_id: productId, p_limit: limit });
  if (error) throw error;
  return data;              // [{ product_id, score }]
}

// ---- Admin: suggest details for a new saree ------------------------------------------
// Category, fabric and occasion come from the most similar sarees she has already
// labelled (this measured better than zero-shot text prompts: see research/RESULTS.md).
// The main colour comes from zero-shot text prompts (measured better for colour).

const COLOUR_PROMPTS = {
  Red: ['red'], Pink: ['pink', 'rani pink'], Maroon: ['maroon', 'wine'], Orange: ['orange', 'peach'],
  Yellow: ['yellow', 'mustard'], Green: ['green', 'olive green'], Blue: ['blue', 'navy blue'], Teal: ['teal'],
  Purple: ['purple', 'lavender'], Black: ['black'], Cream: ['white', 'cream'], Grey: ['grey'], Gold: ['gold'], Brown: ['brown'],
};

function loadColourVectors() {
  colourPromise ??= (async () => {
    const t = await lib();
    const [tokenizer, textModel] = await Promise.all([
      t.AutoTokenizer.from_pretrained(MODEL_ID),
      t.CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { dtype: 'q8' }),
    ]);
    const out = {};
    for (const [name, words] of Object.entries(COLOUR_PROMPTS)) {
      const prompts = words.flatMap(w => [`a ${w} saree`, `a photo of a ${w} coloured saree`]);
      const { text_embeds } = await textModel(tokenizer(prompts, { padding: true, truncation: true }));
      const d = text_embeds.dims.at(-1);
      const vs = prompts.map((_, i) => unit(Array.from(text_embeds.data.slice(i * d, (i + 1) * d))));
      out[name] = unit(vs[0].map((_, j) => vs.reduce((s, v) => s + v[j], 0) / vs.length));
    }
    return out;
  })();
  colourPromise.catch(() => { colourPromise = undefined; });
  return colourPromise;
}

// Returns { categoryId, fabric, occasions, colour, basedOn } — suggestions only, never saved by itself
export async function suggestDetails(source, { excludeProductId, onProgress } = {}) {
  const embedding = await embedImage(source, onProgress);
  const [{ data: matches, error }, colours] = await Promise.all([
    supabase.rpc('search_by_embedding', { p_embedding: JSON.stringify(embedding), p_limit: 8 }),
    loadColourVectors(),
  ]);
  if (error) throw error;
  const near = matches.filter(m => m.product_id !== excludeProductId).slice(0, 7);
  const { data: products } = near.length
    ? await supabase.from('products').select('id, code, name, category_id, fabric, occasions').in('id', near.map(m => m.product_id))
    : { data: [] };

  const votes = { category: {}, fabric: {}, occasion: {} };
  for (const m of near) {
    const p = products.find(x => x.id === m.product_id);
    if (!p) continue;
    const w = Math.max(m.score, 0);
    if (p.category_id) votes.category[p.category_id] = (votes.category[p.category_id] ?? 0) + w;
    for (const f of FABRIC_FAMILIES.filter(f => f.words.some(k => (p.fabric ?? '').toLowerCase().includes(k)))) {
      votes.fabric[f.name] = (votes.fabric[f.name] ?? 0) + w;
    }
    for (const o of p.occasions ?? []) if (OCCASIONS.includes(o)) votes.occasion[o] = (votes.occasion[o] ?? 0) + w;
  }
  const best = obj => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  const occ = best(votes.occasion);
  const colour = best(Object.fromEntries(Object.entries(colours).map(([n, v]) => [n, dot(embedding, v)])))[0]?.[0] ?? null;

  return {
    categoryId: best(votes.category)[0]?.[0] ?? null,
    fabric: best(votes.fabric)[0]?.[0] ?? null,
    occasions: occ.filter(([, w]) => w >= (occ[0]?.[1] ?? 0) * 0.5).map(([o]) => o),   // the leading occasion + any close to it
    colour,
    basedOn: near.map(m => products.find(p => p.id === m.product_id)?.code).filter(Boolean),
    embedding,
  };
}

// Store fingerprints of newly uploaded photos so they join search + similar sarees.
// Runs in the background after saving; failures are harmless (scripts/embed-catalogue.mjs catches up).
export async function indexPhotos(pairs) {
  for (const { imageId, file } of pairs) {
    try {
      const embedding = await embedImage(file);
      await supabase.rpc('admin_save_embedding', { p_image_id: imageId, p_embedding: JSON.stringify(embedding), p_model: MODEL_NAME });
    } catch { /* ignore — the laptop script can index it later */ }
  }
}
