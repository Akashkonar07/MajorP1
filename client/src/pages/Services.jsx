import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/catalogue';
import { SHOP, whatsappWith } from '../config/shop';

// Tailoring price list — read from the services table (the owner edits it in admin)
const Services = () => {
  const [services, setServices] = useState(null);

  useEffect(() => {
    supabase.from('services').select('id, name, price, duration_text, is_online_addon').eq('is_active', true).order('sort_order')
      .then(({ data }) => setServices(data ?? []));
  }, []);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <p className="section-label mb-2">Tailoring</p>
      <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal mb-3">Our services</h1>
      <p className="font-body text-sm text-gray-600 leading-relaxed mb-8 max-w-2xl">
        Our in-shop tailor gets your saree ready to wear. <span className="font-semibold">Measurements are taken at the shop</span>, so
        for stitching please message us on WhatsApp and visit us in Kamothe. Fall beading and pico can also be added to a saree
        when you order online.
      </p>

      <div className="bg-white rounded-lg shadow-soft border border-gray-50 overflow-hidden">
        <div className="grid grid-cols-[1fr,auto,auto] gap-x-4 px-4 sm:px-6 py-3 bg-maroon-50 font-body text-xs font-semibold uppercase tracking-wide text-maroon-900">
          <span>Service</span><span className="text-right">Price</span><span className="w-20 sm:w-24 text-right">Time</span>
        </div>
        {services === null ? (
          <div className="h-64 animate-pulse bg-gray-50" />
        ) : services.map(s => (
          <div key={s.id} className="grid grid-cols-[1fr,auto,auto] gap-x-4 items-center px-4 sm:px-6 py-3 border-t border-gray-100 font-body text-sm">
            <span className="text-charcoal">
              {s.name}
              {s.is_online_addon && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 whitespace-nowrap">Add online</span>}
            </span>
            <span className="text-right font-semibold text-maroon-900">{formatPrice(Number(s.price))}</span>
            <span className="w-20 sm:w-24 text-right text-gray-500 text-xs">{s.duration_text === 'Ask' ? 'Ask us' : s.duration_text}</span>
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-gray-500 mt-3">Urgent stitching is also available — ask us for the price and time.</p>

      <div className="mt-10 bg-cream border border-gold-700/20 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-heading text-2xl font-semibold text-charcoal">Book stitching</h2>
          <p className="font-body text-sm text-gray-600">Message us with what you need and when you can visit — open {SHOP.hours}.</p>
        </div>
        <a href={whatsappWith('Namaste, I want to book blouse stitching. When can I come for measurements?')}
          target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center justify-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-base">chat</span>Enquire on WhatsApp
        </a>
      </div>
    </main>
  );
};

export default Services;
