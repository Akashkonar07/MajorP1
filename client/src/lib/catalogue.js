import { supabase } from './supabase';

// Everything the shop pages need about sarees, read from Supabase.
// The whole catalogue (~50 sarees) is small, so it is loaded once and then
// filtered/sorted in the browser. Only public data is read here — base prices
// (product_costs) are admin-only and are never requested.

const BUCKET = 'products';

const PRODUCT_FIELDS = `
  id, code, slug, name, description, fabric, work, blouse_details, saree_length_m,
  occasions, price, blouse_included, created_at,
  category:categories ( id, name, slug ),
  variants:product_variants ( id, color_name, color_hex, stock, low_stock_threshold, is_active, sort_order ),
  images:product_images ( storage_path, sort_order, variant_id )
`;

export const imageUrl = path =>
  path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;

// Turns a raw row into what the pages use: colours sorted, each with its own photos,
// plus the shared (all-colours) photos.
function shape(row) {
  const images = [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const shared = images.filter(i => !i.variant_id).map(i => imageUrl(i.storage_path));
  const variants = [...(row.variants ?? [])]
    .filter(v => v.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(v => ({
      ...v,
      images: images.filter(i => i.variant_id === v.id).map(i => imageUrl(i.storage_path)),
    }));
  return {
    ...row,
    price: Number(row.price),
    images: undefined,
    variants,
    sharedImages: shared,
    mainImage: variants[0]?.images[0] ?? shared[0] ?? null,
  };
}

let cataloguePromise = null;

// All visible sarees (RLS already hides inactive ones from customers)
export function fetchCatalogue() {
  if (!cataloguePromise) {
    cataloguePromise = supabase
      .from('products')
      .select(PRODUCT_FIELDS)
      .order('code', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data.map(shape).filter(p => p.variants.length > 0);
      })
      .catch(error => {
        cataloguePromise = null; // allow a retry
        throw error;
      });
  }
  return cataloguePromise;
}

export async function fetchProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? shape(data) : null;
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('id, name, slug').order('name');
  if (error) throw error;
  return data;
}

// ---- Stock (NULL = not tracked yet, project brief §2) --------------------------
export const AVAILABILITY_NOTE =
  'Availability is confirmed by the shop before dispatch — if unavailable you get a full UPI refund.';

export function stockStatus(variant) {
  if (!variant || variant.stock === null || variant.stock === undefined) return 'untracked';
  if (variant.stock === 0) return 'out';
  if (variant.stock <= variant.low_stock_threshold) return 'low';
  return 'in';
}
export const isOrderable = variant => stockStatus(variant) !== 'out';

// ---- Filter groups ----------------------------------------------------------
// Colour and fabric names in the catalogue are descriptive ("Beige & Red",
// "Soft shine space silk"), so filters use simple families matched by keyword.
export const COLOUR_FAMILIES = [
  { name: 'Red', hex: '#c62828', words: ['red', 'cherry'] },
  { name: 'Pink', hex: '#e86a9a', words: ['pink', 'rani', 'rose', 'magenta'] },
  { name: 'Maroon & Wine', hex: '#6d0f2a', words: ['maroon', 'wine'] },
  { name: 'Orange & Peach', hex: '#ef7d22', words: ['orange', 'peach', 'coral', 'rust'] },
  { name: 'Yellow & Mustard', hex: '#e2b31a', words: ['yellow', 'mustard', 'lemon'] },
  { name: 'Green', hex: '#2e7d32', words: ['green', 'parrot', 'mehendi', 'olive', 'lime', 'pista', 'sage'] },
  { name: 'Blue', hex: '#2a5db0', words: ['blue', 'navy', 'sky', 'aqua'] },
  { name: 'Teal', hex: '#00796b', words: ['teal', 'morpich'] },
  { name: 'Purple', hex: '#7b4fa0', words: ['purple', 'violet', 'lavender'] },
  { name: 'Black', hex: '#1c1c1c', words: ['black'] },
  { name: 'White & Cream', hex: '#f3e5c8', words: ['white', 'cream', 'beige'] },
  { name: 'Grey', hex: '#8a8a8a', words: ['grey'] },
  { name: 'Gold', hex: '#c9a227', words: ['gold'] },
  { name: 'Brown', hex: '#7b4a2d', words: ['brown'] },
];

export const FABRIC_FAMILIES = [
  { name: 'Silk', words: ['silk', 'tussar', 'tassar', 'gajji', 'dola', 'paithani'] },
  { name: 'Georgette', words: ['georgette', 'moss'] },
  { name: 'Chiffon', words: ['chiffon'] },
  { name: 'Cotton', words: ['cotton'] },
  { name: 'Linen', words: ['linen'] },
  { name: 'Satin', words: ['satin', 'crush'] },
  { name: 'Viscose', words: ['viscose'] },
  { name: 'Tissue', words: ['tissue'] },
  { name: 'Net', words: ['nett'] },
];

export const OCCASIONS = ['Wedding', 'Festive', 'Party wear', 'Office wear', 'Daily wear'];

const has = (text, words) => words.some(w => text.toLowerCase().includes(w));

export const productColourFamilies = product =>
  COLOUR_FAMILIES.filter(f => product.variants.some(v => has(v.color_name, f.words))).map(f => f.name);

export const productFabricFamilies = product =>
  FABRIC_FAMILIES.filter(f => has(product.fabric ?? '', f.words)).map(f => f.name);

export const formatPrice = n => `₹${Number(n).toLocaleString('en-IN')}`;
