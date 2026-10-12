import { supabase } from './supabase';

// Admin "Export data" (project brief §9.9): CSV backups that open in Excel / Google Sheets.
// Everything is read with the admin's own login, so the database rules still apply.

// Reads every row, 1000 at a time (the API returns at most 1000 per request)
async function fetchAll(build) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) return rows;
  }
}

// One CSV cell. Text starting with = + - @ is prefixed with ' so spreadsheet apps
// never run it as a formula (a customer could type one into their name or address).
const cell = value => {
  if (value === null || value === undefined) return '';
  let text = Array.isArray(value) ? value.join(', ') : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function download(name, header, rows) {
  const csv = [header, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });   // BOM: Excel shows ₹ correctly
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return rows.length;
}

const date = iso => (iso ? new Date(iso).toLocaleString('en-IN') : '');

export const EXPORTS = [
  {
    key: 'sarees', label: 'Sarees & colours (with your base prices)',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('products')
        .select('code, name, fabric, occasions, price, price_is_manual, is_active, created_at, category:categories(name), cost:product_costs(base_price), variants:product_variants(color_name, stock, is_active)')
        .order('code'));
      const out = rows.flatMap(p => {
        const cost = Array.isArray(p.cost) ? p.cost[0] : p.cost;
        const base = [p.code, p.name, p.category?.name, p.fabric, p.occasions, cost?.base_price, p.price, p.price_is_manual ? 'manual' : 'rule', p.is_active ? 'live' : 'hidden'];
        return (p.variants.length ? p.variants : [{}]).map(v => [...base, v.color_name, v.stock ?? 'not tracked', v.is_active === false ? 'hidden' : '']);
      });
      return download('sarees', ['Code', 'Name', 'Category', 'Fabric', 'Occasions', 'Her price', 'Website price', 'Price', 'Status', 'Colour', 'Online stock', 'Colour status'], out);
    },
  },
  {
    key: 'orders', label: 'Orders',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('orders')
        .select('order_no, created_at, status, payment_status, upi_utr, subtotal, addons_total, delivery_charge, total, shipping_address, courier, tracking_no, items:order_items(name_snapshot, color_snapshot, qty, unit_price, addons)')
        .order('created_at'));
      const out = rows.map(o => {
        const a = o.shipping_address ?? {};
        const items = o.items.map(i => `${i.qty} x ${i.name_snapshot} (${i.color_snapshot ?? ''}) @ ${i.unit_price}${i.addons?.length ? ' + ' + i.addons.map(x => x.name).join('/') : ''}`).join('; ');
        return [o.order_no, date(o.created_at), o.status, o.payment_status, o.upi_utr, a.full_name, a.phone,
          [a.line1, a.line2].filter(Boolean).join(', '), a.city, a.state, a.pincode, items,
          o.subtotal, o.addons_total, o.delivery_charge, o.total, o.courier, o.tracking_no];
      });
      return download('orders', ['Order no', 'Date', 'Status', 'Payment', 'UTR', 'Name', 'Phone', 'Address', 'City', 'State', 'Pincode', 'Items',
        'Sarees ₹', 'Fall/pico ₹', 'Delivery ₹', 'Total ₹', 'Courier', 'Tracking no'], out);
    },
  },
  {
    key: 'customers', label: 'Customers',
    run: async () => {
      const [people, orders] = await Promise.all([
        fetchAll(() => supabase.from('profiles').select('id, full_name, phone, role, created_at').order('created_at')),
        fetchAll(() => supabase.from('orders').select('user_id, total, payment_status, status')),
      ]);
      const out = people.filter(p => p.role === 'customer').map(p => {
        const mine = orders.filter(o => o.user_id === p.id);
        const paid = mine.filter(o => o.payment_status === 'verified' && !['cancelled', 'returned'].includes(o.status));
        return [p.full_name, p.phone, date(p.created_at), mine.length, paid.reduce((s, o) => s + Number(o.total), 0)];
      });
      return download('customers', ['Name', 'Phone', 'Joined', 'Orders', 'Paid total ₹'], out);
    },
  },
  {
    key: 'stock', label: 'Online stock register',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('stock_movements')
        .select('created_at, change, reason, note, variant:product_variants(color_name, product:products(code, name)), by:profiles(full_name)')
        .order('created_at'));
      return download('online-stock-register', ['Date', 'Code', 'Saree', 'Colour', 'Change', 'Reason', 'Note', 'By'],
        rows.map(r => [date(r.created_at), r.variant?.product?.code, r.variant?.product?.name, r.variant?.color_name, r.change, r.reason, r.note, r.by?.full_name]));
    },
  },
  {
    key: 'shop-items', label: 'Shop items (private)',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('shop_items')
        .select('code, name, category, fabric, color, cost_price, selling_price, qty, low_stock_threshold, notes, is_active').order('code'));
      return download('shop-items', ['Code', 'Name', 'Category', 'Fabric', 'Colour', 'Cost ₹', 'Selling ₹', 'Qty', 'Warn at', 'Notes', 'Status'],
        rows.map(i => [i.code, i.name, i.category, i.fabric, i.color, i.cost_price, i.selling_price, i.qty, i.low_stock_threshold, i.notes, i.is_active ? 'in use' : 'archived']));
    },
  },
  {
    key: 'shop-history', label: 'Shop stock history (private)',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('shop_stock_movements')
        .select('created_at, change, reason, note, item:shop_items(code, name), by:profiles(full_name)').order('created_at'));
      return download('shop-stock-history', ['Date', 'Code', 'Item', 'Change', 'Reason', 'Note', 'By'],
        rows.map(r => [date(r.created_at), r.item?.code, r.item?.name, r.change, r.reason, r.note, r.by?.full_name]));
    },
  },
  {
    key: 'activity', label: 'Activity log',
    run: async () => {
      const rows = await fetchAll(() => supabase.from('admin_activity_log')
        .select('created_at, action, entity, entity_id, details, admin:profiles(full_name)').order('created_at'));
      return download('activity-log', ['Date', 'By', 'Action', 'What', 'Id', 'Details'],
        rows.map(r => [date(r.created_at), r.admin?.full_name, r.action, r.entity, r.entity_id, JSON.stringify(r.details)]));
    },
  },
];
