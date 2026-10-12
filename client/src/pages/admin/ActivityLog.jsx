import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// Every admin change, written automatically by the database (project brief §9.7). Read-only.

const ENTITY = {
  products: 'Saree', product_variants: 'Colour', product_images: 'Photo', product_costs: 'Her price',
  categories: 'Category', settings: 'Settings', services: 'Service', shop_items: 'Shop item', orders: 'Order',
};
const OP = { insert: 'Added', update: 'Changed', delete: 'Removed' };
const SPECIAL = {
  stock_new_stock: 'Online stock added', stock_return: 'Online stock: return', stock_adjustment: 'Online stock corrected',
  shop_stock_received: 'Shop stock received', shop_stock_sold: 'Shop stock sold', shop_stock_returned: 'Shop stock returned',
  shop_stock_damaged: 'Shop stock damaged', shop_stock_adjustment: 'Shop stock corrected',
  order_payment_verified: 'Payment verified', order_payment_rejected: 'Payment not found', order_packed: 'Order packed',
  order_shipped: 'Order shipped', order_delivered: 'Order delivered', order_cancelled: 'Order cancelled',
  order_return_requested: 'Return requested', order_returned: 'Order returned', order_exchange_requested: 'Exchange requested',
};
const FILTERS = [
  { key: '', label: 'Everything' },
  { key: 'orders', label: 'Orders' },
  { key: 'catalogue', label: 'Sarees & stock' },
  { key: 'shop_items', label: 'Shop inventory' },
  { key: 'settings', label: 'Settings & prices' },
];
const inFilter = (r, f) => !f
  || (f === 'catalogue' && ['products', 'product_variants', 'product_images', 'product_costs', 'categories'].includes(r.entity))
  || (f === 'settings' && ['settings', 'services'].includes(r.entity))
  || r.entity === f;

const short = v => {
  if (v === null || v === undefined || v === '') return '—';
  const text = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return text.length > 40 ? text.slice(0, 40) + '…' : text;
};

// One readable line of what changed
function describe(r) {
  const d = r.details ?? {};
  if (r.action.startsWith('order_')) return [d.order_no, d.courier && `${d.courier} ${d.tracking_no ?? ''}`, d.note].filter(Boolean).join(' · ');
  if (r.action.startsWith('stock_') || r.action.startsWith('shop_stock_')) {
    const before = d.stock_before ?? d.qty_before;
    const after = d.stock_after ?? d.qty_after;
    return `${d.change > 0 ? '+' : ''}${d.change} (${before ?? '—'} → ${after})${d.note ? ' · ' + d.note : ''}`;
  }
  if (r.action === 'update') {
    return Object.entries(d).slice(0, 3).map(([k, v]) => `${k}: ${short(v?.from)} → ${short(v?.to)}`).join(' · ');
  }
  return d.name ?? d.code ?? d.color_name ?? d.storage_path ?? d.base_price ?? '';
}

const ActivityLog = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    supabase.from('admin_activity_log').select('id, action, entity, entity_id, details, created_at, admin:profiles ( full_name )')
      .order('created_at', { ascending: false }).limit(400)
      .then(({ data, error: e }) => (e ? setError(e.message) : setRows(data)));
  }, []);

  const visible = (rows ?? []).filter(r => inFilter(r, filter));

  return (
    <div>
      <p className="section-label mb-1">Settings</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-1">Activity Log</h1>
      <p className="font-body text-sm text-gray-500 mb-5">Every change made in the admin panel, newest first. Nobody can edit or delete these entries.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border ${
              filter === f.key ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {rows === null && !error ? <div className="h-48 bg-white rounded-lg animate-pulse" /> : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">Nothing here yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 divide-y divide-gray-100">
          {visible.map(r => (
            <div key={r.id} className="p-3 flex gap-3 font-body">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-charcoal">
                  <span className="font-semibold">{SPECIAL[r.action] ?? `${OP[r.action] ?? r.action} ${(ENTITY[r.entity] ?? r.entity).toLowerCase()}`}</span>
                </p>
                <p className="text-xs text-gray-500 break-words">{describe(r)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
                <p className="text-[11px] text-gray-400">{r.admin?.full_name ?? ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
