import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ShopStockAction from '../../components/admin/ShopStockAction';
import { formatPrice } from '../../lib/catalogue';
import { fetchShopItems, shopStockState } from '../../lib/shopInventory';

const FILTERS = [
  { key: 'all', label: 'In use' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
  { key: 'archived', label: 'Archived' },
];

const QTY_CLASS = { out: 'bg-red-50 text-red-700', low: 'bg-amber-50 text-amber-800', in: 'bg-emerald-50 text-emerald-800' };

const ItemCard = ({ item, onChanged }) => {
  const [open, setOpen] = useState(false);
  const state = shopStockState(item);
  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-50 overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="w-16 h-20 shrink-0 rounded overflow-hidden bg-maroon-50 flex items-center justify-center">
          {item.photoUrl ? <img src={item.photoUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
            : <span className="material-symbols-outlined text-maroon-900/40">storefront</span>}
        </div>
        <div className="flex-1 min-w-0 font-body">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gold-700">{item.code}{!item.is_active && <span className="ml-1 text-gray-400">(archived)</span>}</p>
              <p className="font-heading font-semibold text-charcoal leading-snug truncate">{item.name}</p>
            </div>
            <span className={`shrink-0 px-2 py-1 rounded-sm text-xs font-bold ${QTY_CLASS[state]}`}>{item.qty} pcs</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{[item.category, item.fabric, item.color].filter(Boolean).join(' · ')}</p>
          <p className="text-sm mt-0.5">
            <span className="font-semibold text-maroon-900">{formatPrice(item.selling_price)}</span>
            {item.cost_price !== null && <span className="text-xs text-gray-400"> · cost {formatPrice(item.cost_price)}</span>}
          </p>
        </div>
      </div>
      <div className="flex border-t border-gray-100 text-xs font-body font-medium">
        <button onClick={() => setOpen(!open)} className="flex-1 py-2.5 flex items-center justify-center gap-1 hover:bg-maroon-50 text-charcoal">
          <span className="material-symbols-outlined text-base">swap_vert</span>Stock in / sold
        </button>
        <Link to={`/admin/shop-items/${item.id}`} className="flex-1 py-2.5 flex items-center justify-center gap-1 border-l border-gray-100 hover:bg-maroon-50 text-charcoal">
          <span className="material-symbols-outlined text-base">edit</span>Edit & history
        </Link>
      </div>
      {open && (
        <div className="p-3 bg-cream/60 border-t border-gray-100">
          <ShopStockAction item={item} onDone={async () => { setOpen(false); await onChanged(); }} />
        </div>
      )}
    </div>
  );
};

const ShopItems = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') ?? 'all';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const load = () => fetchShopItems().then(setItems).catch(e => setError(e.message));
  useEffect(() => { load(); }, []);

  const active = useMemo(() => (items ?? []).filter(i => i.is_active), [items]);
  const counts = {
    all: active.length,
    low: active.filter(i => shopStockState(i) === 'low').length,
    out: active.filter(i => shopStockState(i) === 'out').length,
    archived: (items ?? []).length - active.length,
  };
  const totals = useMemo(() => ({
    pieces: active.reduce((s, i) => s + i.qty, 0),
    value: active.reduce((s, i) => s + i.qty * i.selling_price, 0),
  }), [active]);
  const categories = [...new Set((items ?? []).map(i => i.category).filter(Boolean))].sort();

  const visible = (items ?? []).filter(i => {
    if (filter === 'archived' ? i.is_active : !i.is_active) return false;
    if (filter === 'low' && shopStockState(i) !== 'low') return false;
    if (filter === 'out' && shopStockState(i) !== 'out') return false;
    if (category && i.category !== category) return false;
    if (!search) return true;
    return `${i.code} ${i.name} ${i.category ?? ''} ${i.fabric ?? ''} ${i.color ?? ''} ${i.notes ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-2">
        <div>
          <p className="section-label mb-1">Shop Inventory · private</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">Shop Items</h1>
        </div>
        <Link to="/admin/shop-items/new" className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>Add Item
        </Link>
      </div>
      <p className="font-body text-xs text-gray-500 mb-5 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">lock</span>
        Only you can see this. It is your shop record and never changes the website or its online stock.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ['Items in use', counts.all],
          ['Pieces in shop', totals.pieces],
          ['Value at selling price', formatPrice(totals.value)],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-lg shadow-soft border border-gray-50 p-3">
            <p className="font-heading text-xl sm:text-2xl font-bold text-charcoal">{items === null ? '…' : value}</p>
            <p className="font-body text-[11px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setParams(f.key === 'all' ? {} : { filter: f.key }, { replace: true })}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors ${
              filter === f.key ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'}`}>
            {f.label} ({counts[f.key]})
          </button>
        ))}
        {categories.length > 1 && (
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="border border-gray-200 rounded-sm px-2 py-1.5 text-xs font-body bg-white focus:outline-none focus:border-maroon-900">
            <option value="">All categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        )}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, code, colour…"
          className="ml-auto w-full sm:w-64 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white" />
      </div>

      {error && <p className="font-body text-sm text-red-600 mb-4">{error}</p>}
      {items === null && !error ? (
        <div className="grid gap-3 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <div className="font-body text-sm text-gray-500 py-10 text-center">
          {items?.length === 0 ? (
            <>No shop items yet. <Link to="/admin/shop-items/new" className="text-maroon-900 underline">Add your first item</Link>.</>
          ) : 'No items here.'}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map(i => <ItemCard key={i.id} item={i} onChanged={load} />)}
        </div>
      )}
    </div>
  );
};

export default ShopItems;
