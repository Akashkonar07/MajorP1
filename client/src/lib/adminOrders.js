import { supabase } from './supabase';
import { imageUrl } from './catalogue';

// Admin: orders (build step 7). Status changes go through database functions
// that check is_admin() and write the activity log.

const ORDER_FIELDS = `
  id, order_no, status, payment_status, subtotal, addons_total, delivery_charge, total,
  shipping_address, upi_utr, courier, tracking_no, created_at, updated_at,
  customer:profiles ( full_name, phone ),
  items:order_items ( id, name_snapshot, color_snapshot, unit_price, qty, addons,
    product:products ( code, slug ),
    variant:product_variants ( images:product_images ( storage_path, sort_order ) ) )
`;

const shape = o => ({
  ...o,
  subtotal: Number(o.subtotal), addons_total: Number(o.addons_total),
  delivery_charge: Number(o.delivery_charge), total: Number(o.total),
  count: (o.items ?? []).reduce((s, i) => s + i.qty, 0),
  items: (o.items ?? []).map(i => {
    const first = [...(i.variant?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    return { ...i, unit_price: Number(i.unit_price), image: first ? imageUrl(first.storage_path) : null };
  }),
});

export async function fetchAdminOrders({ limit = 300 } = {}) {
  const { data, error } = await supabase.from('orders').select(ORDER_FIELDS)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data.map(shape);
}

export async function fetchAdminOrder(id) {
  const { data, error } = await supabase.from('orders').select(ORDER_FIELDS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? shape(data) : null;
}

export async function setOrderStatus(id, status, { courier, tracking, note } = {}) {
  const { error } = await supabase.rpc('admin_set_order_status', {
    p_order_id: id, p_status: status, p_courier: courier ?? null, p_tracking: tracking ?? null, p_note: note || null,
  });
  if (error) throw error;
}

export async function rejectPayment(id, note) {
  const { error } = await supabase.rpc('admin_reject_payment', { p_order_id: id, p_note: note || null });
  if (error) throw error;
}

// Which list tab an order belongs to (what the owner needs to do next)
export function orderStage(o) {
  if (o.status === 'payment_pending') {
    if (o.upi_utr && o.payment_status === 'pending') return 'verify';
    return 'unpaid';
  }
  if (o.status === 'payment_verified') return 'pack';
  if (o.status === 'packed') return 'ship';
  if (o.status === 'shipped') return 'shipped';
  if (['return_requested', 'exchange_requested'].includes(o.status)) return 'returns';
  return 'done';
}

// Ready-made WhatsApp message to the customer for each step
export function customerWhatsApp(o, kind) {
  const a = o.shipping_address ?? {};
  const name = (a.full_name ?? o.customer?.full_name ?? '').split(' ')[0];
  const amount = `₹${o.total.toLocaleString('en-IN')}`;
  const texts = {
    verified: `Namaste ${name}, we have received your payment of ${amount} for order ${o.order_no}. Your saree will be dispatched within 2 working days. – Vaibhav Laxmi Saree`,
    rejected: `Namaste ${name}, we could not find your UPI payment for order ${o.order_no} (UTR ${o.upi_utr}). Please send us a screenshot of the payment. – Vaibhav Laxmi Saree`,
    shipped: `Namaste ${name}, your order ${o.order_no} has been shipped by ${o.courier}. Tracking no.: ${o.tracking_no}. – Vaibhav Laxmi Saree`,
    delivered: `Namaste ${name}, your order ${o.order_no} has been delivered. Thank you for shopping with Vaibhav Laxmi Saree.`,
    general: `Namaste ${name}, this is Vaibhav Laxmi Saree about your order ${o.order_no}. `,
  };
  const phone = a.phone ?? o.customer?.phone;
  return phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(texts[kind] ?? texts.general)}` : null;
}
