import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Step 4: a simple welcome page. Orders, low stock and sales figures arrive in Steps 5–7.
const count = async (table, filter) => {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (filter) query = filter(query);
  const { count: n } = await query;
  return n ?? 0;
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      count('products', q => q.eq('is_active', true)),
      count('products', q => q.eq('is_active', false)),
      count('product_variants'),
      count('orders'),
      count('product_variants', q => q.eq('stock', 0).eq('is_active', true)),
      supabase.from('product_variants').select('stock, low_stock_threshold').gt('stock', 0).eq('is_active', true)
        .then(({ data }) => (data ?? []).filter(v => v.stock <= v.low_stock_threshold).length),
    ]).then(([live, hidden, colours, orders, out, low]) => setStats({ live, hidden, colours, orders, out, low }));
  }, []);

  const tiles = [
    { label: 'Sarees on the website', value: stats?.live, icon: 'checkroom' },
    { label: 'Hidden sarees', value: stats?.hidden, icon: 'visibility_off' },
    { label: 'Colours', value: stats?.colours, icon: 'palette' },
    { label: 'Orders', value: stats?.orders, icon: 'receipt_long' },
    { label: 'Colours low on online stock', value: stats?.low, icon: 'warning' },
    { label: 'Colours out of stock', value: stats?.out, icon: 'block' },
  ];

  return (
    <div>
      <p className="section-label mb-1">Dashboard</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-8">
        Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>

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
