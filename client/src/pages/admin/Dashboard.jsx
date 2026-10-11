import React, { useEffect, useState } from 'react';
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
    ]).then(([live, hidden, colours, orders]) => setStats({ live, hidden, colours, orders }));
  }, []);

  const tiles = [
    { label: 'Sarees on the website', value: stats?.live, icon: 'checkroom' },
    { label: 'Hidden sarees', value: stats?.hidden, icon: 'visibility_off' },
    { label: 'Colours', value: stats?.colours, icon: 'palette' },
    { label: 'Orders', value: stats?.orders, icon: 'receipt_long' },
  ];

  return (
    <div>
      <p className="section-label mb-1">Dashboard</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-8">
        Namaste{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
        <h2 className="font-heading text-2xl font-semibold text-charcoal mb-2">Coming next</h2>
        <p className="font-body text-sm text-gray-600 leading-relaxed">
          Add new sarees with photos, hide sold-out ones, update online stock, manage orders and the private
          shop inventory — these pages are added to the menu step by step.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
