import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { fetchCatalogue, formatPrice, isSoldOut } from '../lib/catalogue';

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS03cL2sHzbHQTc-fhSrmftUV9E7eUJMvCeAiLXkYrx95lZADj2bynqqIj7l85dYUUOZ4cPCSeT8O-eaPlJkQD69c2t4KrAzxL4TU4zr0KyqfZgPFGiQrItkN_IOB_UPZRGh9GBrgbMQ2X9w10DBgRhB_7de_MeSgB0_gi7bRpYcixPR7GS9OkCnRfw-E1kLl0FV-bLVu5oM28VPvdnJf2Bzm9InftvrBSeL65LrxSimRl52wwsVo4tQ';
const ARTISAN_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuClfe1uHeZUtqc6O9_JeM7FrC8NQkN0oVdjUHs9qDw6Znqm2IqZAfaeC-e0zTRsSuAYgQrb8DLaEx7wnKjA3kwzkd72VzuA1QY--4AJBT598m7Dzy5pU7XTrMBXxmM_bKTqUuQAh8S4gzCurMXRwAXUD2OG1oLMN7x4oji2NDJ9iajtpa6hqYkm_jZWymTmNV4dRV0044eBRoOe4p87HqYLXGT9qWlw-4l7sOxMZCMigYUrJ8PPD4y3SA';

// Provisional fabric categories matching the placeholder sarees — the shop's real category list is still being collected
const TRUST_BADGES = [
  { icon: 'store', title: 'Visit Our Kamothe Shop', sub: 'Sector 36, Kamothe, Navi Mumbai' },
  { icon: 'local_shipping', title: 'Delivery All Over India', sub: 'Delivery charges apply' },
  { icon: 'swap_horiz', title: 'Returns & Exchange', sub: 'Within 7 days of delivery' },
  { icon: 'content_cut', title: 'Blouse Piece Included', sub: 'In-shop tailor, fall & pico' },
];

// One saree from each category first, so the featured row shows variety
function pickFeatured(all, count = 8) {
  const products = all.filter(p => !isSoldOut(p));   // never feature a sold-out saree
  const seen = new Set();
  const first = products.filter(p => !seen.has(p.category?.slug) && seen.add(p.category?.slug));
  const rest = products.filter(p => !first.includes(p));
  return [...first, ...rest].slice(0, count);
}

const FeaturedCard = ({ item }) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(item.id);
  const link = `/product/${item.slug}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <div className="relative h-[360px] overflow-hidden bg-maroon-50">
        <Link to={link}>
          {item.mainImage && (
            <img
              src={item.mainImage}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          )}
        </Link>
        <button
          onClick={() => toggleWishlist(item)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:text-maroon-900 transition-colors"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
            style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
          >favorite</span>
        </button>
        {item.variants.length > 1 && (
          <span className="absolute bottom-4 left-4 bg-maroon-900 text-white text-[10px] uppercase font-semibold px-3 py-1 rounded-full font-body tracking-wide">
            {item.variants.length} colours
          </span>
        )}
      </div>
      <div className="p-5">
        <span className="font-body text-[11px] uppercase tracking-widest text-gray-500 block mb-1">{item.category?.name}</span>
        <h3 className="font-heading font-bold text-charcoal mb-2 text-lg leading-snug line-clamp-2">{item.name}</h3>
        <div className="flex items-center justify-between mt-3">
          <span className="font-heading text-gold-700 font-bold text-xl">{formatPrice(item.price)}</span>
          <Link to={link} className="font-body font-semibold text-sm text-maroon-900 hover:underline">
            View Saree
          </Link>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchCatalogue().then(setProducts).catch(() => setProducts([]));
  }, []);

  // Category tiles: each uses the photo of its newest saree
  const categories = [];
  for (const p of products) {
    const c = categories.find(x => x.slug === p.category?.slug);
    if (c) c.count += 1;
    else if (p.category) categories.push({ ...p.category, count: 1, image: p.mainImage });
  }
  categories.sort((a, b) => b.count - a.count);
  const featured = pickFeatured(products);

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
            A Saree for<br />Every Occasion
          </h1>
          <p className="font-body text-base md:text-xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed">
            Fancy, designer printed and partywear sarees for every budget. Blouse piece included, delivery all over India.
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
          <h2 className="font-heading text-4xl font-semibold text-charcoal">Shop by Category</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {categories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[200px] md:h-[300px] rounded-2xl bg-maroon-100 animate-pulse" />
            ))
            : categories.map(({ slug, name, count, image }) => (
              <Link
                key={slug}
                to={`/category/${slug}`}
                className="group relative h-[200px] md:h-[300px] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-end p-4 md:p-5 bg-maroon-900 transition-transform duration-500 hover:-translate-y-2"
              >
                {image && (
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 text-white">
                  <h3 className="font-heading font-bold text-lg md:text-xl mb-0.5 leading-tight">{name}</h3>
                  <p className="font-body text-xs md:text-sm opacity-80">{count} saree{count !== 1 ? 's' : ''}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>

      {/* ─── 4. FEATURED SAREES ─── */}
      <section className="w-full bg-maroon-50 py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
            <div>
              <span className="font-body font-semibold text-[11px] tracking-[0.2em] uppercase text-maroon-900 mb-3 block">
                Our Collection
              </span>
              <h2 className="font-heading text-4xl font-semibold text-charcoal">Featured Sarees</h2>
            </div>
            <Link to="/collection" className="btn-primary mt-5 md:mt-0 inline-flex items-center gap-2 self-start md:self-auto">
              View All Sarees
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.length === 0
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[480px] rounded-2xl bg-white/60 animate-pulse" />
              ))
              : featured.map((item) => <FeaturedCard key={item.id} item={item} />)}
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
                  Vaibhav Laxmi Saree has been a saree shop in Kamothe, Navi Mumbai since 2016, run by Mrs. Mamta Bhandari. We keep fancy, designer printed and partywear sarees for every age group and occasion, plus lehengas and petticoats — with a blouse piece included, fall &amp; beading / pico and an in-shop tailor for blouse stitching.
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
