import { supabase } from './supabase';
import { imageUrl } from './catalogue';

// Admin-only data actions for the Online Store pages.
// Every call here is also checked by the database (RLS + admin checks), so a
// non-admin calling these simply gets "permission denied".

const BUCKET = 'products';

// Owner's rule (project brief §2) — same as public.website_price() in the database
export const websitePrice = base => {
  const b = Number(base);
  if (!b || b <= 0) return 0;
  return b + (b < 1100 ? 300 : 500);
};

const ADMIN_FIELDS = `
  id, code, slug, name, description, fabric, work, blouse_details, saree_length_m, occasions,
  price, price_is_manual, blouse_included, is_active, created_at, updated_at, category_id,
  category:categories ( id, name, slug ),
  cost:product_costs ( base_price ),
  variants:product_variants ( id, color_name, color_hex, stock, low_stock_threshold, is_active, sort_order ),
  images:product_images ( id, storage_path, sort_order, variant_id )
`;

function shapeAdmin(row) {
  const images = [...(row.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    .map(i => ({ ...i, url: imageUrl(i.storage_path) }));
  const variants = [...(row.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    .map(v => ({ ...v, images: images.filter(i => i.variant_id === v.id) }));
  const cost = Array.isArray(row.cost) ? row.cost[0] : row.cost;
  return {
    ...row,
    price: Number(row.price),
    basePrice: cost ? Number(cost.base_price) : null,
    variants,
    sharedImages: images.filter(i => !i.variant_id),
    mainImage: variants.find(v => v.is_active)?.images[0]?.url ?? images[0]?.url ?? null,
  };
}

export async function fetchAdminProducts() {
  const { data, error } = await supabase.from('products').select(ADMIN_FIELDS).order('code', { ascending: false });
  if (error) throw error;
  return data.map(shapeAdmin);
}

export async function fetchAdminProduct(id) {
  const { data, error } = await supabase.from('products').select(ADMIN_FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? shapeAdmin(data) : null;
}

export async function setProductActive(id, isActive) {
  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) throw error;
}

// Changes one colour's online stock through the database function (writes the stock register)
export async function adjustStock(variantId, change, reason, note) {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_variant_id: variantId, p_change: change, p_reason: reason, p_note: note || null,
  });
  if (error) throw error;
  return data;
}

// ---- Photos -----------------------------------------------------------------
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_MB = 20;   // phone photos are shrunk before upload (stored files stay well under 5 MB)
const MAX_SIDE = 1000;        // same size as the catalogue photos

export function checkPhoto(file) {
  if (!ALLOWED.includes(file.type)) return 'Only JPG, PNG or WebP photos are allowed.';
  if (file.size > MAX_ORIGINAL_MB * 1024 * 1024) return `Photo is too large (max ${MAX_ORIGINAL_MB} MB).`;
  return null;
}

// Shrinks a photo in the browser to max 1000 px and saves it as WebP (JPEG if the browser can't make WebP)
export async function compressPhoto(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const toBlob = (type, quality) => new Promise(resolve => canvas.toBlob(resolve, type, quality));
  let blob = await toBlob('image/webp', 0.82);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.85);
  if (blob.size > 5 * 1024 * 1024) throw new Error('Photo is still larger than 5 MB after shrinking.');
  return blob;
}

const slugPart = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';

// Uploads photos for one colour (variantId) or shared photos (variantId = null) and saves their rows
export async function uploadPhotos({ productId, code, variantId, colourName, files, startOrder = 0 }) {
  const rows = [];
  for (const [i, file] of files.entries()) {
    const blob = await compressPhoto(file);
    const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
    const unique = `${Date.now().toString(36)}${i}`;
    const path = `images/${code}/${code}-${slugPart(colourName ?? 'all-colours')}-${unique}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) throw error;
    rows.push({ product_id: productId, variant_id: variantId, storage_path: path, sort_order: startOrder + i });
  }
  if (rows.length) {
    const { error } = await supabase.from('product_images').insert(rows);
    if (error) throw error;
  }
}

export async function deletePhotos(images) {
  if (!images.length) return;
  const { error } = await supabase.from('product_images').delete().in('id', images.map(i => i.id));
  if (error) throw error;
  await supabase.storage.from(BUCKET).remove(images.map(i => i.storage_path));   // file clean-up; row is what matters
}

// ---- Stock register -----------------------------------------------------------
export async function fetchStockRegister({ limit = 100 } = {}) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select(`id, change, reason, note, created_at,
      variant:product_variants ( color_name, product:products ( code, name ) ),
      by:profiles ( full_name )`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
