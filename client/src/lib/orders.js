import { supabase } from './supabase';

// Checkout and orders. Totals shown in the browser are only a preview —
// place_order() in the database works out the real prices, add-ons and delivery.

const cleanError = e => new Error(e?.message ?? String(e));

export const ORDER_STATUS = {
  payment_pending: { label: 'Waiting for payment', tone: 'amber' },
  payment_verified: { label: 'Payment verified', tone: 'emerald' },
  packed: { label: 'Packed', tone: 'emerald' },
  shipped: { label: 'Shipped', tone: 'emerald' },
  delivered: { label: 'Delivered', tone: 'emerald' },
  cancelled: { label: 'Cancelled', tone: 'gray' },
  return_requested: { label: 'Return requested', tone: 'amber' },
  returned: { label: 'Returned', tone: 'gray' },
  exchange_requested: { label: 'Exchange requested', tone: 'amber' },
};

export const STATUS_CLASSES = {
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

// Customer-facing label: a submitted UTR changes "Waiting for payment" to "Payment being checked"
export function statusLabel(order) {
  if (order.status === 'payment_pending' && order.upi_utr) return { label: 'Payment being checked', tone: 'amber' };
  if (order.status === 'payment_pending' && order.payment_status === 'rejected') return { label: 'Payment not received', tone: 'gray' };
  return ORDER_STATUS[order.status] ?? { label: order.status, tone: 'gray' };
}

export const INDIAN_STATES = [
  'Maharashtra', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Fall beading / pico — the only services that can be added to a saree online
export async function fetchOnlineAddons() {
  const { data, error } = await supabase.from('services')
    .select('id, name, price').eq('is_online_addon', true).eq('is_active', true).order('sort_order');
  if (error) throw cleanError(error);
  return data.map(a => ({ ...a, price: Number(a.price) }));
}

export async function fetchPaymentSettings() {
  const { data, error } = await supabase.from('settings').select('upi_id, payee_name').eq('id', 1).single();
  if (error) throw cleanError(error);
  return data;
}

// { zone, charge } for a pincode and number of sarees (same function place_order uses)
export async function deliveryQuote(pincode, sarees) {
  const { data, error } = await supabase.rpc('delivery_quote', { p_pincode: pincode, p_sarees: sarees });
  if (error) throw cleanError(error);
  return { zone: data.zone, charge: Number(data.charge) };
}

// Sends only colour ids, quantities and add-on ids — never prices
export async function placeOrder(cart, addonsByItem, address) {
  const items = cart.map(i => ({ variant_id: i.id, qty: i.qty, addons: addonsByItem[i.id] ?? [] }));
  const { data, error } = await supabase.rpc('place_order', { p_items: items, p_address: address });
  if (error) throw cleanError(error);
  return data;   // { id, order_no, total }
}

const ORDER_FIELDS = `
  id, order_no, status, payment_status, subtotal, addons_total, delivery_charge, total,
  shipping_address, upi_utr, courier, tracking_no, created_at,
  items:order_items ( id, product_id, variant_id, name_snapshot, color_snapshot, unit_price, qty, addons,
    product:products ( slug ) )
`;

const shapeOrder = o => ({
  ...o,
  subtotal: Number(o.subtotal), addons_total: Number(o.addons_total),
  delivery_charge: Number(o.delivery_charge), total: Number(o.total),
  items: (o.items ?? []).map(i => ({ ...i, unit_price: Number(i.unit_price) })),
});

// RLS returns only the logged-in customer's own orders
export async function fetchMyOrder(orderNo) {
  const { data, error } = await supabase.from('orders').select(ORDER_FIELDS).eq('order_no', orderNo).maybeSingle();
  if (error) throw cleanError(error);
  return data ? shapeOrder(data) : null;
}

export async function fetchMyOrders() {
  const { data, error } = await supabase.from('orders')
    .select('id, order_no, status, payment_status, upi_utr, total, created_at, items:order_items ( qty )')
    .order('created_at', { ascending: false });
  if (error) throw cleanError(error);
  return data.map(o => ({ ...o, total: Number(o.total), count: o.items.reduce((s, i) => s + i.qty, 0) }));
}

export async function submitUtr(orderId, utr) {
  const { error } = await supabase.rpc('submit_utr', { p_order_id: orderId, p_utr: utr });
  if (error) throw cleanError(error);
}

export async function cancelMyOrder(orderId) {
  const { error } = await supabase.rpc('cancel_my_order', { p_order_id: orderId });
  if (error) throw cleanError(error);
}

// UPI deep link (project brief §8)
export function upiLink({ upiId, amount, orderNo }) {
  const params = new URLSearchParams({
    pa: upiId, pn: 'Vaibhav Laxmi Saree', am: amount.toFixed(2), cu: 'INR', tn: orderNo,
  });
  return `upi://pay?${params.toString().replace(/\+/g, '%20')}`;
}

// ---- Saved addresses (customers manage their own; RLS) -------------------------
export async function fetchMyAddresses() {
  const { data, error } = await supabase.from('addresses')
    .select('id, full_name, phone, line1, line2, city, state, pincode, is_default')
    .order('is_default', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw cleanError(error);
  return data;
}

export async function saveAddress(address) {
  const { error } = await supabase.from('addresses').insert({ ...address, line2: address.line2 || null });
  if (error) throw cleanError(error);
}

export async function deleteAddress(id) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw cleanError(error);
}
