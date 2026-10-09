import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS03cL2sHzbHQTc-fhSrmftUV9E7eUJMvCeAiLXkYrx95lZADj2bynqqIj7l85dYUUOZ4cPCSeT8O-eaPlJkQD69c2t4KrAzxL4TU4zr0KyqfZgPFGiQrItkN_IOB_UPZRGh9GBrgbMQ2X9w10DBgRhB_7de_MeSgB0_gi7bRpYcixPR7GS9OkCnRfw-E1kLl0FV-bLVu5oM28VPvdnJf2Bzm9InftvrBSeL65LrxSimRl52wwsVo4tQ';
const ARTISAN_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuClfe1uHeZUtqc6O9_JeM7FrC8NQkN0oVdjUHs9qDw6Znqm2IqZAfaeC-e0zTRsSuAYgQrb8DLaEx7wnKjA3kwzkd72VzuA1QY--4AJBT598m7Dzy5pU7XTrMBXxmM_bKTqUuQAh8S4gzCurMXRwAXUD2OG1oLMN7x4oji2NDJ9iajtpa6hqYkm_jZWymTmNV4dRV0044eBRoOe4p87HqYLXGT9qWlw-4l7sOxMZCMigYUrJ8PPD4y3SA';

// Provisional fabric categories matching the placeholder sarees — the shop's real category list is still being collected
const CATEGORIES = [
  { label: 'Cotton', sub: 'Daily & office wear', color: '#d4a017', query: 'Cotton' },
  { label: 'Art Silk', sub: 'Banarasi-style weaves', color: '#6d0f2a', query: 'Art Silk' },
  { label: 'Georgette', sub: 'Light & easy to drape', color: '#b71c1c', query: 'Georgette' },
  { label: 'Soft Silk', sub: 'Weddings & festivals', color: '#0b4d2c', query: 'Soft Silk' },
  { label: 'Organza', sub: 'Party wear', color: '#7b4fa0', query: 'Organza' },
];

const TRUST_BADGES = [
  { icon: 'store', title: 'Visit Our Kamothe Shop', sub: 'Sector 36, Kamothe, Navi Mumbai' },
  { icon: 'local_shipping', title: 'Delivery All Over India', sub: 'Delivery charges apply' },
  { icon: 'swap_horiz', title: 'Returns & Exchange', sub: 'Call or WhatsApp us' },
  { icon: 'content_cut', title: 'Blouse Piece Included', sub: 'In-shop tailor & fall/pico' },
];

// Placeholder sarees — same id, price and details as server/data/products.json (replaced by Supabase in build step 3)
const STATIC_NEW_ARRIVALS = [
  {
    id: '4', placeholder: true, name: 'Banarasi-Style Art Silk Saree', fabric: 'Art Silk', color: 'Maroon', colorCode: '#6d0f2a',
    price: 1499, originalPrice: 1899, stock: 3, blouseDetail: 'Unstitched blouse piece included',
  },
  {
    id: '2', placeholder: true, name: 'Bandhani Print Georgette Saree', fabric: 'Georgette', color: 'Red', colorCode: '#b71c1c',
    price: 699, originalPrice: 899, stock: 5, blouseDetail: 'Unstitched blouse piece included',
  },
  {
    id: '5', placeholder: true, name: 'Semi Paithani Silk Saree', fabric: 'Semi Silk', color: 'Royal Blue', colorCode: '#1a3c8f',
    price: 1899, originalPrice: 2299, stock: 2, blouseDetail: 'Unstitched blouse piece included',
  },
  {
    id: '1', placeholder: true, name: 'Printed Cotton Daily Wear Saree', fabric: 'Cotton', color: 'Mustard Yellow', colorCode: '#d4a017',
    price: 349, originalPrice: 449, stock: 8, blouseDetail: 'Unstitched blouse piece included',
  },
];

const NewArrivalCard = ({ item }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(item.id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <div className="relative h-[360px] overflow-hidden bg-maroon-50">
        {/* Colour placeholder until real photos are uploaded */}
        <div
          className="w-full h-full flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-700"
          style={{ backgroundColor: `${item.colorCode}22` }}
        >
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md" style={{ backgroundColor: item.colorCode }} />
        </div>
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => toggleWishlist(item)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:text-maroon-900 transition-colors"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
              style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
            >favorite</span>
          </button>
          <button
            onClick={() => addToCart(item)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:text-maroon-900 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-500">shopping_bag</span>
          </button>
        </div>
        {/* Badge */}
        {item.placeholder && (
          <span className="absolute bottom-4 left-4 bg-maroon-900 text-white text-[10px] uppercase font-semibold px-3 py-1 rounded-full font-body tracking-wide">
            Sample
          </span>
        )}
      </div>
      <div className="p-5">
        <span className="font-body text-[11px] uppercase tracking-widest text-gray-500 block mb-1">{item.fabric}</span>
        <h3 className="font-heading font-bold text-charcoal mb-2 text-lg leading-snug line-clamp-2">{item.name}</h3>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="font-heading text-gold-700 font-bold text-xl">₹{item.price.toLocaleString('en-IN')}</span>
            {item.originalPrice && (
              <span className="font-body text-xs text-gray-400 line-through ml-2">₹{item.originalPrice.toLocaleString('en-IN')}</span>
            )}
          </div>
          <Link
            to={`/product/${item.id}`}
            className="font-body font-semibold text-sm text-maroon-900 hover:underline"
          >
            Quick View
          </Link>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const carouselRef = useRef(null);

  const scrollCarousel = (dir) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  return (
    <main className="w-full">
      {/* ─── 1. HERO ─── */}
      <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden bg-black -mt-0">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMG}
            alt="Premium saree collection"
            className="w-full h-full object-cover opacity-70 scale-105"
            style={{ transition: 'transform 1s ease' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center py-20 flex flex-col items-center">
          <span className="font-body font-semibold text-[11px] tracking-[0.2em] uppercase text-gold-300 mb-6 inline-block">
            Kamothe, Navi Mumbai · Since 2016
          </span>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight max-w-5xl">
            Sarees for Every<br />Occasion &amp; Every Age
          </h1>
          <p className="font-body text-base md:text-xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed">
            Daily wear to wedding sarees from ₹200 to ₹3,000. Blouse piece included, delivery all over India.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link
              to="/collection"
              className="bg-gold-700 text-white px-9 py-4 rounded-lg font-body font-semibold text-sm uppercase tracking-widest hover:bg-gold-800 transition-all shadow-2xl hover:scale-105"
            >
              Explore Collection
            </Link>
            <Link
              to="/store-locator"
              className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-9 py-4 rounded-lg font-body font-medium text-sm uppercase tracking-wider hover:bg-white/20 transition-all"
            >
              Our Store
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST BADGES ─── */}
      <section className="w-full bg-cream py-10 border-b border-gold-700/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TRUST_BADGES.map(({ icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center gap-3 bg-white px-5 py-4 rounded-full border border-gold-700/30 shadow-soft"
            >
              <div className="w-10 h-10 rounded-full bg-gold-700/10 flex items-center justify-center text-maroon-900 shrink-0">
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </div>
              <div>
                <p className="font-body font-semibold text-charcoal text-xs leading-tight">{title}</p>
                <p className="font-body text-[11px] text-gray-500 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 3. CATEGORIES ─── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-body font-semibold text-[11px] tracking-[0.2em] uppercase text-maroon-900 mb-3 block">
            Browse
          </span>
          <h2 className="font-heading text-4xl font-semibold text-charcoal">Shop by Fabric</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {CATEGORIES.map(({ label, sub, color, query }) => (
            <Link
              key={label}
              to={`/collection?fabric=${encodeURIComponent(query)}`}
              className="group relative h-[160px] md:h-[300px] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-end p-5 transition-transform duration-500 hover:-translate-y-2"
              style={{ backgroundColor: color }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="relative z-10 text-white">
                <h3 className="font-heading font-bold text-xl mb-0.5">{label}</h3>
                <p className="font-body text-sm opacity-80">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 4. NEW ARRIVALS ─── */}
      <section className="w-full bg-maroon-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <span className="font-body font-semibold text-[11px] tracking-[0.2em] uppercase text-maroon-900 mb-3 block">
                Sample Products
              </span>
              <h2 className="font-heading text-4xl font-semibold text-charcoal">Featured Sarees</h2>
            </div>
            <div className="flex items-center gap-3 mt-5 md:mt-0">
              <button
                onClick={() => scrollCarousel(-1)}
                className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-charcoal hover:bg-maroon-900 hover:text-white hover:border-maroon-900 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <button
                onClick={() => scrollCarousel(1)}
                className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-charcoal hover:bg-maroon-900 hover:text-white hover:border-maroon-900 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Scrollable on mobile, grid on desktop */}
          <div
            ref={carouselRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {STATIC_NEW_ARRIVALS.map((item) => (
              <NewArrivalCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. QUOTE + ARTISAN SPOTLIGHT ─── */}
      <section className="w-full py-24 bg-cream relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="bg-white rounded-3xl p-10 md:p-16 shadow-card relative overflow-hidden border border-gold-700/20">
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-maroon-900/5 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              {/* Text side */}
              <div className="space-y-7">
                <span className="font-body font-semibold text-[11px] tracking-[0.2em] uppercase text-maroon-900">
                  Our Story &amp; Values
                </span>
                <blockquote className="font-heading text-3xl md:text-4xl font-medium text-charcoal leading-snug">
                  "A saree is not merely six yards of fabric; it is an unstitched epic woven with patience, prayer, and generational pride."
                </blockquote>
                <p className="font-body text-base text-gray-600 leading-relaxed">
                  Vaibhav Laxmi Saree has been a saree shop in Kamothe, Navi Mumbai since 2016, run by Mrs. Mamta Bhandari. We keep sarees for every age group and occasion, with a blouse piece included, fall/pico service and an in-shop tailor for blouse stitching.
                </p>
                <div className="pt-2 flex items-center gap-10">
                  <div>
                    <span className="font-heading text-3xl font-bold text-maroon-900 block">2016</span>
                    <span className="font-body text-xs text-gray-500">Serving Kamothe Since</span>
                  </div>
                  <div className="w-px h-14 bg-gold-700/30" />
                  <div>
                    <span className="font-heading text-3xl font-bold text-maroon-900 block">All India</span>
                    <span className="font-body text-xs text-gray-500">Delivery (charges apply)</span>
                  </div>
                </div>
              </div>

              {/* Image side */}
              <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={ARTISAN_IMG}
                  alt="Our curated saree collection"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
