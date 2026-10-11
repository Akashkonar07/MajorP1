import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import OrderStatusBadge from '../../components/OrderStatusBadge';
import { formatPrice } from '../../lib/catalogue';
import { fetchAdminOrders, orderStage } from '../../lib/adminOrders';

// Tabs = what the owner has to do next
const TABS = [
  { key: 'verify', label: 'Check payment' },
  { key: 'pack', label: 'To pack' },
  { key: 'ship', label: 'To ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'returns', label: 'Returns' },
  { key: 'unpaid', label: 'Not paid yet' },
  { key: 'all', label: 'All' },
];

const when = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

const Orders = () => {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'verify';
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAdminOrders().then(setOrders).catch(e => setError(e.message));
  }, []);

  const counts = useMemo(() => {
    const c = { all: orders?.length ?? 0 };
    for (const o of orders ?? []) c[orderStage(o)] = (c[orderStage(o)] ?? 0) + 1;
    return c;
  }, [orders]);

  const visible = (orders ?? []).filter(o => {
    if (tab !== 'all' && orderStage(o) !== tab) return false;
    if (!search) return true;
    const a = o.shipping_address ?? {};
    return `${o.order_no} ${a.full_name} ${a.phone} ${a.city} ${o.upi_utr ?? ''}`.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <p className="section-label mb-1">Online Store</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-6">Orders</h1>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setParams({ tab: t.key }, { replace: true })}
            className={`px-3 py-1.5 rounded-full font-body text-xs font-medium border transition-colors ${
              tab === t.key ? 'bg-maroon-900 text-white border-maroon-900' : 'bg-white text-charcoal border-gray-200 hover:border-maroon-900'
            }`}>
            {t.label} ({counts[t.key] ?? 0})
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Order no., name, phone, UTR…"
          className="ml-auto w-full sm:w-64 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white" />
      </div>

      {error && <p className="font-body text-sm text-red-600 mb-4">{error}</p>}
      {orders === null && !error ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">No orders here.</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map(o => {
            const a = o.shipping_address ?? {};
            return (
              <Link key={o.id} to={`/admin/orders/${o.id}`}
                className="bg-white rounded-lg shadow-soft border border-gray-50 p-3 flex gap-3 hover:border-maroon-900 transition-colors">
                <div className="w-14 h-16 rounded overflow-hidden bg-maroon-50 shrink-0">
                  {o.items[0]?.image && <img src={o.items[0].image} alt="" loading="lazy" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0 font-body">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-charcoal">{o.order_no}</p>
                    <OrderStatusBadge order={o} />
                  </div>
                  <p className="text-xs text-gray-600 truncate">{a.full_name} · {a.city}</p>
                  <p className="text-xs text-gray-500">
                    {o.count} saree{o.count !== 1 ? 's' : ''} · <span className="font-semibold text-maroon-900">{formatPrice(o.total)}</span> · {when(o.created_at)}
                  </p>
                  {o.upi_utr && o.status === 'payment_pending' && <p className="text-[11px] text-gray-500">UTR {o.upi_utr}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
