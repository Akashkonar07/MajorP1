import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import FormField from '../components/FormField';
import { check, addressSchema } from '../lib/validation';
import { AVAILABILITY_NOTE, formatPrice } from '../lib/catalogue';
import {
  INDIAN_STATES, deliveryQuote, fetchMyAddresses, fetchOnlineAddons, placeOrder, saveAddress,
} from '../lib/orders';

const EMPTY_ADDRESS = { full_name: '', phone: '', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '' };

const Section = ({ step, title, children }) => (
  <section className="bg-white rounded-lg shadow-soft p-5 sm:p-6 border border-gray-50">
    <h2 className="font-heading text-2xl font-semibold text-charcoal mb-4 flex items-center gap-3">
      <span className="w-7 h-7 rounded-full bg-maroon-900 text-white font-body text-sm flex items-center justify-center">{step}</span>
      {title}
    </h2>
    {children}
  </section>
);

const addressText = a => [a.line1, a.line2, `${a.city}, ${a.state} – ${a.pincode}`].filter(Boolean).join(', ');

const Checkout = () => {
  const { user, profile, loading } = useAuth();
  const { cart, cartCount, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [saved, setSaved] = useState([]);
  const [choice, setChoice] = useState('new');          // saved address id, or 'new'
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [remember, setRemember] = useState(true);
  const [addons, setAddons] = useState([]);              // fall beading / pico from the services table
  const [picked, setPicked] = useState({});              // { variantId: [serviceId, ...] }
  const [quote, setQuote] = useState(null);              // { zone, charge }
  const [quoteError, setQuoteError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOnlineAddons().then(setAddons).catch(() => setAddons([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchMyAddresses().then(list => {
      setSaved(list);
      if (list.length) setChoice(list[0].id);
    }).catch(() => {});
  }, [user]);

  // Fill name and phone from the profile once it has loaded
  useEffect(() => {
    if (profile) setForm(f => ({ ...f, full_name: f.full_name || profile.full_name || '', phone: f.phone || profile.phone || '' }));
  }, [profile]);

  const address = choice === 'new' ? form : saved.find(a => a.id === choice) ?? form;
  const pincode = address.pincode?.trim() ?? '';

  // Delivery charge comes from the database for this pincode and number of sarees
  useEffect(() => {
    if (!/^[1-9][0-9]{5}$/.test(pincode) || cartCount < 1) { setQuote(null); setQuoteError(''); return; }
    let live = true;
    deliveryQuote(pincode, Math.min(cartCount, 20))
      .then(q => { if (live) { setQuote(q); setQuoteError(''); } })
      .catch(e => { if (live) { setQuote(null); setQuoteError(e.message); } });
    return () => { live = false; };
  }, [pincode, cartCount]);

  const addonsTotal = useMemo(() => cart.reduce((sum, item) => {
    const ids = picked[item.id] ?? [];
    return sum + addons.filter(a => ids.includes(a.id)).reduce((s, a) => s + a.price, 0) * item.qty;
  }, 0), [cart, picked, addons]);
  const anyAddon = Object.values(picked).some(ids => ids.length);

  if (loading) {
    return <main className="max-w-7xl mx-auto px-4 py-16"><div className="h-64 bg-gray-100 rounded-lg animate-pulse" /></main>;
  }
  if (!user) return <Navigate to="/login?next=/checkout" replace />;
  if (cart.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const setField = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleAddon = (variantId, serviceId) => setPicked(p => {
    const ids = p[variantId] ?? [];
    return { ...p, [variantId]: ids.includes(serviceId) ? ids.filter(x => x !== serviceId) : [...ids, serviceId] };
  });

  const handlePlace = async () => {
    setError('');
    let deliverTo = address;
    if (choice === 'new') {
      const { data, errors: fieldErrors } = check(addressSchema, form);
      setErrors(fieldErrors ?? {});
      if (fieldErrors) { setError('Please check the delivery address.'); return; }
      deliverTo = data;
    }
    if (cartCount > 20) { setError('At most 20 sarees per order. For bigger orders please WhatsApp the shop.'); return; }

    setPlacing(true);
    try {
      const { full_name, phone, line1, line2, city, state, pincode: pin } = deliverTo;
      const order = await placeOrder(cart, picked, { full_name, phone, line1, line2: line2 || '', city, state, pincode: pin });
      if (choice === 'new' && remember) await saveAddress(deliverTo).catch(() => {});   // nice-to-have only
      clearCart();
      navigate(`/order/${order.order_no}`, { replace: true, state: { justPlaced: true } });
    } catch (e) {
      setError(e.message);
      setPlacing(false);
    }
  };

  const total = cartTotal + addonsTotal + (quote?.charge ?? 0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Link to="/cart" className="font-body text-xs text-gray-500 hover:text-maroon-900 flex items-center gap-1 mb-2">
          <span className="material-symbols-outlined text-sm">arrow_back</span> Back to bag
        </Link>
        <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">Checkout</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0 space-y-6">
          {/* 1. Address */}
          <Section step="1" title="Delivery address">
            {saved.length > 0 && (
              <div className="space-y-2 mb-4">
                {saved.map(a => (
                  <label key={a.id} className={`flex gap-3 p-3 border rounded-sm cursor-pointer ${choice === a.id ? 'border-maroon-900 bg-maroon-50/40' : 'border-gray-200'}`}>
                    <input type="radio" name="address" checked={choice === a.id} onChange={() => setChoice(a.id)} className="mt-1 accent-maroon-900" />
                    <span className="font-body text-sm text-charcoal">
                      <span className="font-semibold">{a.full_name}</span> · {a.phone}<br />
                      <span className="text-gray-600">{addressText(a)}</span>
                    </span>
                  </label>
                ))}
                <label className={`flex gap-3 p-3 border rounded-sm cursor-pointer ${choice === 'new' ? 'border-maroon-900 bg-maroon-50/40' : 'border-gray-200'}`}>
                  <input type="radio" name="address" checked={choice === 'new'} onChange={() => setChoice('new')} className="accent-maroon-900" />
                  <span className="font-body text-sm text-charcoal font-medium">Deliver to a new address</span>
                </label>
              </div>
            )}

            {choice === 'new' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField label="Full name" name="full_name" autoComplete="name" value={form.full_name}
                  onChange={e => setField('full_name', e.target.value)} error={errors.full_name} />
                <FormField label="Mobile number" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national"
                  placeholder="10-digit mobile" value={form.phone} onChange={e => setField('phone', e.target.value)} error={errors.phone} />
                <div className="sm:col-span-2">
                  <FormField label="House / flat no., building, street" name="line1" autoComplete="address-line1" value={form.line1}
                    onChange={e => setField('line1', e.target.value)} error={errors.line1} />
                </div>
                <div className="sm:col-span-2">
                  <FormField label="Area, landmark (optional)" name="line2" autoComplete="address-line2" value={form.line2}
                    onChange={e => setField('line2', e.target.value)} error={errors.line2} />
                </div>
                <FormField label="City / town" name="city" autoComplete="address-level2" value={form.city}
                  onChange={e => setField('city', e.target.value)} error={errors.city} />
                <FormField label="Pincode" name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={form.pincode}
                  onChange={e => setField('pincode', e.target.value)} error={errors.pincode} />
                <div className="sm:col-span-2">
                  <label htmlFor="state" className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">State</label>
                  <select id="state" value={form.state} onChange={e => setField('state', e.target.value)} className="input-field">
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <label className="sm:col-span-2 flex items-center gap-2 font-body text-sm text-gray-600">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-maroon-900" />
                  Save this address for next time
                </label>
              </div>
            )}
          </Section>

          {/* 2. Sarees + add-ons */}
          <Section step="2" title="Your sarees">
            <div className="divide-y divide-gray-100">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 py-3 first:pt-0">
                  <div className="w-16 h-20 rounded overflow-hidden bg-maroon-50 shrink-0">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-charcoal leading-snug">{item.name}</p>
                    <p className="font-body text-xs text-gray-500 mb-2">{item.colorName} · Qty {item.qty} · {formatPrice(item.price * item.qty)}</p>
                    {addons.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {addons.map(a => {
                          const on = (picked[item.id] ?? []).includes(a.id);
                          return (
                            <button key={a.id} type="button" onClick={() => toggleAddon(item.id, a.id)}
                              className={`px-3 py-1.5 rounded-full border font-body text-xs transition-colors ${
                                on ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'}`}>
                              {on ? '✓ ' : '+ '}{a.name} {formatPrice(a.price)}{item.qty > 1 ? ' each' : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {anyAddon && (
              <p className="font-body text-xs text-amber-700 mt-3">
                Fall beading / pico is done by our tailor before dispatch (1–2 days). Sarees with fall or pico done cannot be returned.
              </p>
            )}
          </Section>

          {/* 3. Payment */}
          <Section step="3" title="Payment">
            <div className="flex gap-3 p-3 border border-maroon-900 bg-maroon-50/40 rounded-sm">
              <span className="material-symbols-outlined text-maroon-900">qr_code_2</span>
              <div className="font-body text-sm text-charcoal">
                <p className="font-semibold">UPI (Google Pay, PhonePe, Paytm, BHIM…)</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  After you place the order you will see a QR code and a Pay button. Pay the exact amount, then enter the 12-digit UTR number.
                  The shop checks every payment before dispatch.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-50 lg:sticky lg:top-24">
            <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Order Summary</h2>
            <div className="space-y-3 mb-5 font-body text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Sarees ({cartCount})</span>
                <span className="font-medium text-charcoal">{formatPrice(cartTotal)}</span>
              </div>
              {addonsTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fall / pico</span>
                  <span className="font-medium text-charcoal">{formatPrice(addonsTotal)}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-gray-600">Delivery{quote ? <span className="block text-[11px] text-gray-400">{quote.zone}</span> : null}</span>
                <span className="font-medium text-charcoal text-right">
                  {quote ? formatPrice(quote.charge) : <span className="text-gray-400 text-xs">Enter pincode</span>}
                </span>
              </div>
              {quoteError && <p className="text-xs text-red-600">{quoteError}</p>}
              <hr className="border-gray-100" />
              <div className="flex justify-between font-bold">
                <span className="text-charcoal">Total</span>
                <span className="text-maroon-900 text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {error && <p className="font-body text-sm text-red-600 mb-3" role="alert">{error}</p>}
            <button onClick={handlePlace} disabled={placing || !quote}
              className="btn-gold w-full flex items-center justify-center gap-2 py-4 disabled:opacity-60">
              <span className="material-symbols-outlined text-base">lock</span>
              {placing ? 'Placing order…' : 'Place order & pay by UPI'}
            </button>
            <p className="flex items-start gap-1.5 font-body text-[11px] text-gray-500 mt-4">
              <span className="material-symbols-outlined text-sm text-gold-700">info</span>
              {AVAILABILITY_NOTE}
            </p>
            <p className="font-body text-[11px] text-gray-500 mt-2">
              Dispatched within 2 working days of payment verification.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
