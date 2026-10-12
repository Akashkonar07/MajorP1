import { supabase } from './supabase';

// Anonymous shopping activity (views, wishlist, bag, orders) for future
// recommendations. The database checks and rate-limits everything (log_event);
// this file only sends it. Logging must never break a page, so all errors are ignored.

const KEY = 'vls_session_id';

// A random id for this browser, kept in localStorage. It says nothing about who the person is.
function sessionId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;                              // private mode / storage blocked: just don't log
  }
}

// event: 'view' | 'wishlist_add' | 'bag_add' | 'order_placed'
export function logEvent(productId, event, variantId = null) {
  const sid = sessionId();
  if (!productId || !sid) return;
  supabase.rpc('log_event', {
    p_product_id: productId, p_event: event, p_session_id: sid, p_variant_id: variantId,
  }).then(() => {}, () => {});
}

// Admin dashboard: counts per saree for the last N days
export async function fetchInsights(days = 30) {
  const { data, error } = await supabase.rpc('admin_product_insights', { p_days: days });
  if (error) throw error;
  return data.map(r => ({ ...r, views: Number(r.views), wishlists: Number(r.wishlists), bag_adds: Number(r.bag_adds), orders: Number(r.orders) }));
}
