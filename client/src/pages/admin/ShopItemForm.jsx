import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import ShopStockAction from '../../components/admin/ShopStockAction';
import { check } from '../../lib/validation';
import { checkPhoto } from '../../lib/admin';
import {
  SHOP_CATEGORIES, SHOP_REASONS, adjustShopStock, fetchShopHistory, fetchShopItem, removeShopPhoto, saveShopItem, uploadShopPhoto,
} from '../../lib/shopInventory';

const money = z.string().trim().regex(/^\d{1,7}(\.\d{1,2})?$/, 'Enter an amount in ₹');
const itemSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name').max(120, 'Too long'),
  category: z.string().trim().max(60, 'Too long'),
  fabric: z.string().trim().max(60, 'Too long'),
  color: z.string().trim().max(60, 'Too long'),
  selling_price: money.refine(v => Number(v) > 0, 'Enter the selling price'),
  cost_price: money.or(z.literal('')),
  low_stock_threshold: z.string().trim().regex(/^\d{1,4}$/, 'Enter 0 or more'),
  notes: z.string().trim().max(1000, 'Too long'),
  opening: z.string().trim().regex(/^\d{0,4}$/, 'Enter 0 or more'),
});

const EMPTY = { name: '', category: 'Sarees', fabric: '', color: '', selling_price: '', cost_price: '', low_stock_threshold: '1', notes: '', opening: '' };

const Field = ({ label, error, hint, children }) => (
  <div>
    <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">{label}</label>
    {children}
    {error ? <p className="font-body text-xs text-red-600 mt-1">{error}</p> : hint ? <p className="font-body text-xs text-gray-400 mt-1">{hint}</p> : null}
  </div>
);

const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const ShopItemForm = () => {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [photo, setPhoto] = useState(null);           // { file, url } new photo
  const [removePhoto, setRemovePhoto] = useState(false);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    const it = await fetchShopItem(id);
    setItem(it);
    if (it) {
      setForm({
        name: it.name, category: it.category ?? '', fabric: it.fabric ?? '', color: it.color ?? '',
        selling_price: String(it.selling_price), cost_price: it.cost_price === null ? '' : String(it.cost_price),
        low_stock_threshold: String(it.low_stock_threshold), notes: it.notes ?? '', opening: '',
      });
      setHistory(await fetchShopHistory({ itemId: id, limit: 50 }));
    }
  };

  useEffect(() => {
    if (!isNew) load().catch(e => setError(e.message));
  }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const pickPhoto = e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkPhoto(file);
    if (problem) { setError(problem); return; }
    setError('');
    setPhoto({ file, url: URL.createObjectURL(file) });
    setRemovePhoto(false);
  };

  const save = async (archive) => {
    const { data, errors: fieldErrors } = check(itemSchema, form);
    setErrors(fieldErrors ?? {});
    if (fieldErrors) { setError('Please check the highlighted fields.'); return; }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const values = {
        name: data.name, category: data.category || null, fabric: data.fabric || null, color: data.color || null,
        selling_price: Number(data.selling_price), cost_price: data.cost_price === '' ? null : Number(data.cost_price),
        low_stock_threshold: Number(data.low_stock_threshold), notes: data.notes || null,
        ...(archive !== undefined ? { is_active: !archive } : {}),
      };
      const saved = await saveShopItem(item?.id, values);

      // Photo: upload the new one, then remove the old file
      const oldPath = item?.photo_path ?? null;
      if (photo) {
        const path = await uploadShopPhoto(saved.code, photo.file);
        await saveShopItem(saved.id, { photo_path: path });
        await removeShopPhoto(oldPath);
      } else if (removePhoto && oldPath) {
        await saveShopItem(saved.id, { photo_path: null });
        await removeShopPhoto(oldPath);
      }

      if (isNew && Number(data.opening) > 0) {
        await adjustShopStock(saved.id, Number(data.opening), 'received', 'Opening stock');
      }

      if (isNew) {
        navigate(`/admin/shop-items/${saved.id}`, { replace: true });
      } else {
        setPhoto(null);
        setRemovePhoto(false);
        await load();
        setNotice(archive === true ? 'Item archived.' : archive === false ? 'Item is back in use.' : 'Saved.');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isNew && item === null && !error) return <div className="h-64 bg-white rounded-lg animate-pulse" />;
  if (!isNew && item === null) return <p className="font-body text-sm text-red-600">{error}</p>;

  const shownPhoto = photo?.url ?? (removePhoto ? null : item?.photoUrl);

  return (
    <div className="max-w-3xl space-y-5">
      <Link to="/admin/shop-items" className="font-body text-xs text-gray-500 hover:text-maroon-900 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">arrow_back</span> Shop items
      </Link>
      <div>
        <p className="section-label mb-1">Shop Inventory · private</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">
          {isNew ? 'Add shop item' : <>{item.name} <span className="text-gold-700 text-xl align-middle">{item.code}</span></>}
        </h1>
        {!isNew && !item.is_active && <p className="font-body text-xs text-gray-500 mt-1">Archived — not counted in your totals.</p>}
      </div>

      {notice && <p className="font-body text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">{notice}</p>}

      {!isNew && (
        <section className="bg-white rounded-lg shadow-soft border border-gray-50 p-4 sm:p-5">
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-3">Stock in / sold</h2>
          <ShopStockAction key={item.qty} item={item} onDone={async () => { await load(); setNotice('Stock updated.'); }} />
        </section>
      )}

      <section className="bg-white rounded-lg shadow-soft border border-gray-50 p-4 sm:p-5 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-charcoal">Details</h2>
        <div className="flex gap-4 items-start">
          <div className="w-24 h-28 rounded overflow-hidden bg-maroon-50 shrink-0 flex items-center justify-center">
            {shownPhoto ? <img src={shownPhoto} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-maroon-900/40">add_a_photo</span>}
          </div>
          <div className="font-body text-xs space-y-2">
            <label className="btn-secondary !py-1.5 !px-3 inline-flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-sm">photo_camera</span>{shownPhoto ? 'Change photo' : 'Add photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickPhoto} className="hidden" />
            </label>
            {shownPhoto && <button type="button" onClick={() => { setPhoto(null); setRemovePhoto(true); }} className="block text-gray-500 underline">Remove photo</button>}
            <p className="text-gray-400">Optional · private · shrunk before upload</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Name" error={errors.name}>
              <input className="input-field" value={form.name} placeholder="e.g. Red Banarasi silk saree" onChange={e => set('name', e.target.value)} />
            </Field>
          </div>
          <Field label="Category" error={errors.category}>
            <input className="input-field" list="shop-categories" value={form.category} onChange={e => set('category', e.target.value)} />
            <datalist id="shop-categories">{SHOP_CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Fabric" error={errors.fabric}>
            <input className="input-field" value={form.fabric} onChange={e => set('fabric', e.target.value)} />
          </Field>
          <Field label="Colour" error={errors.color}>
            <input className="input-field" value={form.color} onChange={e => set('color', e.target.value)} />
          </Field>
          <Field label="Selling price (₹)" error={errors.selling_price}>
            <input className="input-field" inputMode="decimal" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
          </Field>
          <Field label="Cost price (₹, optional)" error={errors.cost_price} hint="For your own records only">
            <input className="input-field" inputMode="decimal" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} />
          </Field>
          <Field label="Warn me when only … left" error={errors.low_stock_threshold}>
            <input className="input-field" inputMode="numeric" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} />
          </Field>
          {isNew && (
            <Field label="Pieces in shop now" error={errors.opening} hint="Saved as 'Received — opening stock'">
              <input className="input-field" inputMode="numeric" value={form.opening} placeholder="0" onChange={e => set('opening', e.target.value)} />
            </Field>
          )}
          <div className="sm:col-span-2">
            <Field label="Notes (optional)" error={errors.notes}>
              <textarea className="input-field min-h-[70px]" value={form.notes} maxLength={1000} placeholder="Supplier, rack, anything to remember" onChange={e => set('notes', e.target.value)} />
            </Field>
          </div>
        </div>

        {error && <p className="font-body text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => save()} disabled={busy} className="btn-primary disabled:opacity-50">{busy ? 'Saving…' : isNew ? 'Add item' : 'Save changes'}</button>
          {!isNew && (
            <button onClick={() => save(item.is_active)} disabled={busy} className="btn-secondary disabled:opacity-50">
              {item.is_active ? 'Archive item' : 'Bring back into use'}
            </button>
          )}
        </div>
      </section>

      {!isNew && (
        <section className="bg-white rounded-lg shadow-soft border border-gray-50 p-4 sm:p-5">
          <h2 className="font-heading text-xl font-semibold text-charcoal mb-3">History</h2>
          {history.length === 0 ? <p className="font-body text-sm text-gray-500">No stock changes yet.</p> : (
            <div className="divide-y divide-gray-100">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 py-2 font-body text-sm">
                  <span className={`w-10 text-center font-bold ${h.change > 0 ? 'text-emerald-700' : 'text-red-600'}`}>{h.change > 0 ? `+${h.change}` : h.change}</span>
                  <span className="flex-1 min-w-0 text-gray-700">{SHOP_REASONS[h.reason]?.label ?? h.reason}{h.note ? ` — ${h.note}` : ''}</span>
                  <span className="text-xs text-gray-400 shrink-0">{when(h.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ShopItemForm;
