import React from 'react';
import { Link } from 'react-router-dom';
import { ABOUT_STORY, SHOP, whatsappWith } from '../config/shop';
import logoWithTagline from '../assets/brand/logo-with-tagline.svg';

const CONTACT = [
  { icon: 'call', label: 'Phone', value: SHOP.phoneDisplay, href: SHOP.phoneHref },
  { icon: 'chat', label: 'WhatsApp orders', value: SHOP.phoneDisplay, href: SHOP.whatsappHref, external: true },
  { icon: 'mail', label: 'Email', value: SHOP.email, href: `mailto:${SHOP.email}` },
  { icon: 'schedule', label: 'Shop hours', value: `Open ${SHOP.hours}` },
];

const OFFER = [
  { icon: 'checkroom', title: 'All types of sarees', desc: 'Fancy, designer printed and partywear sarees, everyday cottons and festive silks.' },
  { icon: 'styler', title: 'Lehengas & petticoats', desc: 'Lehengas and petticoats are available at the shop.' },
  { icon: 'content_cut', title: 'In-shop tailor', desc: 'Blouse stitching, fall beading and pico. Measurements are taken at the shop.' },
  { icon: 'local_shipping', title: 'Delivery all over India', desc: 'Order online and pay by UPI. We pack and send your saree ourselves.' },
];

const About = () => (
  <main>
    {/* Story */}
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid md:grid-cols-[auto,1fr] gap-10 items-center">
      <img src={logoWithTagline} alt="Vaibhav Laxmi Saree" className="w-56 sm:w-64 mx-auto" />
      <div>
        <p className="section-label mb-2">About us</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal mb-5">A saree for every occasion</h1>
        <p className="font-body text-base text-gray-600 leading-relaxed">{ABOUT_STORY}</p>
        <p className="font-body text-sm text-gray-500 mt-4">— {SHOP.proprietor}, Proprietor</p>
      </div>
    </section>

    {/* What we offer */}
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {OFFER.map(({ icon, title, desc }) => (
          <div key={title}>
            <div className="w-12 h-12 bg-maroon-50 rounded-lg flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-maroon-900 text-2xl">{icon}</span>
            </div>
            <h2 className="font-heading font-semibold text-lg text-charcoal mb-1">{title}</h2>
            <p className="font-body text-sm text-gray-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Contact */}
    <section id="contact" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <p className="section-label mb-2">Contact</p>
      <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal mb-6">Visit or message us</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 p-6 space-y-4">
          {CONTACT.map(({ icon, label, value, href, external }) => (
            <div key={label} className="flex gap-3">
              <span className="material-symbols-outlined text-maroon-900">{icon}</span>
              <div className="font-body">
                <p className="text-xs text-gray-500">{label}</p>
                {href ? (
                  <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="text-sm text-charcoal font-medium hover:text-maroon-900 break-all">{value}</a>
                ) : <p className="text-sm text-charcoal font-medium">{value}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-soft border border-gray-50 p-6 flex flex-col">
          <div className="flex gap-3 mb-4">
            <span className="material-symbols-outlined text-maroon-900">store</span>
            <div className="font-body">
              <p className="text-xs text-gray-500">Shop address</p>
              {SHOP.addressLines.map(line => <p key={line} className="text-sm text-charcoal">{line}</p>)}
            </div>
          </div>
          <p className="font-body text-xs text-gray-500 mb-5">GSTIN: {SHOP.gstin}</p>
          <div className="mt-auto flex flex-wrap gap-3">
            <a href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-base">directions</span>Get directions
            </a>
            <a href={whatsappWith('Namaste, I have a question.')} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-base">chat</span>WhatsApp us
            </a>
          </div>
        </div>
      </div>
      <p className="font-body text-sm text-gray-500 mt-6">
        See the <Link to="/store-locator" className="text-maroon-900 underline">map and FAQs</Link>, our <Link to="/services" className="text-maroon-900 underline">tailoring price list</Link>, or
        our <Link to="/policies" className="text-maroon-900 underline">shipping and returns policies</Link>.
      </p>
    </section>
  </main>
);

export default About;
