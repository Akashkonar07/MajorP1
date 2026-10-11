import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SHOP } from '../config/shop';
import logoPrimary from '../assets/brand/logo-primary.svg';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for subscribing!');
      setEmail('');
    }
  };

  return (
    <footer className="bg-cream border-t border-gold-700 border-opacity-20 pt-14 pb-6 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-gray-200">
          {/* Brand */}
          <div>
            <img src={logoPrimary} alt="Vaibhav Laxmi Saree" className="h-24 w-auto mb-4" />
            <p className="font-body text-sm text-gray-600 leading-relaxed mb-4">
              Sarees, lehengas and petticoats in Kamothe, Navi Mumbai since {SHOP.since}. Blouse piece included, fall &amp; beading / pico and in-shop blouse stitching.
            </p>
            <div className="flex items-start gap-1 text-xs font-body text-gray-500">
              <span className="material-symbols-outlined text-sm text-maroon-900">store</span>
              <span>{SHOP.addressLines.join(' ')}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-charcoal text-sm tracking-widest uppercase mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Sarees', to: '/collection' },
                { label: 'Silk Sarees', to: '/category/silk-sarees' },
                { label: 'Banarasi Sarees', to: '/category/banarasi-sarees' },
                { label: 'Georgette Sarees', to: '/category/georgette-sarees' },
                { label: 'Bandhani Sarees', to: '/category/bandhani-sarees' },
                { label: 'Store Locator', to: '/store-locator' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="font-body text-sm text-gray-600 hover:text-maroon-900 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-body font-semibold text-charcoal text-sm tracking-widest uppercase mb-5">Newsletter</h4>
            <p className="font-body text-sm text-gray-600 leading-relaxed mb-4">
              Subscribe to receive new arrivals, festive drops, and festive edits.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 min-w-0 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white"
              />
              <button
                type="submit"
                className="shrink-0 bg-maroon-900 text-white font-body font-semibold px-4 py-2 rounded-sm text-sm hover:bg-maroon-800 transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          {/* Quality Promise */}
          <div>
            <h4 className="font-body font-semibold text-charcoal text-sm tracking-widest uppercase mb-5">Contact Us</h4>
            <ul className="space-y-2.5 font-body text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-maroon-900">call</span>
                <a href={SHOP.phoneHref} className="hover:text-maroon-900 transition-colors">{SHOP.phoneDisplay}</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-maroon-900">chat</span>
                <a href={SHOP.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-maroon-900 transition-colors">WhatsApp orders</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-maroon-900">mail</span>
                <a href={`mailto:${SHOP.email}`} className="hover:text-maroon-900 transition-colors break-all">{SHOP.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-maroon-900">schedule</span>
                <span>Open {SHOP.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 text-center">
          <p className="font-body text-xs text-gray-400">
            © {CURRENT_YEAR} {SHOP.name}, Kamothe, Navi Mumbai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
