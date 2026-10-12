import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { EXPORTS } from '../../lib/exports';
import { SHOP } from '../../config/shop';

// Shop Settings: UPI, delivery charges, tailoring prices, CSV backup.
// Every save is written to the activity log by the database.

const Section = ({ title, hint, children }) => (
  <section className="bg-white rounded-lg shadow-soft border border-gray-50 p-4 sm:p-6">
    <h2 className="font-heading text-2xl font-semibold text-charcoal">{title}</h2>
    {hint && <p className="font-body text-xs text-gray-500 mt-1 mb-4">{hint}</p>}
    {children}
  </section>
);
const Label = ({ children }) => <span className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">{children}</span>;
const Status = ({ state }) => state ? (
  <span className={`font-body text-xs ${state.ok ? 'text-emerald-700' : 'text-red-600'}`}>{state.text}</span>
) : null;

const isMoney = v => /^\d{1,5}(\.\d{1,2})?$/.test(String(v).trim());
const UPI_RE = /^[a-zA-Z0-9._-]{2,255}@[a-zA-Z]{2,64}$/;

const Payment = ({ settings, onSaved }) => {
  const [upi, setUpi] = useState(settings.upi_id ?? '');
  const [payee, setPayee] = useState(settings.payee_name ?? '');
  const [state, setState] = useState(null);

  const save = async () => {
    if (!UPI_RE.test(upi.trim())) { setState({ ok: false, text: 'Enter a valid UPI ID, e.g. name@ybl' }); return; }
    if (payee.trim().length > 60) { setState({ ok: false, text: 'Payee name is too long' }); return; }
    if (upi.trim() !== settings.upi_id &&
      !window.confirm(`Change the UPI ID to ${upi.trim()}?\n\nAll new customer payments will go to this ID. Please double-check it.`)) return;
    const { error } = await supabase.from('settings').update({ upi_id: upi.trim(), payee_name: payee.trim() || null }).eq('id', 1);
    setState(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved ✓' });
    if (!error) onSaved();
  };

  return (
    <Section title="UPI payment" hint="Customers pay to this UPI ID. The name is what their UPI app shows, so they know it is your shop.">
      <div className="grid sm:grid-cols-2 gap-4">
        <label><Label>UPI ID</Label><input className="input-field" value={upi} onChange={e => setUpi(e.target.value)} /></label>
        <label><Label>Name shown in UPI apps</Label><input className="input-field" value={payee} maxLength={60} onChange={e => setPayee(e.target.value)} /></label>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={save} className="btn-primary">Save</button><Status state={state} />
      </div>
    </Section>
  );
};

const Delivery = ({ settings, onSaved }) => {
  const [zones, setZones] = useState(settings.delivery_zones ?? []);
  const [extra, setExtra] = useState(String(settings.extra_saree_delivery_charge ?? ''));
  const [state, setState] = useState(null);

  const save = async () => {
    if (zones.some(z => !z.name?.trim() || z.name.length > 40 || !isMoney(z.charge)) || !isMoney(extra)) {
      setState({ ok: false, text: 'Every zone needs a name and a charge in ₹' });
      return;
    }
    const clean = zones.map(z => ({ ...z, name: z.name.trim(), charge: Number(z.charge) }));   // keeps each zone's key
    const { error } = await supabase.from('settings').update({ delivery_zones: clean, extra_saree_delivery_charge: Number(extra) }).eq('id', 1);
    setState(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved ✓ — checkout uses the new charges now' });
    if (!error) onSaved();
  };

  return (
    <Section title="Delivery charges" hint="Charge = zone charge for the first saree + extra charge for each other saree. The zone is chosen from the customer's pincode.">
      <div className="space-y-3">
        {zones.map((z, i) => (
          <div key={z.key ?? i} className="grid grid-cols-[1fr,110px] gap-3">
            <label><Label>Zone</Label>
              <input className="input-field" value={z.name} onChange={e => setZones(zones.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            </label>
            <label><Label>First saree ₹</Label>
              <input className="input-field" inputMode="decimal" value={z.charge} onChange={e => setZones(zones.map((x, j) => j === i ? { ...x, charge: e.target.value } : x))} />
            </label>
          </div>
        ))}
        <label className="block w-48"><Label>Each extra saree ₹</Label>
          <input className="input-field" inputMode="decimal" value={extra} onChange={e => setExtra(e.target.value)} />
        </label>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button onClick={save} className="btn-primary">Save</button><Status state={state} />
      </div>
    </Section>
  );
};

const ServiceRow = ({ service, onSaved }) => {
  const [s, setS] = useState({ ...service, price: String(Number(service.price)) });
  const [state, setState] = useState(null);
  const dirty = s.name !== service.name || Number(s.price) !== Number(service.price) || s.duration_text !== (service.duration_text ?? '') || s.is_active !== service.is_active;

  const save = async () => {
    if (s.name.trim().length < 2 || !isMoney(s.price)) { setState({ ok: false, text: 'Check name / price' }); return; }
    const { error } = await supabase.from('services')
      .update({ name: s.name.trim(), price: Number(s.price), duration_text: s.duration_text.trim() || null, is_active: s.is_active }).eq('id', service.id);
    setState(error ? { ok: false, text: error.message } : { ok: true, text: 'Saved ✓' });
    if (!error) onSaved();
  };

  return (
    <div className="grid grid-cols-[1fr,80px] sm:grid-cols-[1fr,90px,110px,auto,auto] gap-2 items-center py-2 border-b border-gray-100 last:border-0">
      <input className="input-field !py-2 col-span-2 sm:col-span-1" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} aria-label="Service name" />
      <input className="input-field !py-2" inputMode="decimal" value={s.price} onChange={e => setS({ ...s, price: e.target.value })} aria-label="Price" />
      <input className="input-field !py-2" value={s.duration_text ?? ''} placeholder="Time" maxLength={30} onChange={e => setS({ ...s, duration_text: e.target.value })} aria-label="Time" />
      <label className="flex items-center gap-1 font-body text-xs text-gray-600">
        <input type="checkbox" checked={s.is_active} onChange={e => setS({ ...s, is_active: e.target.checked })} className="accent-maroon-900" />Shown
      </label>
      <div className="flex items-center gap-2">
        <button onClick={save} disabled={!dirty} className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-30">Save</button>
        <Status state={state} />
      </div>
      {service.is_online_addon && <p className="col-span-full font-body text-[11px] text-emerald-700 -mt-1">Can be added to a saree at online checkout</p>}
    </div>
  );
};

const Services = () => {
  const [list, setList] = useState(null);
  const load = () => supabase.from('services').select('id, name, price, duration_text, is_online_addon, is_active').order('sort_order')
    .then(({ data }) => setList(data ?? []));
  useEffect(() => { load(); }, []);
  return (
    <Section title="Tailoring price list" hint="Shown on the Services page. Fall beading and pico prices are also used at checkout.">
      {list === null ? <div className="h-40 bg-gray-50 rounded animate-pulse" /> : list.map(s => <ServiceRow key={s.id} service={s} onSaved={load} />)}
    </Section>
  );
};

const Backup = () => {
  const [busy, setBusy] = useState('');
  const [state, setState] = useState(null);
  const run = async (e) => {
    setBusy(e.key);
    setState(null);
    try {
      const n = await e.run();
      setState({ ok: true, text: `${e.label}: ${n} rows downloaded` });
    } catch (err) {
      setState({ ok: false, text: err.message });
    } finally {
      setBusy('');
    }
  };
  return (
    <Section title="Backup (CSV)" hint="Download your data as spreadsheets (open in Excel or Google Sheets). Keep them safe — they contain customer details and your private prices.">
      <div className="grid sm:grid-cols-2 gap-2">
        {EXPORTS.map(e => (
          <button key={e.key} onClick={() => run(e)} disabled={!!busy}
            className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-sm font-body text-sm text-left hover:border-maroon-900 disabled:opacity-50">
            <span className="material-symbols-outlined text-base text-maroon-900">{busy === e.key ? 'hourglass_top' : 'download'}</span>
            {e.label}
          </button>
        ))}
      </div>
      <div className="mt-3"><Status state={state} /></div>
    </Section>
  );
};

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    supabase.from('settings').select('upi_id, payee_name, delivery_zones, extra_saree_delivery_charge').eq('id', 1).single()
      .then(({ data }) => setSettings(data));
  }, [version]);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <p className="section-label mb-1">Settings</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">Shop Settings</h1>
      </div>
      {settings === null ? <div className="h-64 bg-white rounded-lg animate-pulse" /> : (
        <>
          <Payment settings={settings} onSaved={() => setVersion(v => v + 1)} />
          <Delivery settings={settings} onSaved={() => setVersion(v => v + 1)} />
        </>
      )}
      <Services />
      <Backup />
      <p className="font-body text-xs text-gray-500">
        Shop phone ({SHOP.phoneDisplay}), address and hours are set in the website itself — ask the team to change them.
      </p>
    </div>
  );
};

export default Settings;
