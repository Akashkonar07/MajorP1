import React, { useState } from 'react';
import { SHOP } from '../config/shop';
import logoOnMaroon from '../assets/brand/logo-primary-on-maroon.svg';

// Only facts confirmed by the shop (project brief §2). Add more when the owner confirms them.
const FAQS = [
  {
    q: 'What are the shop timings?',
    a: `The shop is open from ${SHOP.hours}. Please call or WhatsApp us on ${SHOP.phoneDisplay} if you want to check before visiting.`,
  },
  {
    q: 'Can I get my blouse stitched at the shop?',
    a: 'Yes. Every saree comes with a blouse piece, and our in-shop tailor stitches blouses. Fall & beading / pico is also available. Ask us at the counter or on WhatsApp for charges and timing.',
  },
  {
    q: 'Do you deliver outside Navi Mumbai?',
    a: 'Yes, we deliver all over India. Delivery charges apply and are shown at checkout.',
  },
  {
    q: 'How do I pay for an online order?',
    a: 'We accept UPI payments only.',
  },
  {
    q: 'Can I return or exchange a saree?',
    a: `Yes, returns and exchanges are available. Please call or WhatsApp us on ${SHOP.phoneDisplay} and we will help you.`,
  },
];

const FAQ = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-body font-medium text-sm text-charcoal pr-4">{q}</span>
        <span
          className="material-symbols-outlined text-base text-gray-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="pb-4">
          <p className="font-body text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const StoreLocator = () => {
  return (
    <main>
      {/* HERO */}
      <section
        className="relative flex flex-col md:flex-row min-h-[280px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fff8f7 0%, #fce7ed 40%, #fff8f7 100%)' }}
      >
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12">
          <p className="section-label mb-3">Since {SHOP.since}</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal leading-tight mb-4">
            Visit Our Shop<br />
            <span className="text-maroon-900">in Kamothe</span>
          </h1>
          <p className="font-body text-sm text-gray-600 max-w-md leading-relaxed mb-6">
            See and feel the sarees in person. Sarees, lehengas and petticoats. Blouse piece included with every saree, fall &amp; beading / pico and an in-shop tailor for blouse stitching.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={SHOP.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              WhatsApp Us
            </a>
            <a
              href={SHOP.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              Get Directions
            </a>
          </div>
        </div>
        {/* Store image placeholder */}
        <div className="w-full md:w-80 bg-maroon-900 flex items-center justify-center min-h-[220px] shrink-0">
          <div className="text-center p-8">
            <img src={logoOnMaroon} alt="Vaibhav Laxmi Saree" className="h-40 w-auto mx-auto" />
            <p className="font-body text-white/70 text-xs mt-2">Kamothe, Navi Mumbai</p>
          </div>
        </div>
      </section>

      {/* LOCATION & MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="bg-white rounded-lg shadow-soft p-7 border border-gray-50">
            <p className="section-label mb-3">Location & Contact</p>
            <h2 className="font-heading text-3xl font-semibold text-charcoal mb-6">{SHOP.name}</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">location_on</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Address</p>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">
                    {SHOP.addressLines.map(line => <span key={line} className="block">{line}</span>)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">schedule</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Shop Hours</p>
                  <p className="font-body text-sm text-gray-600">{SHOP.hours}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">support_agent</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Phone / WhatsApp Orders</p>
                  <a href={SHOP.phoneHref} className="font-body text-sm text-gray-600 hover:text-maroon-900 block">{SHOP.phoneDisplay}</a>
                  <a href={`mailto:${SHOP.email}`} className="font-body text-sm text-gray-600 hover:text-maroon-900 break-all">{SHOP.email}</a>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <a
                href={SHOP.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-maroon-900 flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Get Directions →
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden shadow-soft min-h-[320px] bg-blue-50 flex items-center justify-center border border-gray-100">
            <iframe
              title={`${SHOP.name} location map`}
              src={SHOP.mapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '320px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-lg shadow-soft p-8 border border-gray-50 text-center">
          <p className="section-label mb-2">Have a Question?</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-3">Call or WhatsApp Us</h2>
          <p className="font-body text-sm text-gray-500 mb-6">
            Ask about a saree, blouse stitching, fall &amp; beading / pico or your order. We are available {SHOP.hours}.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={SHOP.phoneHref} className="btn-primary flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-base">call</span>
              Call {SHOP.phoneDisplay}
            </a>
            <a
              href={SHOP.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">chat</span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <p className="section-label mb-2">Help & Support</p>
          <h2 className="font-heading text-4xl font-semibold text-charcoal mb-2">Frequently Asked Questions</h2>
          <p className="font-body text-sm text-gray-500">
            Common questions about our shop, services and online orders.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
          {FAQS.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
        </div>
      </section>
    </main>
  );
};

export default StoreLocator;
