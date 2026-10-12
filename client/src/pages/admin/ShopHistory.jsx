import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SHOP_REASONS, fetchShopHistory } from '../../lib/shopInventory';

// Every in-shop stock change (private), newest first
const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const ShopHistory = () => {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchShopHistory({ limit: 500 }).then(setRows).catch(e => setError(e.message));
  }, []);

  const visible = (rows ?? []).filter(r => {
    if (reason && r.reason !== reason) return false;
    if (!search) return true;
    return `${r.item?.code} ${r.item?.name} ${r.item?.color ?? ''} ${r.note ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <p className="section-label mb-1">Shop Inventory · private</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-1">Shop Stock History</h1>
      <p className="font-body text-sm text-gray-500 mb-6">Every change to your shop stock. Online stock is kept separately.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <select value={reason} onChange={e => setReason(e.target.value)}
          className="border border-gray-200 rounded-sm px-2 py-2 text-sm font-body bg-white focus:outline-none focus:border-maroon-900">
          <option value="">All changes</option>
          {Object.entries(SHOP_REASONS).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, code or note…"
          className="flex-1 sm:flex-none sm:w-72 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white" />
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}
      {rows === null && !error ? (
        <div className="h-48 bg-white rounded-lg animate-pulse" />
      ) : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">No shop stock changes yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 divide-y divide-gray-100">
          {visible.map(r => (
            <Link key={r.id} to={`/admin/shop-items/${r.item?.id}`} className="flex items-start gap-3 p-3 hover:bg-maroon-50/40">
              <span className={`w-12 text-center font-body font-bold text-sm shrink-0 ${r.change > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {r.change > 0 ? `+${r.change}` : r.change}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-charcoal truncate">
                  <span className="font-semibold text-gold-700">{r.item?.code}</span> {r.item?.name}
                  {r.item?.color && <span className="text-gray-500"> · {r.item.color}</span>}
                </p>
                <p className="font-body text-xs text-gray-500">{SHOP_REASONS[r.reason]?.label ?? r.reason}{r.note ? ` — ${r.note}` : ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body text-xs text-gray-500">{when(r.created_at)}</p>
                <p className="font-body text-[11px] text-gray-400">{r.by?.full_name ?? ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopHistory;
