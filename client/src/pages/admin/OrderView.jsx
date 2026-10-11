import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { formatPrice } from '../../lib/catalogue';
import { customerWhatsApp, fetchAdminOrder, rejectPayment, setOrderStatus } from '../../lib/adminOrders';

const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

const Card = ({ title, children, tone = 'white' }) => (
  <section className={`rounded-lg p-4 sm:p-5 border ${tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white shadow-soft border-gray-50'}`}>
    {title && <h2 className="font-heading text-xl font-semibold text-charcoal mb-3">{title}</h2>}
    {children}
  </section>
);

// Courier + tracking number, then "Mark as shipped"
const ShipForm = ({ busy, onShip, label }) => {
  const [courier, setCourier] = useState('India Post');
  const [tracking, setTracking] = useState('');
  return (
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Courier</label>
          <input className="input-field" value={courier} maxLength={60} onChange={e => setCourier(e.target.value)} />
        </div>
        <div>
          <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Tracking no.</label>
          <input className="input-field" value={tracking} maxLength={60} placeholder="e.g. EE123456789IN" onChange={e => setTracking(e.target.value)} />
        </div>
      </div>
      <button disabled={busy || !courier.trim() || !tracking.trim()} onClick={() => onShip(courier, tracking)}
        className="btn-primary flex items-center gap-2 disabled:opacity-50">
        <span className="material-symbols-outlined text-base">local_shipping</span>{label}
      </button>
    </div>
  );
};

const OrderView = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => fetchAdminOrder(id).then(setOrder).catch(e => { setError(e.message); setOrder(null); });
  useEffect(() => { load(); }, [id]);   // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn, done) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
      if (done) setNotice(done);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (order === undefined) return <div className="h-64 bg-white rounded-lg animate-pulse" />;
  if (order === null) return <p className="font-body text-sm text-gray-500">{error || 'Order not found.'} <Link to="/admin/orders" className="text-maroon-900 underline">Back to orders</Link></p>;

  const a = order.shipping_address ?? {};
  const s = order.status;
  const paid = order.payment_status === 'verified';
  const to = (status, extra, done) => act(() => setOrderStatus(order.id, status, extra), done);

  const cancel = () => {
    const refund = paid ? `\n\nThe customer has paid ${formatPrice(order.total)} — remember to refund it by UPI.` : '';
    const note = window.prompt(`Cancel order ${order.order_no}? Reserved stock goes back.${refund}\n\nReason (optional):`, '');
    if (note === null) return;
    to('cancelled', { note }, paid ? `Order cancelled. Please refund ${formatPrice(order.total)} by UPI.` : 'Order cancelled.');
  };
  const reject = () => {
    const note = window.prompt('Payment not found in your UPI app? The customer will be asked to check the UTR or send a screenshot.\n\nNote (optional):', '');
    if (note === null) return;
    act(() => rejectPayment(order.id, note), 'Marked as "payment not found". Send the customer a WhatsApp message below.');
  };

  const waKind = order.payment_status === 'rejected' && s === 'payment_pending' ? 'rejected'
    : s === 'payment_verified' ? 'verified' : s === 'shipped' ? 'shipped' : s === 'delivered' ? 'delivered' : 'general';
  const wa = customerWhatsApp(order, waKind);
  const canCancel = ['payment_pending', 'payment_verified', 'packed'].includes(s);

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/admin/orders" className="font-body text-xs text-gray-500 hover:text-maroon-900 flex items-center gap-1">
        <span className="material-symbols-outlined text-sm">arrow_back</span> All orders
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-label mb-1">Order</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal">{order.order_no}</h1>
          <p className="font-body text-xs text-gray-500 mt-1">Placed {when(order.created_at)}</p>
        </div>
        <OrderStatusBadge order={order} />
      </div>

      {notice && <p className="font-body text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-3">{notice}</p>}
      {error && <p className="font-body text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

      {/* What to do next */}
      {s === 'payment_pending' && order.upi_utr && order.payment_status === 'pending' && (
        <Card title="Check the payment" tone="amber">
          <p className="font-body text-sm text-charcoal mb-1">
            Customer says they paid <span className="font-bold">{formatPrice(order.total)}</span>.
          </p>
          <p className="font-body text-sm text-charcoal mb-3">UTR: <span className="font-mono font-bold tracking-wide">{order.upi_utr}</span></p>
          <p className="font-body text-xs text-gray-600 mb-4">
            Open your PhonePe Business app → payment history and find a payment with this UTR and exactly this amount.
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => to('payment_verified', {}, 'Payment verified. Let the customer know on WhatsApp below.')}
              className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-base">check_circle</span>Payment received
            </button>
            <button disabled={busy} onClick={reject} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
              <span className="material-symbols-outlined text-base">cancel</span>Not found
            </button>
          </div>
        </Card>
      )}
      {s === 'payment_pending' && order.payment_status === 'rejected' && (
        <Card tone="amber">
          <p className="font-body text-sm text-charcoal">
            You marked this payment as <span className="font-semibold">not found</span> (UTR {order.upi_utr}). Waiting for the customer to send
            a corrected UTR or a screenshot. If they don't pay, cancel the order to release the stock.
          </p>
        </Card>
      )}
      {s === 'payment_pending' && !order.upi_utr && (
        <Card tone="amber">
          <p className="font-body text-sm text-charcoal">The customer has not paid yet (no UTR entered). Nothing to do — or cancel it if it is old.</p>
        </Card>
      )}
      {s === 'payment_verified' && (
        <Card title="Pack the order">
          <button disabled={busy} onClick={() => to('packed', {}, 'Marked as packed.')} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-base">inventory_2</span>Mark as packed
          </button>
        </Card>
      )}
      {s === 'packed' && (
        <Card title="Ship the order">
          <ShipForm busy={busy} label="Mark as shipped" onShip={(courier, tracking) => to('shipped', { courier, tracking }, 'Marked as shipped. Send the tracking number on WhatsApp below.')} />
        </Card>
      )}
      {s === 'shipped' && (
        <Card title="Shipped">
          <p className="font-body text-sm text-charcoal mb-3">{order.courier} · Tracking no. <span className="font-semibold">{order.tracking_no}</span></p>
          <button disabled={busy} onClick={() => to('delivered', {}, 'Marked as delivered.')} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <span className="material-symbols-outlined text-base">task_alt</span>Mark as delivered
          </button>
        </Card>
      )}
      {s === 'delivered' && (
        <Card title="Delivered">
          <p className="font-body text-xs text-gray-500 mb-3">If the customer asks for a return or exchange on WhatsApp (within 48 hours of delivery), record it here.</p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => to('return_requested', {}, 'Return request recorded.')} className="btn-secondary disabled:opacity-50">Customer asked for return</button>
            <button disabled={busy} onClick={() => to('exchange_requested', {}, 'Exchange request recorded.')} className="btn-secondary disabled:opacity-50">Customer asked for exchange</button>
          </div>
        </Card>
      )}
      {s === 'return_requested' && (
        <Card title="Return requested" tone="amber">
          <p className="font-body text-xs text-gray-600 mb-3">
            When the saree comes back and is checked, mark it returned and send the refund by UPI (within 7 working days, as per the returns policy).
            If it can be sold again, add it back from Sarees → Stock.
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => to('returned', {}, 'Marked as returned. Remember the UPI refund.')} className="btn-primary disabled:opacity-50">Saree returned</button>
            <button disabled={busy} onClick={() => to('delivered', { note: 'Return request closed' }, 'Request closed.')} className="btn-secondary disabled:opacity-50">Close request</button>
          </div>
        </Card>
      )}
      {s === 'exchange_requested' && (
        <Card title="Exchange requested" tone="amber">
          <p className="font-body text-xs text-gray-600 mb-3">When you send the replacement, enter its tracking number.</p>
          <ShipForm busy={busy} label="Replacement shipped" onShip={(courier, tracking) => to('shipped', { courier, tracking }, 'Replacement marked as shipped.')} />
          <button disabled={busy} onClick={() => to('delivered', { note: 'Exchange request closed' }, 'Request closed.')}
            className="font-body text-xs text-gray-500 underline mt-3 disabled:opacity-50">Close request without exchange</button>
        </Card>
      )}

      {/* Contact */}
      <Card title="Customer">
        <p className="font-body text-sm text-charcoal font-semibold">{a.full_name} · {a.phone}</p>
        <p className="font-body text-sm text-gray-600">{[a.line1, a.line2].filter(Boolean).join(', ')}</p>
        <p className="font-body text-sm text-gray-600">{a.city}, {a.state} – {a.pincode}{a.zone ? ` · ${a.zone}` : ''}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-gold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">chat</span>WhatsApp customer
            </a>
          )}
          {a.phone && (
            <a href={`tel:+91${a.phone}`} className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-base">call</span>Call
            </a>
          )}
        </div>
      </Card>

      {/* Items */}
      <Card title={`Items (${order.count})`}>
        <div className="divide-y divide-gray-100">
          {order.items.map(i => (
            <div key={i.id} className="flex gap-3 py-3 first:pt-0">
              <div className="w-14 h-16 rounded overflow-hidden bg-maroon-50 shrink-0">
                {i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0 font-body text-sm">
                <p className="font-medium text-charcoal"><span className="text-gold-700 text-xs font-semibold">{i.product?.code}</span> {i.name_snapshot}</p>
                <p className="text-xs text-gray-500">{i.color_snapshot} · Qty {i.qty} × {formatPrice(i.unit_price)}</p>
                {(i.addons ?? []).length > 0 && (
                  <p className="text-xs font-semibold text-amber-700">Tailor: {i.addons.map(x => x.name).join(' + ')}{i.qty > 1 ? ` (× ${i.qty})` : ''}</p>
                )}
              </div>
              <span className="font-body text-sm font-medium shrink-0">{formatPrice(i.unit_price * i.qty)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 mt-2 pt-3 space-y-1 font-body text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Sarees</span><span>{formatPrice(order.subtotal)}</span></div>
          {order.addons_total > 0 && <div className="flex justify-between"><span className="text-gray-600">Fall / pico</span><span>{formatPrice(order.addons_total)}</span></div>}
          <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span>{formatPrice(order.delivery_charge)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span className="text-maroon-900">{formatPrice(order.total)}</span></div>
          <p className="text-xs text-gray-500 pt-1">
            Payment: {paid ? 'verified' : order.payment_status === 'rejected' ? 'not found' : 'not verified yet'}{order.upi_utr ? ` · UTR ${order.upi_utr}` : ''}
          </p>
        </div>
      </Card>

      {canCancel && (
        <button disabled={busy} onClick={cancel} className="font-body text-xs text-gray-500 hover:text-red-600 underline disabled:opacity-50">
          Cancel this order
        </button>
      )}
    </div>
  );
};

export default OrderView;
