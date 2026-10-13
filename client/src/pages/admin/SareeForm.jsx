import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { COLOUR_FAMILIES, OCCASIONS, fetchCategories, formatPrice } from '../../lib/catalogue';
import {
  websitePrice, fetchAdminProduct, setProductActive, adjustStock, uploadPhotos, deletePhotos, checkPhoto,
} from '../../lib/admin';
import { suggestDetails, indexPhotos } from '../../lib/vision';

// Add a new saree or edit an existing one (project brief §6 "Adding new sarees").
// New sarees are saved HIDDEN first, then colours + photos, then published if chosen.

let keySeq = 0;
const newKey = () => `c${++keySeq}`;
const guessHex = name => COLOUR_FAMILIES.find(f => f.words.some(w => name.toLowerCase().includes(w)))?.hex ?? '#cccccc';

const emptyColour = () => ({ key: newKey(), id: null, color_name: '', color_hex: '#cccccc', hexTouched: false,
  stock: null, openingStock: '', existing: [], removeIds: [], files: [], remove: false });

const emptyForm = () => ({
  name: '', category_id: '', fabric: '', occasions: [], description: '', work: '', blouse_details: '',
  saree_length_m: '', blouse_included: true, base_price: '', manualPrice: false, price: '',
  colours: [emptyColour()], shared: { existing: [], removeIds: [], files: [] },
});

function fromProduct(p) {
  return {
    name: p.name, category_id: p.category_id ?? '', fabric: p.fabric ?? '', occasions: p.occasions ?? [],
    description: p.description ?? '', work: p.work ?? '', blouse_details: p.blouse_details ?? '',
    saree_length_m: p.saree_length_m ?? '', blouse_included: p.blouse_included,
    base_price: p.basePrice ?? '', manualPrice: p.price_is_manual, price: p.price,
    colours: p.variants.filter(v => v.is_active).map(v => ({
      key: newKey(), id: v.id, color_name: v.color_name, color_hex: v.color_hex ?? '#cccccc', hexTouched: true,
      stock: v.stock, openingStock: '', existing: v.images, removeIds: [], files: [], remove: false,
    })),
    shared: { existing: p.sharedImages, removeIds: [], files: [] },
  };
}

// Photo picker: existing photos (can be removed) + newly chosen files (previewed)
const Photos = ({ value, onChange, label }) => {
  const [error, setError] = useState('');
  const kept = value.existing.filter(i => !value.removeIds.includes(i.id));

  const addFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = '';
    const bad = picked.map(checkPhoto).find(Boolean);
    setError(bad ?? '');
    const ok = picked.filter(f => !checkPhoto(f)).map(file => ({ file, url: URL.createObjectURL(file) }));
    onChange({ ...value, files: [...value.files, ...ok] });
  };

  return (
    <div>
      <p className="font-body text-xs font-semibold text-charcoal uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {kept.map((img, i) => (
          <div key={img.id} className="relative w-20 h-24 rounded overflow-hidden border border-gray-200">
            <img src={img.url} alt="" className="w-full h-full object-cover" />
            {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-maroon-900/80 text-white text-[9px] text-center">MAIN</span>}
            <button type="button" onClick={() => onChange({ ...value, removeIds: [...value.removeIds, img.id] })}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full text-xs shadow" aria-label="Remove photo">✕</button>
          </div>
        ))}
        {value.files.map((f, i) => (
          <div key={f.url} className="relative w-20 h-24 rounded overflow-hidden border-2 border-dashed border-gold-700">
            <img src={f.url} alt="" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 inset-x-0 bg-gold-700/90 text-white text-[9px] text-center">NEW</span>
            <button type="button" onClick={() => onChange({ ...value, files: value.files.filter((_, j) => j !== i) })}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full text-xs shadow" aria-label="Remove photo">✕</button>
          </div>
        ))}
        <label className="w-20 h-24 rounded border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-maroon-900 text-gray-400 hover:text-maroon-900">
          <span className="material-symbols-outlined">add_a_photo</span>
          <span className="text-[10px] font-body">Add</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} className="hidden" />
        </label>
      </div>
      {error && <p className="font-body text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

// "Suggest details from photo": category / fabric / occasions from the most similar sarees
// she has already labelled, main colour from the photo. Suggestions only — she taps Use.
const SuggestPanel = ({ source, categories, excludeProductId, onUse }) => {
  const [state, setState] = useState({ status: 'idle' });
  const run = async () => {
    setState({ status: 'working', progress: 0 });
    try {
      const result = await suggestDetails(source, { excludeProductId, onProgress: p => setState({ status: 'working', progress: p }) });
      setState({ status: 'done', result });
    } catch (e) {
      setState({ status: 'error', error: e.message });
    }
  };
  const r = state.result;
  const category = r && categories.find(c => c.id === r.categoryId);
  const chip = (label, value, use) => value ? (
    <div className="flex items-center gap-2 font-body text-sm">
      <span className="text-gray-500 w-24 shrink-0">{label}</span>
      <span className="font-semibold text-charcoal flex-1">{value}</span>
      <button type="button" onClick={use} className="px-2.5 py-1 rounded-sm border border-maroon-900 text-maroon-900 text-xs hover:bg-maroon-50">Use</button>
    </div>
  ) : null;

  return (
    <div className="sm:col-span-2 rounded-lg border border-gold-700/30 bg-cream/70 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="material-symbols-outlined text-gold-700">auto_awesome</span>
        <p className="font-body text-sm text-charcoal flex-1 min-w-[180px]">
          <span className="font-semibold">Suggest details from photo</span>
          <span className="block text-xs text-gray-500">
            {source ? 'Uses the first photo of the first colour. You decide what to keep.' : 'Add a photo in Colours below first.'}
          </span>
        </p>
        <button type="button" disabled={!source || state.status === 'working'} onClick={run} className="btn-secondary !py-2 !px-4 text-sm disabled:opacity-50">
          {state.status === 'working' ? (state.progress ? `Loading model ${state.progress}%` : 'Looking…') : 'Suggest'}
        </button>
      </div>
      {state.status === 'error' && <p className="font-body text-xs text-red-600 mt-2">Could not suggest: {state.error}</p>}
      {r && (
        <div className="mt-3 space-y-2">
          {chip('Category', category?.name, () => onUse({ category_id: r.categoryId }))}
          {chip('Fabric', r.fabric, () => onUse({ fabric: r.fabric }))}
          {chip('Occasions', r.occasions.join(', '), () => onUse({ occasions: r.occasions }))}
          {chip('Main colour', r.colour, () => onUse({ colourName: r.colour }))}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" onClick={() => onUse({ category_id: r.categoryId, fabric: r.fabric, occasions: r.occasions, colourName: r.colour })}
              className="btn-primary !py-1.5 !px-3 text-xs">Use all</button>
            {r.basedOn.length > 0 && <span className="font-body text-[11px] text-gray-500">Based on similar sarees: {r.basedOn.join(', ')}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="font-body text-xs font-semibold text-charcoal uppercase tracking-wide block mb-1.5">{label}</span>
    {children}
    {hint && <span className="font-body text-xs text-gray-400 block mt-1">{hint}</span>}
  </label>
);

const SareeForm = () => {
  const { id } = useParams();                    // undefined = new saree
  const isNew = !id;
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(isNew ? emptyForm() : null);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (isNew) return;
    fetchAdminProduct(id).then(p => {
      setProduct(p);
      setForm(p ? fromProduct(p) : null);
    });
  }, [id, isNew]);

  if (!form) {
    return product === null && !isNew
      ? <div className="h-64 bg-white rounded-lg animate-pulse" />
      : <p className="font-body text-sm text-gray-500">Saree not found. <Link to="/admin/sarees" className="text-maroon-900 underline">Back to sarees</Link></p>;
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setColour = (key, changes) => setForm(f => ({ ...f, colours: f.colours.map(c => (c.key === key ? { ...c, ...changes } : c)) }));
  const liveColours = form.colours.filter(c => !c.remove);
  const rulePrice = websitePrice(form.base_price);
  const finalPrice = form.manualPrice ? Number(form.price) : rulePrice;

  const validate = (publish) => {
    const list = [];
    if (form.name.trim().length < 3) list.push('Enter the saree name (at least 3 letters).');
    if (!form.category_id) list.push('Choose a category.');
    if (!(Number(form.base_price) > 0)) list.push("Enter her price (base price).");
    if (form.manualPrice && !(Number(form.price) > 0)) list.push('Enter the website price.');
    if (form.description.length > 2000) list.push('Description is too long (max 2000 characters).');
    if (liveColours.length === 0) list.push('Add at least one colour.');
    const names = liveColours.map(c => c.color_name.trim().toLowerCase());
    if (names.some(n => !n)) list.push('Every colour needs a name.');
    if (new Set(names).size !== names.length) list.push('Two colours have the same name.');
    liveColours.forEach(c => {
      if (c.openingStock !== '' && !(Number.isInteger(Number(c.openingStock)) && Number(c.openingStock) >= 0)) {
        list.push(`Opening stock for ${c.color_name || 'a colour'} must be 0 or more.`);
      }
      const photos = c.existing.filter(i => !c.removeIds.includes(i.id)).length + c.files.length;
      if (publish && photos === 0) list.push(`Add at least one photo for ${c.color_name || 'each colour'} before publishing.`);
    });
    return list;
  };

  const save = async (publish) => {
    const problems = validate(publish ?? product?.is_active);
    setErrors(problems);
    setNotice('');
    if (problems.length) { window.scrollTo(0, 0); return; }

    setSaving(true);
    const newPhotos = [];                          // [{ imageId, file }] to index for photo search
    let productId = product?.id ?? null;
    let code = product?.code ?? null;
    try {
      const fields = {
        name: form.name.trim(),
        category_id: form.category_id,
        fabric: form.fabric.trim() || null,
        occasions: form.occasions,
        description: form.description.trim() || null,
        work: form.work.trim() || null,
        blouse_details: form.blouse_details.trim() || null,
        saree_length_m: form.saree_length_m === '' ? null : Number(form.saree_length_m),
        blouse_included: form.blouse_included,
        price: finalPrice,
        price_is_manual: form.manualPrice,
      };

      // 1. The saree itself (new ones start hidden)
      setProgress('Saving saree details…');
      if (isNew) {
        const { data, error } = await supabase.from('products')
          .insert({ ...fields, is_active: false, is_placeholder: false }).select('id, code').single();
        if (error) throw error;
        productId = data.id;
        code = data.code;
      } else {
        const { error } = await supabase.from('products').update(fields).eq('id', productId);
        if (error) throw error;
      }

      // 2. Her private base price (the database re-applies the price rule unless manual).
      //    Update first, insert if there is none yet (admins may not change product_id, so no upsert).
      const basePrice = Number(form.base_price);
      const { data: updatedCost, error: costError } = await supabase.from('product_costs')
        .update({ base_price: basePrice }).eq('product_id', productId).select('product_id');
      if (costError) throw costError;
      if (!updatedCost.length) {
        const { error } = await supabase.from('product_costs').insert({ product_id: productId, base_price: basePrice });
        if (error) throw error;
      }

      // 3. Colours
      for (const [index, c] of form.colours.entries()) {
        if (c.remove) {
          if (c.id) {
            setProgress(`Removing colour ${c.color_name}…`);
            const { error } = await supabase.from('product_variants').delete().eq('id', c.id);
            if (error) {   // has stock history → hide it instead of deleting
              await supabase.from('product_variants').update({ is_active: false }).eq('id', c.id);
            }
          }
          continue;
        }
        setProgress(`Saving colour ${c.color_name}…`);
        let variantId = c.id;
        const colourFields = { color_name: c.color_name.trim(), color_hex: c.color_hex, sort_order: index, is_active: true };
        if (variantId) {
          const { error } = await supabase.from('product_variants').update(colourFields).eq('id', variantId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('product_variants')
            .insert({ ...colourFields, product_id: productId }).select('id').single();
          if (error) throw error;
          variantId = data.id;
          if (Number(c.openingStock) > 0) await adjustStock(variantId, Number(c.openingStock), 'new_stock', 'Opening stock');
        }
        await deletePhotos(c.existing.filter(i => c.removeIds.includes(i.id)));
        if (c.files.length) {
          setProgress(`Uploading ${c.files.length} photo(s) for ${c.color_name}…`);
          const kept = c.existing.filter(i => !c.removeIds.includes(i.id)).length;
          newPhotos.push(...await uploadPhotos({ productId, code, variantId, colourName: c.color_name, files: c.files.map(f => f.file), startOrder: kept }));
        }
      }

      // 4. Shared (all-colours) photos
      await deletePhotos(form.shared.existing.filter(i => form.shared.removeIds.includes(i.id)));
      if (form.shared.files.length) {
        setProgress('Uploading shared photos…');
        newPhotos.push(...await uploadPhotos({ productId, code, variantId: null, colourName: null, files: form.shared.files.map(f => f.file), startOrder: 100 }));
      }

      // 5. Publish / hide
      if (publish !== undefined) await setProductActive(productId, publish);

      setProgress('');
      const fresh = await fetchAdminProduct(productId);
      setProduct(fresh);
      setForm(fromProduct(fresh));
      let message = publish ? `${code} is live on the website.` : publish === false ? `${code} saved as hidden.` : `${code} saved.`;
      if (newPhotos.length) {
        indexPhotos(newPhotos);                     // background: adds the new photos to "Search by photo" + "Similar sarees"
        message += ' New photos are being added to photo search in the background — keep this page open for a minute.';
      }
      setNotice(message);
      if (isNew) navigate(`/admin/sarees/${productId}`, { replace: true, state: { notice: message } });
      window.scrollTo(0, 0);
    } catch (e) {
      setProgress('');
      setErrors([`Could not finish saving: ${e.message}`, productId ? 'The saree is kept hidden — fix the problem and save again.' : '']
        .filter(Boolean));
      if (isNew && productId) navigate(`/admin/sarees/${productId}`, { replace: true });
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link to="/admin/sarees" className="font-body text-xs text-gray-500 hover:text-maroon-900">← All sarees</Link>
      <div className="flex flex-wrap items-end justify-between gap-3 mt-2 mb-6">
        <div>
          <p className="section-label mb-1">{isNew ? 'New saree' : product.code}</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">{isNew ? 'Add Saree' : 'Edit Saree'}</h1>
        </div>
        {!isNew && (
          <span className={`font-body text-xs px-2 py-1 rounded-sm ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
            {product.is_active ? 'Live on website' : 'Hidden'}
            {product.is_active && <> · <Link to={`/product/${product.slug}`} target="_blank" className="underline">view</Link></>}
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-4 font-body text-sm text-red-700 space-y-1">
          {errors.map(e => <p key={e}>{e}</p>)}
        </div>
      )}
      {notice && <p className="bg-emerald-50 border border-emerald-200 rounded-sm p-3 mb-4 font-body text-sm text-emerald-700">{notice}</p>}

      <div className="space-y-6">
        {/* Details */}
        <section className="bg-white rounded-lg shadow-soft p-5 border border-gray-50 grid gap-4 sm:grid-cols-2">
          <SuggestPanel
            source={liveColours[0]?.files[0]?.file ?? liveColours[0]?.existing.find(i => !liveColours[0].removeIds.includes(i.id))?.url
              ?? form.shared.files[0]?.file ?? null}
            categories={categories}
            excludeProductId={product?.id}
            onUse={u => setForm(f => ({
              ...f,
              ...(u.category_id ? { category_id: u.category_id } : {}),
              ...(u.fabric ? { fabric: u.fabric } : {}),
              ...(u.occasions?.length ? { occasions: u.occasions } : {}),
              ...(u.colourName && f.colours[0] && !f.colours[0].color_name.trim()
                ? { colours: f.colours.map((c, i) => (i === 0 ? { ...c, color_name: u.colourName, ...(c.hexTouched ? {} : { color_hex: guessHex(u.colourName) }) } : c)) }
                : {}),
            }))}
          />
          <div className="sm:col-span-2">
            <Field label="Saree name"><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></Field>
          </div>
          <Field label="Category">
            <select className="input-field" value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">Choose…</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Fabric"><input className="input-field" value={form.fabric} placeholder="e.g. Soft georgette" onChange={e => set('fabric', e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <span className="font-body text-xs font-semibold text-charcoal uppercase tracking-wide block mb-1.5">Occasions</span>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map(o => {
                const on = form.occasions.includes(o);
                return (
                  <button type="button" key={o} onClick={() => set('occasions', on ? form.occasions.filter(x => x !== o) : [...form.occasions, o])}
                    className={`px-3 py-1.5 rounded-full font-body text-xs border ${on ? 'bg-maroon-900 text-white border-maroon-900' : 'border-gray-200 text-charcoal'}`}>
                    {o}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" hint={`${form.description.length}/2000`}>
              <textarea className="input-field resize-y" rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
            </Field>
          </div>
          <Field label="Work (optional)"><input className="input-field" value={form.work} placeholder="e.g. Sequins embroidery" onChange={e => set('work', e.target.value)} /></Field>
          <Field label="Blouse details (optional)"><input className="input-field" value={form.blouse_details} onChange={e => set('blouse_details', e.target.value)} /></Field>
          <Field label="Saree length in metres (optional)">
            <input className="input-field" inputMode="decimal" value={form.saree_length_m} onChange={e => set('saree_length_m', e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 font-body text-sm text-charcoal self-end pb-3">
            <input type="checkbox" className="accent-maroon-900 w-4 h-4" checked={form.blouse_included} onChange={e => set('blouse_included', e.target.checked)} />
            Blouse piece included
          </label>
        </section>

        {/* Price */}
        <section className="bg-white rounded-lg shadow-soft p-5 border border-gray-50 grid gap-4 sm:grid-cols-2">
          <Field label="Her price (base price)" hint="Private — never shown to customers">
            <input className="input-field" inputMode="numeric" value={form.base_price} onChange={e => set('base_price', e.target.value.replace(/[^0-9.]/g, ''))} />
          </Field>
          <div>
            <span className="font-body text-xs font-semibold text-charcoal uppercase tracking-wide block mb-1.5">Website price</span>
            {form.manualPrice ? (
              <input className="input-field" inputMode="numeric" value={form.price} onChange={e => set('price', e.target.value.replace(/[^0-9.]/g, ''))} />
            ) : (
              <p className="font-heading text-2xl font-bold text-maroon-900 py-1.5">{rulePrice ? formatPrice(rulePrice) : '—'}</p>
            )}
            <label className="flex items-center gap-2 font-body text-xs text-gray-600 mt-1">
              <input type="checkbox" className="accent-maroon-900" checked={form.manualPrice}
                onChange={e => setForm(f => ({ ...f, manualPrice: e.target.checked, price: f.price || rulePrice || '' }))} />
              Set website price myself (otherwise: her price +₹300 below ₹1,100, +₹500 from ₹1,100)
            </label>
          </div>
        </section>

        {/* Colours */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-semibold text-charcoal">Colours</h2>
            <button type="button" onClick={() => set('colours', [...form.colours, emptyColour()])} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-base">add</span> Add colour
            </button>
          </div>
          {liveColours.map(c => (
            <div key={c.key} className="bg-white rounded-lg shadow-soft p-5 border border-gray-50 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[160px]">
                  <Field label="Colour name">
                    <input className="input-field" value={c.color_name} placeholder="e.g. Rani Pink"
                      onChange={e => setColour(c.key, { color_name: e.target.value, ...(c.hexTouched ? {} : { color_hex: guessHex(e.target.value) }) })} />
                  </Field>
                </div>
                <Field label="Swatch">
                  <input type="color" value={c.color_hex} onChange={e => setColour(c.key, { color_hex: e.target.value, hexTouched: true })}
                    className="w-12 h-[46px] border border-gray-200 rounded-sm p-1 bg-white" />
                </Field>
                {c.id ? (
                  <p className="font-body text-xs text-gray-500 pb-3">Online stock: <b>{c.stock ?? 'not tracked'}</b> (change it on the Sarees page)</p>
                ) : (
                  <div className="w-32">
                    <Field label="Opening stock"><input className="input-field" inputMode="numeric" placeholder="blank = not tracked"
                      value={c.openingStock} onChange={e => setColour(c.key, { openingStock: e.target.value.replace(/[^0-9]/g, '') })} /></Field>
                  </div>
                )}
                {liveColours.length > 1 && (
                  <button type="button" onClick={() => setColour(c.key, { remove: true })} className="font-body text-xs text-red-600 hover:underline pb-3">
                    Remove colour
                  </button>
                )}
              </div>
              <Photos label="Photos (first one is the main photo)" value={c} onChange={v => setColour(c.key, { existing: v.existing, removeIds: v.removeIds, files: v.files })} />
            </div>
          ))}
          <div className="bg-white rounded-lg shadow-soft p-5 border border-gray-50">
            <Photos label="Shared photos — group shots shown with every colour (optional)" value={form.shared} onChange={v => set('shared', v)} />
          </div>
        </section>

        {/* Save */}
        <div className="sticky bottom-0 bg-cream/95 backdrop-blur py-3 flex flex-wrap items-center gap-3 border-t border-gray-200">
          {progress && <p className="w-full font-body text-xs text-gray-600">{progress}</p>}
          {isNew ? (
            <>
              <button disabled={saving} onClick={() => save(true)} className="btn-primary disabled:opacity-60">Publish now</button>
              <button disabled={saving} onClick={() => save(false)} className="btn-secondary disabled:opacity-60">Save as hidden draft</button>
            </>
          ) : (
            <>
              <button disabled={saving} onClick={() => save(undefined)} className="btn-primary disabled:opacity-60">Save changes</button>
              {product.is_active ? (
                <button disabled={saving} onClick={() => save(false)} className="btn-secondary disabled:opacity-60">Save &amp; hide from website</button>
              ) : (
                <button disabled={saving} onClick={() => save(true)} className="btn-gold disabled:opacity-60">Save &amp; publish</button>
              )}
            </>
          )}
          {saving && <span className="w-5 h-5 border-2 border-maroon-900/20 border-t-maroon-900 rounded-full animate-spin" />}
        </div>
      </div>
    </div>
  );
};

export default SareeForm;
