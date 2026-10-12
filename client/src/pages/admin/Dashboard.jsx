import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/catalogue';

// Owner's overview: orders that need her, sales, and online stock
const count = async (table, filter) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count: n } = await query;
  return n ?? 0;
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);

  const [action, setAction] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    Promise.all([
      count('products', q => q.eq('is_active', true)),
      count('products', q => q.eq('is_active', false)),
      count('product_variants'),
      count('product_variants', q => q.eq('stock', 0).eq('is_active', true)),
      supabase.from('product_variants').select('stock, low_stock_threshold').gt('stock', 0).eq('is_active', true)
        .then(({ data }) => (data ?? []).filter(v => v.stock <= v.low_stock_threshold).length),
    ]).then(([live, hidden, colours, out, low]) => setStats({ live, hidden, colours, out, low }));

    // Colours that are sold out or running low (only colours with a stock number)
    supabase.from('product_variants')
      .select('id, color_name, stock, low_stock_threshold, product:products ( id, code, name, is_active )')
      .not('stock', 'is', null).eq('is_active', true).order('stock')
      .then(({ data }) => setAlerts((data ?? []).filter(v => v.product?.is_active && v.stock <= v.low_stock_threshold)));

    // Orders from the 1st of this month + all open orders
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    supabase.from('orders').select('status, payment_status, upi_utr, total, created_at')
      .or(`created_at.gte."${monthStart.toISOString()}",status.in.(payment_pending,payment_verified,packed,return_requested,exchange_requested)`)
      .then(({ data }) => {
        const rows = data ?? [];
        const sold = o => o.payment_status === 'verified' && !['cancelled', 'returned'].includes(o.status);
        setAction({
          verify: rows.filter(o => o.status === 'payment_pending' && o.upi_utr && o.payment_status === 'pending').length,
          pack: rows.filter(o => o.status === 'payment_verified').length,
          ship: rows.filter(o => o.status === 'packed').length,
          returns: rows.filter(o => ['return_requested', 'exchange_requested'].includes(o.status)).length,
          today: rows.filter(o => new Date(o.created_at) >= todayStart && o.status !== 'cancelled').length,
          month: rows.filter(o => new Date(o.created_at) >= monthStart && sold(o)).reduce((sum, o) => sum + Number(o.total), 0),
        });
      });
  }, []);

  const todo = [
    { label: 'Payments to check', value: action?.verify, tab: 'verify', icon: 'currency_rupee' },
    { label: 'Orders to pack', value: action?.pack, tab: 'pack', icon: 'inventory_2' },
    { label: 'Orders to ship', value: action?.ship, tab: 'ship', icon: 'local_shipping' },
    { label: 'Returns / exchanges', value: action?.returns, tab: 'returns', icon: 'swap_horiz' },
  ];

  const tiles = [
    { label: "Today's orders", value: action?.today, icon: 'today' },
    { label: "This month's sales (paid)", value: action ? formatPrice(action.month) : undefined, icon: 'trending_up' },
    { label: 'Sarees on the website', value: stats?.live, icon: 'checkroom' },
    { label: 'Hidden sarees', value: stats?.hidden, icon: 'visibility_off' },
    { label: 'Colours low on online stock', value: stats?.low, icon: 'warning' },
    { label: 'Colours out of stock', value: stats?.out, icon: 'block' },
  ];

  return (
    <div>
      <p className="section-label mb-1">Dashboard</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-8">
        Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>

      <p className="font-body font-semibold text-xs uppercase tracking-wide text-gray-500 mb-2">Needs your attention</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {todo.map(({ label, value, tab, icon }) => (
          <Link key={tab} to={`/admin/orders?tab=${tab}`}
            className={`rounded-lg p-4 border transition-colors ${value ? 'bg-amber-50 border-amber-300 hover:border-maroon-900' : 'bg-white border-gray-100 hover:border-maroon-900'}`}>
            <span className={`material-symbols-outlined mb-1 block ${value ? 'text-amber-700' : 'text-gray-400'}`}>{icon}</span>
            <p className="font-heading text-3xl font-bold text-charcoal">
              {value ?? <span className="inline-block w-8 h-7 bg-gray-100 rounded animate-pulse align-middle" />}
            </p>
            <p className="font-body text-xs text-gray-600">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {tiles.map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-lg shadow-soft p-5 border border-gray-50">
            <span className="material-symbols-outlined text-maroon-900 mb-2 block">{icon}</span>
            <p className="font-heading text-3xl font-bold text-charcoal">
              {value ?? <span className="inline-block w-10 h-7 bg-gray-100 rounded animate-pulse align-middle" />}
            </p>
            <p className="font-body text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-soft border border-gray-50 p-5 mb-8">
        <h2 className="font-heading text-xl font-semibold text-charcoal mb-1">Stock alerts</h2>
        <p className="font-body text-xs text-gray-500 mb-3">
          Sold-out colours stay on the website marked “Out of stock” (customers can't order them). Add stock or hide the saree from Sarees.
        </p>
        {alerts === null ? <div className="h-12 bg-gray-50 rounded animate-pulse" /> : alerts.length === 0 ? (
          <p className="font-body text-sm text-gray-500">No colours are low or sold out.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.slice(0, 12).map(v => (
              <Link key={v.id} to={`/admin/sarees/${v.product.id}`} className="flex items-center gap-3 py-2 font-body text-sm hover:bg-maroon-50/40 -mx-2 px-2 rounded">
                <span className={`w-20 shrink-0 text-xs font-semibold ${v.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {v.stock === 0 ? 'Sold out' : `${v.stock} left`}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  <span className="text-gold-700 text-xs font-semibold">{v.product.code}</span> {v.product.name} · {v.color_name}
                </span>
                <span className="material-symbols-outlined text-gray-400 text-base">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
        {alerts?.length > 12 && <Link to="/admin/sarees?tab=out" className="font-body text-xs text-maroon-900 underline">See all</Link>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link to="/admin/sarees/new" className="bg-maroon-900 text-white rounded-lg p-5 flex items-center gap-3 hover:bg-maroon-800 transition-colors">
          <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
          <span>
            <span className="font-heading text-xl font-semibold block">Add a new saree</span>
            <span className="font-body text-xs opacity-80">Photos, description and your price</span>
          </span>
        </Link>
        <Link to="/admin/sarees" className="bg-white rounded-lg shadow-soft border border-gray-50 p-5 flex items-center gap-3 hover:border-maroon-900 transition-colors">
          <span className="material-symbols-outlined text-3xl text-maroon-900">inventory</span>
          <span>
            <span className="font-heading text-xl font-semibold text-charcoal block">Update stock / hide sarees</span>
            <span className="font-body text-xs text-gray-500">Online stock per colour, hide sold-out sarees</span>
          </span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
