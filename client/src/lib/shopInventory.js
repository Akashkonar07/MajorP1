import { supabase } from './supabase';
import { compressPhoto } from './admin';

// Private in-shop inventory (project brief §6, §8). Completely separate from the
// online store: nothing here ever changes the website or its stock.
// The database lets only admins read or change any of it.

const BUCKET = 'shop-item-photos';     // private bucket: photos are shown with short-lived signed links

export const SHOP_REASONS = {
  received: { label: 'Received', sign: 1, hint: 'New pieces came in' },
  sold: { label: 'Sold', sign: -1, hint: 'Sold in the shop' },
  returned: { label: 'Returned', sign: 1, hint: 'Customer brought it back' },
  damaged: { label: 'Damaged', sign: -1, hint: 'Damaged / not sellable' },
  adjustment: { label: 'Adjustment', sign: 0, hint: 'Correct the count' },
};

export const SHOP_CATEGORIES = ['Sarees', 'Lehengas', 'Petticoats', 'Blouses', 'Dress materials', 'Other'];

const FIELDS = 'id, code, name, category, fabric, color, cost_price, selling_price, qty, low_stock_threshold, photo_path, notes, is_active, created_at, updated_at';

const shape = i => ({ ...i, selling_price: Number(i.selling_price), cost_price: i.cost_price === null ? null : Number(i.cost_price) });

// Adds a temporary photo link (1 hour) to each item that has a photo
async function withPhotos(items) {
  const paths = items.map(i => i.photo_path).filter(Boolean);
  if (!paths.length) return items;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600);
  const urls = Object.fromEntries((data ?? []).filter(d => d.signedUrl).map(d => [d.path, d.signedUrl]));
  return items.map(i => ({ ...i, photoUrl: urls[i.photo_path] ?? null }));
}

export async function fetchShopItems() {
  const { data, error } = await supabase.from('shop_items').select(FIELDS).order('code', { ascending: false });
  if (error) throw error;
  return withPhotos(data.map(shape));
}

export async function fetchShopItem(id) {
  const { data, error } = await supabase.from('shop_items').select(FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? (await withPhotos([shape(data)]))[0] : null;
}

// Saves the item details (not qty — that only changes through adjustShopStock)
export async function saveShopItem(id, values) {
  const query = id
    ? supabase.from('shop_items').update(values).eq('id', id)
    : supabase.from('shop_items').insert(values);
  const { data, error } = await query.select('id, code').single();
  if (error) throw error;
  return data;
}

export async function adjustShopStock(itemId, change, reason, note) {
  const { data, error } = await supabase.rpc('adjust_shop_stock', {
    p_item_id: itemId, p_change: change, p_reason: reason, p_note: note || null,
  });
  if (error) throw error;
  return data;
}

// Uploads one photo for an item (shrunk in the browser) and returns its storage path
export async function uploadShopPhoto(code, file) {
  const blob = await compressPhoto(file);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `items/${code}-${Date.now().toString(36)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type });
  if (error) throw error;
  return path;
}

export async function removeShopPhoto(path) {
  if (path) await supabase.storage.from(BUCKET).remove([path]);
}

export async function fetchShopHistory({ itemId, limit = 300 } = {}) {
  let query = supabase.from('shop_stock_movements')
    .select('id, change, reason, note, created_at, item:shop_items ( id, code, name, color ), by:profiles ( full_name )')
    .order('created_at', { ascending: false }).limit(limit);
  if (itemId) query = query.eq('shop_item_id', itemId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export const shopStockState = i => (i.qty === 0 ? 'out' : i.qty <= i.low_stock_threshold ? 'low' : 'in');
