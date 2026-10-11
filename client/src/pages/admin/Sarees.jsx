import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminProducts, setProductActive, adjustStock } from '../../lib/admin';
import { formatPrice } from '../../lib/catalogue';

const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'hidden', label: 'Hidden / Drafts' },
  { key: 'out', label: 'Out of stock' },
];

const activeColours = p => p.variants.filter(v => v.is_active);
const isSoldOut = p => {
  const colours = activeColours(p);
  return colours.length > 0 && colours.every(v => v.stock === 0);
};

// Online stock for one colour: − / + and "set to"
const ColourStock = ({ variant, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');

  const change = async (amount, reason, note) => {
    setBusy(true);
    setError('');
    try {
      await adjustStock(variant.id, amount, reason, note);
      setTarget('');
      await onChanged();
    } catch (e) {
      setError(e.message.replace(/^.*?: /, ''));
    } finally {
      setBusy(false);
    }
  };

  const setTo = () => {
    const n = Number(target);
    if (!Number.isInteger(n) || n < 0) { setError('Enter 0 or more'); return; }
    const diff = n - (variant.stock ?? 0);
    if (diff === 0 && variant.stock !== null) return;
    if (diff === 0) { setError('Use + to start counting'); return; }
    change(diff, 'adjustment', `Set to ${n}`);
  };

  const stockLabel = variant.stock === null ? '—' : variant.stock;
  const low = variant.stock !== null && variant.stock > 0 && variant.stock <= variant.low_stock_threshold;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="w-4 h-4 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: variant.color_hex ?? '#ccc' }} />
      <span className="font-body text-sm text-charcoal flex-1 min-w-[90px]">
        {variant.color_name}
        {!variant.is_active && <span className="ml-1 text-[10px] text-gray-400">(hidden)</span>}
      </span>
      <div className="flex items-center gap-1">
        <button disabled={busy || !variant.stock} onClick={() => change(-1, 'adjustment', 'Quick −1')}
          className="w-8 h-8 border border-gray-200 rounded-sm font-body hover:border-maroon-900 disabled:opacity-30" aria-label="Minus one">−</button>
        <span className={`w-10 text-center font-body text-sm font-semibold ${variant.stock === 0 ? 'text-red-600' : low ? 'text-amber-600' : 'text-charcoal'}`}
          title={variant.stock === null ? 'Not tracked yet — can be ordered' : ''}>
          {stockLabel}
        </span>
        <button disabled={busy} onClick={() => change(1, 'new_stock', 'Quick +1')}
          className="w-8 h-8 border border-gray-200 rounded-sm font-body hover:border-maroon-900 disabled:opacity-30" aria-label="Plus one">+</button>
      </div>
      <div className="flex items-center gap-1">
        <input value={target} onChange={e => setTarget(e.target.value)} inputMode="numeric" placeholder="Set"
          className="w-14 border border-gray-200 rounded-sm px-2 py-1.5 text-sm font-body focus:outline-none focus:border-maroon-900" />
        <button disabled={busy || target === ''} onClick={setTo}
          className="px-2 py-1.5 bg-maroon-900 text-white rounded-sm font-body text-xs disabled:opacity-30">OK</button>
      </div>
      {error && <p className="w-full font-body text-xs text-red-600">{error}</p>}
    </div>
  );
};

const SareeCard = ({ product, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const colours = activeColours(product);
  const untracked = colours.every(v => v.stock === null);

  const toggleActive = async () => {
    setBusy(true);
    try {
      await setProductActive(product.id, !product.is_active);
      await onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-50 overflow-hidden">
      <div className="flex gap-3 p-3">
        <div className="w-20 h-24 shrink-0 rounded overflow-hidden bg-maroon-50">
          {product.mainImage && <img src={product.mainImage} alt="" loading="lazy" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-body text-[11px] font-semibold text-gold-700">{product.code}</span>
            {!product.is_active && <span className="font-body text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600">Hidden</span>}
            {isSoldOut(product) && <span className="font-body text-[10px] px-1.5 py-0.5 rounded-sm bg-red-50 text-red-700">Out of stock</span>}
          </div>
          <p className="font-heading font-semibold text-charcoal leading-snug truncate">{product.name}</p>
          <p className="font-body text-xs text-gray-500 truncate">{product.category?.name} · {colours.length} colour{colours.length !== 1 ? 's' : ''}</p>
          <p className="font-body text-sm mt-1">
            <span className="font-semibold text-maroon-900">{formatPrice(product.price)}</span>
            {product.basePrice && <span className="text-xs text-gray-400"> · her price {formatPrice(product.basePrice)}</span>}
            {product.price_is_manual && <span className="text-[10px] text-amber-700"> · manual</span>}
          </p>
        </div>
      </div>
      <div className="flex border-t border-gray-100 text-xs font-body font-medium">
        <button onClick={() => setOpen(!open)} className="flex-1 py-2.5 flex items-center justify-center gap-1 hover:bg-maroon-50 text-charcoal">
          <span className="material-symbols-outlined text-base">inventory</span>
          Stock{untracked ? ' (not set)' : ''}
        </button>
        <Link to={`/admin/sarees/${product.id}`} className="flex-1 py-2.5 flex items-center justify-center gap-1 border-l border-gray-100 hover:bg-maroon-50 text-charcoal">
          <span className="material-symbols-outlined text-base">edit</span>
          Edit
        </Link>
        <button onClick={toggleActive} disabled={busy}
          className={`flex-1 py-2.5 flex items-center justify-center gap-1 border-l border-gray-100 disabled:opacity-50 ${
            product.is_active ? 'text-gray-600 hover:bg-gray-50' : 'text-emerald-700 hover:bg-emerald-50'
          }`}>
          <span className="material-symbols-outlined text-base">{product.is_active ? 'visibility_off' : 'visibility'}</span>
          {product.is_active ? 'Hide' : 'Show on website'}
        </button>
      </div>
      {open && (
        <div className="px-3 pb-2 bg-cream/60 border-t border-gray-100">
          <p className="font-body text-[11px] text-gray-500 pt-2">
            Online stock only (separate from the shop). “—” = not tracked yet: customers can still order.
          </p>
          {product.variants.map(v => <ColourStock key={v.id} variant={v} onChanged={onChanged} />)}
        </div>
      )}
    </div>
  );
};

const Sarees = () => {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('live');
  const [search, setSearch] = useState('');

  const load = () => fetchAdminProducts()
    .then(setProducts)
    .catch(e => setError(e.message));

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    live: products?.filter(p => p.is_active).length ?? 0,
    hidden: products?.filter(p => !p.is_active).length ?? 0,
    out: products?.filter(isSoldOut).length ?? 0,
  }), [products]);

  const visible = (products ?? []).filter(p => {
    if (tab === 'live' && !p.is_active) return false;
    if (tab === 'hidden' && p.is_active) return false;
    if (tab === 'out' && !isSoldOut(p)) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${p.code} ${p.name} ${p.category?.name ?? ''}`.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="section-label mb-1">Online Store</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">Sarees</h1>
        </div>
        <Link to="/admin/sarees/new" className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">add</span>
          Add Saree
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors ${
              tab === t.key ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'
            }`}>
            {t.label} ({counts[t.key]})
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or code…"
          className="ml-auto w-full sm:w-64 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white" />
      </div>

      {error && <p className="font-body text-sm text-red-600 mb-4">{error}</p>}
      {products === null && !error ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-36 bg-white rounded-lg animate-pulse" />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">
          {tab === 'hidden' ? 'No hidden sarees or drafts.' : tab === 'out' ? 'No sarees are fully out of stock.' : 'No sarees found.'}
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map(p => <SareeCard key={p.id} product={p} onChanged={load} />)}
        </div>
      )}
    </div>
  );
};

export default Sarees;
