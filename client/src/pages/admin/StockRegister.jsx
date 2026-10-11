import React, { useEffect, useState } from 'react';
import { fetchStockRegister } from '../../lib/admin';

// Every online stock change (written automatically by adjust_stock and, later, by orders)
const REASONS = {
  new_stock: 'New stock',
  online_order: 'Online order',
  order_cancelled: 'Order cancelled',
  return: 'Return',
  adjustment: 'Adjustment',
};

const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const StockRegister = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStockRegister({ limit: 300 }).then(setRows).catch(e => setError(e.message));
  }, []);

  const visible = (rows ?? []).filter(r => {
    if (!search) return true;
    const p = r.variant?.product;
    return `${p?.code} ${p?.name} ${r.variant?.color_name} ${r.note ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <p className="section-label mb-1">Online Store</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-1">Online Stock Register</h1>
      <p className="font-body text-sm text-gray-500 mb-6">Every change to online stock, newest first. Shop stock is kept separately.</p>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search saree, code or colour…"
        className="w-full sm:w-72 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white mb-4" />

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {rows === null && !error ? (
        <div className="h-48 bg-white rounded-lg animate-pulse" />
      ) : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">No stock changes yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 divide-y divide-gray-100">
          {visible.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3">
              <span className={`w-12 text-center font-body font-bold text-sm shrink-0 ${r.change > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {r.change > 0 ? `+${r.change}` : r.change}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-charcoal truncate">
                  <span className="font-semibold text-gold-700">{r.variant?.product?.code}</span> {r.variant?.product?.name}
                  <span className="text-gray-500"> · {r.variant?.color_name}</span>
                </p>
                <p className="font-body text-xs text-gray-500">
                  {REASONS[r.reason] ?? r.reason}{r.note ? ` — ${r.note}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-xs text-gray-500">{when(r.created_at)}</p>
                <p className="font-body text-[11px] text-gray-400">{r.by?.full_name ?? (r.by === null ? 'system' : '')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockRegister;
