// Evaluation of zero-shot visual tagging and photo search on the shop's real
// catalogue (research for the project paper). Runs offline on this laptop:
// it needs the private catalogue/ folder (photos + owner-verified labels), which
// is never committed. Only the summary numbers are written to research/.
//
//   RQ1  Zero-shot tagging accuracy (category, fabric family, occasion, colour):
//        naive prompts vs saree-expert prompts, against chance / majority baselines.
//   RQ2  Photo → same-design retrieval: Recall@1, Recall@5, mAP (leave-one-photo-out).
//   RQ3  Cost: model load time and embedding time per photo on a laptop CPU.
//
// Run from scripts/:   node evaluate-vision.mjs [--model Xenova/clip-vit-base-patch16]
import { AutoProcessor, CLIPVisionModelWithProjection, AutoTokenizer, CLIPTextModelWithProjection, RawImage } from '@huggingface/transformers';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = process.argv.includes('--model') ? process.argv[process.argv.indexOf('--model') + 1] : 'Xenova/clip-vit-base-patch32';
const SHORT = MODEL.split('/').pop();
const catalogue = JSON.parse(await readFile(join(ROOT, 'catalogue', 'products.json'), 'utf8')).products;

// ---- Label families (same keyword lists as client/src/lib/catalogue.js) ----------
const COLOURS = {
  'Red': ['red', 'cherry'], 'Pink': ['pink', 'rani', 'rose', 'magenta'], 'Maroon & Wine': ['maroon', 'wine'],
  'Orange & Peach': ['orange', 'peach', 'coral', 'rust'], 'Yellow & Mustard': ['yellow', 'mustard', 'lemon'],
  'Green': ['green', 'parrot', 'mehendi', 'olive', 'lime', 'pista', 'sage'], 'Blue': ['blue', 'navy', 'sky', 'aqua'],
  'Teal': ['teal', 'morpich'], 'Purple': ['purple', 'violet', 'lavender'], 'Black': ['black'],
  'White & Cream': ['white', 'cream', 'beige'], 'Grey': ['grey'], 'Gold': ['gold'], 'Brown': ['brown'],
};
const FABRICS = {
  'Silk': ['silk', 'tussar', 'tassar', 'gajji', 'dola', 'paithani'], 'Georgette': ['georgette', 'moss'], 'Chiffon': ['chiffon'],
  'Cotton': ['cotton'], 'Linen': ['linen'], 'Satin': ['satin', 'crush'], 'Viscose': ['viscose'], 'Tissue': ['tissue'], 'Net': ['nett'],
};
const OCCASIONS = ['Wedding', 'Festive', 'Party wear', 'Office wear', 'Daily wear'];
const CATEGORIES = ['Silk Sarees', 'Georgette Sarees', 'Designer Sarees', 'Bandhani Sarees', 'Banarasi Sarees',
  'Paithani Sarees', 'Festive Specials', 'Cotton & Linen Sarees', 'Chiffon Sarees'];

// Primary colour of a colour name = the family of its FIRST word that matches ("Navy & Olive" → Blue)
const primaryColour = name => {
  const words = name.toLowerCase().split(/[^a-z]+/);
  for (const w of words) for (const [fam, keys] of Object.entries(COLOURS)) if (keys.includes(w)) return fam;
  return null;
};
const fabricFamilies = fabric => Object.entries(FABRICS).filter(([, keys]) => keys.some(k => fabric.toLowerCase().includes(k))).map(([f]) => f);

// ---- Prompts ----------------------------------------------------------------------
// Naive = the label as a plain phrase. Expert = several saree-specific descriptions per
// class (written from how the shop's own catalogue describes them), averaged.
const naive = label => [`a photo of ${label.toLowerCase()}`];
const EXPERT = {
  category: {
    'Silk Sarees': ['a shiny silk saree with a woven border', 'a soft silk saree with zari border and rich pallu'],
    'Georgette Sarees': ['a flowing georgette saree with print or embroidery', 'a lightweight georgette saree with sequins'],
    'Designer Sarees': ['a designer saree with heavy embroidery and sequins', 'a fancy partywear designer saree with embellished border'],
    'Bandhani Sarees': ['a bandhani tie-dye saree with small dots pattern', 'a bandhej saree with tie and dye dots'],
    'Banarasi Sarees': ['a banarasi silk saree with gold zari brocade weaving', 'a banarasi saree with woven motifs all over'],
    'Paithani Sarees': ['a paithani saree with peacock motifs on the border and pallu', 'a paithani silk saree with a contrast zari border'],
    'Festive Specials': ['a festive saree in bright colours with zari', 'a festival saree with rich traditional weaving'],
    'Cotton & Linen Sarees': ['a cotton saree for daily wear with a matte texture', 'a linen saree with simple print'],
    'Chiffon Sarees': ['a light sheer chiffon saree', 'a transparent chiffon saree with lace border'],
  },
  fabric: {
    'Silk': ['a silk saree with a lustrous sheen', 'a woven silk saree'], 'Georgette': ['a georgette saree with a grainy flowing drape', 'a moss georgette saree'],
    'Chiffon': ['a sheer chiffon saree', 'a lightweight transparent chiffon saree'], 'Cotton': ['a cotton saree with a matte surface', 'a soft cotton saree'],
    'Linen': ['a linen saree with a slubbed texture', 'a soft linen saree'], 'Satin': ['a glossy satin saree', 'a shiny crushed satin saree'],
    'Viscose': ['a viscose saree', 'a soft viscose saree with print'], 'Tissue': ['a tissue saree with metallic shimmer', 'a shimmering tissue saree'],
    'Net': ['a net saree with see-through mesh', 'a nett saree with embroidery'],
  },
  occasion: {
    'Wedding': ['a heavy bridal saree for a wedding', 'a rich wedding saree with gold zari'],
    'Festive': ['a festive saree for festivals like Diwali', 'a traditional saree for a festival'],
    'Party wear': ['a glamorous party wear saree with sequins', 'a stylish saree for an evening party'],
    'Office wear': ['a simple elegant saree for office wear', 'a light formal saree for work'],
    'Daily wear': ['a simple everyday cotton saree', 'a light printed saree for daily wear'],
  },
};
const COLOUR_WORDS = {
  'Red': ['red'], 'Pink': ['pink', 'rani pink'], 'Maroon & Wine': ['maroon', 'wine'], 'Orange & Peach': ['orange', 'peach'],
  'Yellow & Mustard': ['yellow', 'mustard'], 'Green': ['green', 'olive green'], 'Blue': ['blue', 'navy blue'], 'Teal': ['teal'],
  'Purple': ['purple', 'lavender'], 'Black': ['black'], 'White & Cream': ['white', 'cream'], 'Grey': ['grey'], 'Gold': ['gold'], 'Brown': ['brown'],
};
EXPERT.colour = Object.fromEntries(Object.entries(COLOUR_WORDS).map(([fam, ws]) => [fam, ws.flatMap(w => [`a ${w} saree`, `a photo of a ${w} coloured saree`])]));
const NAIVE_COLOUR = Object.fromEntries(Object.keys(COLOUR_WORDS).map(f => [f, [`${COLOUR_WORDS[f][0]}`]]));

// ---- Model ------------------------------------------------------------------------
let t0 = Date.now();
const processor = await AutoProcessor.from_pretrained(MODEL);
const vision = await CLIPVisionModelWithProjection.from_pretrained(MODEL, { dtype: 'q8' });
const tokenizer = await AutoTokenizer.from_pretrained(MODEL);
const textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL, { dtype: 'q8' });
const loadMs = Date.now() - t0;

const unit = v => { const n = Math.hypot(...v); return v.map(x => x / n); };
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
async function embedTexts(texts) {
  const { text_embeds } = await textModel(tokenizer(texts, { padding: true, truncation: true }));
  const d = text_embeds.dims.at(-1);
  return texts.map((_, i) => unit(Array.from(text_embeds.data.slice(i * d, (i + 1) * d))));
}
// One vector per class = mean of its prompt vectors (prompt ensembling), re-normalised
async function classVectors(promptsByClass) {
  const out = {};
  for (const [cls, prompts] of Object.entries(promptsByClass)) {
    const vs = await embedTexts(prompts);
    out[cls] = unit(vs[0].map((_, j) => vs.reduce((s, v) => s + v[j], 0) / vs.length));
  }
  return out;
}

// ---- Embed every photo -------------------------------------------------------------
const photos = [];    // { productIdx, code, variant, path }
for (const [pi, p] of catalogue.entries()) {
  for (const v of p.variants) for (const path of v.images) photos.push({ pi, code: p.code, variant: v.color_name, path });
  for (const path of p.shared_images ?? []) photos.push({ pi, code: p.code, variant: null, path });
}
console.log(`${MODEL}: ${photos.length} photos, ${catalogue.length} sarees`);
t0 = Date.now();
for (const [n, ph] of photos.entries()) {
  const img = await RawImage.read(join(ROOT, 'catalogue', ph.path));
  const { image_embeds } = await vision(await processor(img));
  ph.vec = unit(Array.from(image_embeds.data));
  if ((n + 1) % 100 === 0) console.log(`  embedded ${n + 1}/${photos.length}`);
}
const embedMs = (Date.now() - t0) / photos.length;

// ---- RQ1: zero-shot tagging --------------------------------------------------------
// Query photo per colour = its first (main) photo; per saree attributes use those same photos.
const mainPhotos = photos.filter(ph => ph.variant && ph.path === catalogue[ph.pi].variants.find(v => v.color_name === ph.variant).images[0]);
const top1 = (vec, classVecs) => Object.entries(classVecs).map(([c, cv]) => [c, dot(vec, cv)]).sort((a, b) => b[1] - a[1])[0][0];

async function tagTask(name, classes, truthOf, naivePrompts, expertPrompts, multi = false) {
  const items = mainPhotos.map(ph => ({ ph, truth: truthOf(ph) })).filter(x => (multi ? x.truth.length : x.truth));
  const nv = await classVectors(Object.fromEntries(classes.map(c => [c, naivePrompts(c)])));
  const ev = await classVectors(Object.fromEntries(classes.map(c => [c, expertPrompts(c)])));
  const ok = (pred, truth) => (multi ? truth.includes(pred) : pred === truth);
  const acc = vecs => items.filter(x => ok(top1(x.ph.vec, vecs), x.truth)).length / items.length;
  // Baselines: random guess, and always guessing the most common true class
  const counts = {};
  for (const x of items) for (const t of [].concat(x.truth)) counts[t] = (counts[t] ?? 0) + 1;
  const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const chance = multi ? items.reduce((s, x) => s + x.truth.length / classes.length, 0) / items.length : 1 / classes.length;
  return { task: name, classes: classes.length, n: items.length, chance, majority: items.filter(x => ok(majority, x.truth)).length / items.length, naive: acc(nv), expert: acc(ev) };
}

const rq1 = [
  await tagTask('Colour (primary)', Object.keys(COLOURS), ph => primaryColour(ph.variant), c => NAIVE_COLOUR[c], c => EXPERT.colour[c]),
  await tagTask('Category', CATEGORIES, ph => catalogue[ph.pi].category, naive, c => EXPERT.category[c]),
  await tagTask('Fabric family', Object.keys(FABRICS), ph => fabricFamilies(catalogue[ph.pi].fabric), naive, c => EXPERT.fabric[c], true),
  await tagTask('Occasion', OCCASIONS, ph => catalogue[ph.pi].occasions, naive, c => EXPERT.occasion[c], true),
];

// ---- RQ1b: label from the most similar OTHER sarees (k-nearest neighbours) ---------
// Leave-one-saree-out: a saree's own photos are never used to label it, so this is
// what the owner gets when she adds a brand-new saree.
function knnTask(name, truthOf, multi = false, k = 7) {
  const items = mainPhotos.map(ph => ({ ph, truth: truthOf(ph) })).filter(x => (multi ? x.truth.length : x.truth));
  let correct = 0;
  for (const x of items) {
    const neighbours = photos.filter(g => g.pi !== x.ph.pi && g.variant !== undefined)
      .map(g => [g, dot(x.ph.vec, g.vec)]).sort((a, b) => b[1] - a[1]).slice(0, k);
    const votes = {};
    for (const [g, sim] of neighbours) {
      const labels = truthOf(g.variant ? g : { ...g, variant: catalogue[g.pi].variants[0].color_name });
      for (const l of [].concat(labels ?? [])) votes[l] = (votes[l] ?? 0) + sim;
    }
    const pred = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (multi ? x.truth.includes(pred) : pred === x.truth) correct++;
  }
  return { task: name, n: items.length, k, knn: correct / items.length };
}
const rq1b = [
  knnTask('Colour (primary)', ph => primaryColour(ph.variant)),
  knnTask('Category', ph => catalogue[ph.pi].category),
  knnTask('Fabric family', ph => fabricFamilies(catalogue[ph.pi].fabric), true),
  knnTask('Occasion', ph => catalogue[ph.pi].occasions, true),
];

// ---- RQ2: photo → same design (leave-one-photo-out over all photos) ---------------
function retrieval(level) {
  const key = ph => (level === 'design' ? ph.pi : `${ph.pi}|${ph.variant}`);
  const pool = level === 'design' ? photos : photos.filter(ph => ph.variant);
  let r1 = 0, r5 = 0, apSum = 0, n = 0;
  for (const q of pool) {
    const rel = pool.filter(g => g !== q && key(g) === key(q)).length;
    if (!rel) continue;
    const ranked = pool.filter(g => g !== q).map(g => [g, dot(q.vec, g.vec)]).sort((a, b) => b[1] - a[1]);
    const hits = ranked.map(([g]) => key(g) === key(q));
    r1 += hits[0] ? 1 : 0;
    r5 += hits.slice(0, 5).some(Boolean) ? 1 : 0;
    let found = 0, ap = 0;
    hits.forEach((h, i) => { if (h) { found++; ap += found / (i + 1); } });
    apSum += ap / rel;
    n++;
  }
  // Random ranking baseline for Recall@1 = average share of relevant photos in the gallery
  const chance = pool.reduce((s, q) => s + pool.filter(g => g !== q && key(g) === key(q)).length / (pool.length - 1), 0) / pool.length;
  return { level, queries: n, gallery: pool.length - 1, recall1: r1 / n, recall5: r5 / n, mAP: apSum / n, chanceR1: chance };
}
const rq2 = [retrieval('design'), retrieval('colour')];

// ---- Report -----------------------------------------------------------------------
const pct = x => `${(100 * x).toFixed(1)}%`;
const result = { model: MODEL, date: new Date().toISOString().slice(0, 10), photos: photos.length, sarees: catalogue.length,
  colours: catalogue.reduce((s, p) => s + p.variants.length, 0), loadMs, embedMsPerPhoto: Math.round(embedMs), rq1, rq1b, rq2 };
await mkdir(join(ROOT, 'research'), { recursive: true });
await writeFile(join(ROOT, 'research', `results-${SHORT}.json`), JSON.stringify(result, null, 2) + '\n');

console.log(`\nRQ1 zero-shot tagging (${SHORT}, top-1 accuracy on each colour's main photo)`);
console.log('| Attribute | Classes | Photos | Chance | Majority | Naive prompts | Expert prompts |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rq1) console.log(`| ${r.task} | ${r.classes} | ${r.n} | ${pct(r.chance)} | ${pct(r.majority)} | ${pct(r.naive)} | ${pct(r.expert)} |`);
console.log(`\nRQ1b labels from the 7 most similar OTHER sarees (leave-one-saree-out)`);
console.log('| Attribute | Photos | k-NN accuracy |');
console.log('|---|---|---|');
for (const r of rq1b) console.log(`| ${r.task} | ${r.n} | ${pct(r.knn)} |`);
console.log(`\nRQ2 photo search, leave-one-photo-out (${SHORT})`);
console.log('| Find the same… | Queries | Gallery | Recall@1 | Recall@5 | mAP | Random R@1 |');
console.log('|---|---|---|---|---|---|---|');
for (const r of rq2) console.log(`| ${r.level} | ${r.queries} | ${r.gallery} | ${pct(r.recall1)} | ${pct(r.recall5)} | ${pct(r.mAP)} | ${pct(r.chanceR1)} |`);
console.log(`\nRQ3 cost: model load ${(loadMs / 1000).toFixed(1)} s, ${Math.round(embedMs)} ms per photo (laptop CPU, q8 ONNX)`);
