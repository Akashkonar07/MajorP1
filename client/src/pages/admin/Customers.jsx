import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/catalogue';

// Registered customers with their orders (admins can read all profiles and orders)
const Customers = () => {
  const [rows, setRows] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('id, full_name, phone, role, created_at').eq('role', 'customer').order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, total, status, payment_status, created_at, shipping_address'),
    ]).then(([{ data: people }, { data: orders }]) => {
      setRows((people ?? []).map(p => {
        const mine = (orders ?? []).filter(o => o.user_id === p.id);
        const paid = mine.filter(o => o.payment_status === 'verified' && !['cancelled', 'returned'].includes(o.status));
        const last = mine.sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
        return { ...p, orders: mine.length, spent: paid.reduce((s, o) => s + Number(o.total), 0), city: last?.shipping_address?.city,
          phone: p.phone ?? last?.shipping_address?.phone };
      }));
    });
  }, []);

  const visible = (rows ?? []).filter(r => !search || `${r.full_name} ${r.phone} ${r.city}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-4xl">
      <p className="section-label mb-1">Online Store</p>
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-1">Customers</h1>
      <p className="font-body text-sm text-gray-500 mb-5">{rows ? `${rows.length} registered customers` : ' '}</p>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, city…"
        className="w-full sm:w-72 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white mb-4" />
      {rows === null ? <div className="h-48 bg-white rounded-lg animate-pulse" /> : visible.length === 0 ? (
        <p className="font-body text-sm text-gray-500 py-10 text-center">No customers yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 divide-y divide-gray-100">
          {visible.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 font-body">
              <div className="w-9 h-9 rounded-full bg-maroon-50 text-maroon-900 flex items-center justify-center text-sm font-semibold shrink-0">
                {(r.full_name ?? '?').trim().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal truncate">{r.full_name || '(no name)'}</p>
                <p className="text-xs text-gray-500 truncate">
                  {r.phone ?? 'no phone'}{r.city ? ` · ${r.city}` : ''} · joined {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-charcoal">{r.orders} order{r.orders !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-500">{formatPrice(r.spent)} paid</p>
              </div>
              {r.phone && (
                <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-700" aria-label="WhatsApp">
                  <span className="material-symbols-outlined text-xl">chat</span>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customers;
