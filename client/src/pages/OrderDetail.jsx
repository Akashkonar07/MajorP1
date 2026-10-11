import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../context/AuthContext';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { SHOP } from '../config/shop';
import { formatPrice } from '../lib/catalogue';
import { check, utrSchema } from '../lib/validation';
import {
  cancelMyOrder, fetchMyOrder, fetchPaymentSettings, submitUtr, upiLink,
} from '../lib/orders';

const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// QR + Pay button + UPI ID for one order
const PayBox = ({ order, payment }) => {
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  const link = payment?.upi_id ? upiLink({ upiId: payment.upi_id, amount: order.total, orderNo: order.order_no }) : null;

  useEffect(() => {
    if (!link) return;
    QRCode.toDataURL(link, { width: 240, margin: 1, color: { dark: '#2d1f1f', light: '#ffffff' } }).then(setQr).catch(() => setQr(null));
  }, [link]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(payment.upi_id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  if (!payment) return <div className="h-64 bg-gray-50 rounded animate-pulse" />;

  return (
    <div className="grid sm:grid-cols-[auto,1fr] gap-5 items-center">
      <div className="mx-auto">
        {qr ? <img src={qr} alt={`UPI QR code to pay ${formatPrice(order.total)}`} className="w-52 h-52 border border-gray-100 rounded" />
          : <div className="w-52 h-52 bg-gray-50 rounded animate-pulse" />}
        <p className="font-body text-[11px] text-gray-500 text-center mt-1">Scan with any UPI app</p>
      </div>
      <div className="space-y-3">
        <p className="font-body text-sm text-gray-600">Amount to pay</p>
        <p className="font-heading text-4xl font-semibold text-maroon-900 -mt-2">{formatPrice(order.total)}</p>
        <a href={link} className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-base">account_balance_wallet</span>
          Pay with UPI app
        </a>
        <div className="font-body text-xs text-gray-600 space-y-1">
          <p className="flex flex-wrap items-center gap-2">
            UPI ID: <span className="font-semibold text-charcoal">{payment.upi_id}</span>
            <button onClick={copy} className="text-maroon-900 underline">{copied ? 'Copied ✓' : 'Copy'}</button>
          </p>
          {payment.payee_name && <p>Your app will show the name “{payment.payee_name}”.</p>}
          <p>If your app asks for a note, write <span className="font-semibold">{order.order_no}</span>.</p>
        </div>
      </div>
    </div>
  );
};

const UtrForm = ({ order, onSaved }) => {
  const [utr, setUtr] = useState(order.upi_utr ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async e => {
    e.preventDefault();
    const { data, errors } = check(utrSchema, { utr });
    if (errors) { setError(errors.utr); return; }
    setBusy(true);
    setError('');
    try {
      await submitUtr(order.id, data.utr);
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate>
      <label htmlFor="utr" className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">
        12-digit UTR / UPI Ref. No.
      </label>
      <div className="flex gap-2">
        <input id="utr" value={utr} onChange={e => setUtr(e.target.value)} inputMode="numeric" maxLength={16}
          placeholder="e.g. 4281 0563 9912" className={`input-field flex-1 ${error ? 'border-red-400' : ''}`} />
        <button type="submit" disabled={busy} className="btn-gold shrink-0 disabled:opacity-60">{busy ? 'Saving…' : 'Submit'}</button>
      </div>
      {error ? <p className="font-body text-xs text-red-600 mt-1">{error}</p> : (
        <p className="font-body text-[11px] text-gray-500 mt-1">
          After paying, open the payment in your UPI app — it is shown as “UPI Ref No.”, “UTR” or “UPI transaction ID”.
        </p>
      )}
    </form>
  );
};

const OrderDetail = () => {
  const { orderNo } = useParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState(undefined);         // undefined = loading, null = not found
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [editUtr, setEditUtr] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = () => fetchMyOrder(orderNo).then(setOrder).catch(e => { setError(e.message); setOrder(null); });

  useEffect(() => {
    if (user) load();
  }, [user, orderNo]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPaymentSettings().then(setPayment).catch(() => {});
  }, []);

  if (loading) return <main className="max-w-3xl mx-auto px-4 py-16"><div className="h-64 bg-gray-100 rounded-lg animate-pulse" /></main>;
  if (!user) return <Navigate to={`/login?next=/order/${encodeURIComponent(orderNo)}`} replace />;
  if (order === undefined) return <main className="max-w-3xl mx-auto px-4 py-16"><div className="h-64 bg-gray-100 rounded-lg animate-pulse" /></main>;
  if (order === null) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-3xl text-charcoal mb-3">Order not found</h1>
        <p className="font-body text-sm text-gray-500 mb-6">{error || 'This order does not exist or belongs to another account.'}</p>
        <Link to="/account" className="btn-primary">My Account</Link>
      </main>
    );
  }

  const awaitingPayment = order.status === 'payment_pending' && order.payment_status === 'pending';
  const needsUtr = awaitingPayment && !order.upi_utr;
  const whatsapp = `${SHOP.whatsappHref}?text=${encodeURIComponent(`Hello, I have a question about my order ${order.order_no}.`)}`;
  const a = order.shipping_address;

  const cancel = async () => {
    if (!window.confirm('Cancel this order? You have not paid yet, so nothing will be charged.')) return;
    setCancelling(true);
    try { await cancelMyOrder(order.id); await load(); } catch (e) { setError(e.message); } finally { setCancelling(false); }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {location.state?.justPlaced && needsUtr && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
          <span className="material-symbols-outlined text-emerald-700">check_circle</span>
          <p className="font-body text-sm text-emerald-800">
            <span className="font-semibold">Thank you! Your order is placed.</span> Please pay by UPI below to confirm it.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label mb-1">Order</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">{order.order_no}</h1>
          <p className="font-body text-xs text-gray-500 mt-1">Placed on {when(order.created_at)}</p>
        </div>
        <OrderStatusBadge order={order} />
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      {/* Payment */}
      {needsUtr && (
        <section className="bg-white rounded-lg shadow-soft p-5 sm:p-6 border border-gray-50 space-y-6">
          <h2 className="font-heading text-2xl font-semibold text-charcoal">Pay by UPI</h2>
          <PayBox order={order} payment={payment} />
          <hr className="border-gray-100" />
          <UtrForm order={order} onSaved={load} />
          <button onClick={cancel} disabled={cancelling} className="font-body text-xs text-gray-500 hover:text-red-600 underline disabled:opacity-50">
            {cancelling ? 'Cancelling…' : 'Cancel this order'}
          </button>
        </section>
      )}

      {awaitingPayment && order.upi_utr && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-5 space-y-3">
          <p className="font-body text-sm text-amber-900">
            <span className="font-semibold">Payment submitted — UTR {order.upi_utr}.</span> The shop checks every payment
            (usually the same day). You will see “Payment verified” here once it is confirmed.
          </p>
          {editUtr ? <UtrForm order={order} onSaved={async () => { setEditUtr(false); await load(); }} /> : (
            <button onClick={() => setEditUtr(true)} className="font-body text-xs text-amber-900 underline">Entered the wrong number? Correct it</button>
          )}
        </section>
      )}

      {order.status === 'payment_pending' && order.payment_status === 'rejected' && (
        <section className="bg-red-50 border border-red-200 rounded-lg p-5 font-body text-sm text-red-800">
          The shop could not find this payment. Please send a screenshot of your UPI payment on WhatsApp.
        </section>
      )}

      {order.status === 'shipped' && (order.courier || order.tracking_no) && (
        <section className="bg-white rounded-lg shadow-soft p-5 border border-gray-50 font-body text-sm">
          <p className="font-semibold text-charcoal mb-1">Shipped</p>
          <p className="text-gray-600">{order.courier}{order.tracking_no ? ` · Tracking no. ${order.tracking_no}` : ''}</p>
        </section>
      )}

      {/* Items + totals */}
      <section className="bg-white rounded-lg shadow-soft p-5 sm:p-6 border border-gray-50">
        <h2 className="font-heading text-2xl font-semibold text-charcoal mb-4">Items</h2>
        <div className="divide-y divide-gray-100">
          {order.items.map(i => (
            <div key={i.id} className="py-3 first:pt-0 flex justify-between gap-4 font-body text-sm">
              <div className="min-w-0">
                {i.product?.slug
                  ? <Link to={`/product/${i.product.slug}?colour=${encodeURIComponent(i.color_snapshot ?? '')}`} className="font-medium text-charcoal hover:text-maroon-900">{i.name_snapshot}</Link>
                  : <span className="font-medium text-charcoal">{i.name_snapshot}</span>}
                <p className="text-xs text-gray-500">{i.color_snapshot} · Qty {i.qty} × {formatPrice(i.unit_price)}</p>
                {(i.addons ?? []).length > 0 && (
                  <p className="text-xs text-gold-700">+ {i.addons.map(x => `${x.name} ${formatPrice(Number(x.price))}`).join(', ')}{i.qty > 1 ? ' each' : ''}</p>
                )}
              </div>
              <span className="shrink-0 font-medium text-charcoal">{formatPrice(i.unit_price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5 font-body text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Sarees</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.addons_total > 0 && <div className="flex justify-between"><span className="text-gray-600">Fall / pico</span><span>{formatPrice(order.addons_total)}</span></div>}
          <div className="flex justify-between"><span className="text-gray-600">Delivery{a?.zone ? ` (${a.zone})` : ''}</span><span>{formatPrice(order.delivery_charge)}</span></div>
          <div className="flex justify-between font-bold pt-1"><span>Total</span><span className="text-maroon-900">{formatPrice(order.total)}</span></div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-soft p-5 sm:p-6 border border-gray-50 font-body text-sm">
        <h2 className="font-heading text-2xl font-semibold text-charcoal mb-3">Delivery address</h2>
        <p className="text-charcoal font-medium">{a.full_name} · {a.phone}</p>
        <p className="text-gray-600">{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
        <p className="text-gray-600">{a.city}, {a.state} – {a.pincode}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
          <span className="material-symbols-outlined text-base">chat</span>
          Questions? WhatsApp the shop
        </a>
        <Link to="/account" className="btn-secondary">My Orders</Link>
      </div>
    </main>
  );
};

export default OrderDetail;
