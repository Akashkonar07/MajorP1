import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-maroon-900 rounded-sm flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">VS</span>
              </div>
              <span className="font-heading font-bold text-maroon-900 text-lg tracking-wide">VIRAASAT</span>
            </div>
            <p className="font-body text-sm text-gray-600 leading-relaxed mb-4">
              Your trusted destination for premium sarees in Kamothe, Navi Mumbai. Wide collection, quality checked, easy exchange — visit us in store.
            </p>
            <div className="flex items-center gap-1 text-xs font-body text-gray-500">
              <span className="material-symbols-outlined text-sm text-maroon-900">store</span>
              <span>Shop 6, Sector 35, Kamothe, Navi Mumbai</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body font-semibold text-charcoal text-sm tracking-widest uppercase mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Kanjeevaram Silk', to: '/collection?fabric=kanjeevaram' },
                { label: 'Banarasi Brocade', to: '/collection?fabric=banarasi' },
                { label: 'Chanderi Organza', to: '/collection?fabric=chanderi' },
                { label: 'Patola Masterpieces', to: '/collection?fabric=patola' },
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
                className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-sm font-body focus:outline-none focus:border-maroon-900 bg-white"
              />
              <button
                type="submit"
                className="bg-maroon-900 text-white font-body font-semibold px-4 py-2 rounded-sm text-sm hover:bg-maroon-800 transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          {/* Quality Promise */}
          <div>
            <h4 className="font-body font-semibold text-charcoal text-sm tracking-widest uppercase mb-5">Quality Promise</h4>
            <p className="font-body text-sm text-gray-600 leading-relaxed mb-5">
              Every saree is quality checked before dispatch. Visit our Kamothe store to see and feel the collection before buying.
            </p>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-maroon-900 text-2xl">verified_user</span>
              <span className="material-symbols-outlined text-maroon-900 text-2xl">local_shipping</span>
              <span className="material-symbols-outlined text-maroon-900 text-2xl">eco</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 text-center">
          <p className="font-body text-xs text-gray-400">
            © 2024 Viraasat Sarees, Kamothe Navi Mumbai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
