import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const HERO_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAS03cL2sHzbHQTc-fhSrmftUV9E7eUJMvCeAiLXkYrx95lZADj2bynqqIj7l85dYUUOZ4cPCSeT8O-eaPlJkQD69c2t4KrAzxL4TU4zr0KyqfZgPFGiQrItkN_IOB_UPZRGh9GBrgbMQ2X9w10DBgRhB_7de_MeSgB0_gi7bRpYcixPR7GS9OkCnRfw-E1kLl0FV-bLVu5oM28VPvdnJf2Bzm9InftvrBSeL65LrxSimRl52wwsVo4tQ';
const ARTISAN_IMG = 'https://lh3.googleusercontent.com/aida-public/AB6AXuClfe1uHeZUtqc6O9_JeM7FrC8NQkN0oVdjUHs9qDw6Znqm2IqZAfaeC-e0zTRsSuAYgQrb8DLaEx7wnKjA3kwzkd72VzuA1QY--4AJBT598m7Dzy5pU7XTrMBXxmM_bKTqUuQAh8S4gzCurMXRwAXUD2OG1oLMN7x4oji2NDJ9iajtpa6hqYkm_jZWymTmNV4dRV0044eBRoOe4p87HqYLXGT9qWlw-4l7sOxMZCMigYUrJ8PPD4y3SA';

const CATEGORIES = [
  {
    label: 'Banarasi Silk', sub: 'Varanasi Brocades',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBjHwQSb2n1NBvEE7Y_GmRCRZILFd3okHlTBKHUBQQ6oFiodiEJIPj-Pdjd3hEJ5QrL9IWS7N_1NC_RwMSmdteV0NtqmBe4Dd-R-WaQM2YoG3pofLmbljB7YfIZyg1Q08xY1d8ktYsmNnZKqjEsr-ojTPeAhFGzWzOIaX2DgIks7ONCp0fjPq303l1O6ztsNnT6vY8IfDr8LchCn4HPywYfu4EPg2LWl4bjEvsqf_UsMP9XyIPuunZ5Gw',
    query: 'banarasi',
  },
  {
    label: 'Kanjivaram', sub: 'Temple Zari Weaves',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA79uZPhTUm2SZC2lJGg7i5kg0PksSRPAh9VsqenNvM66WYzWDANr68fkR7MgHYbsvFURSnO8DCRIcCULwZOlTxCc0E8WaqvLDop9WDxpdWLOYCXdOK9TDPlJhZ-s48f1s2ILz2P_QE7eDkP0FqoSV6sEmnIP4qOp8bGHgHFWFKlaIrSCE6Ljbx9qGwZ6ldM414ZCsHVGBh9hZvKwCM4OcW_NI3AvsZu6kbXc5ktznNKwgUaRRRj_zgHQ',
    query: 'kanjeevaram',
  },
  {
    label: 'Chanderi Cotton', sub: 'Sheer Elegance',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDi5cflJiffswP0xPxv7_2YvuC38q1cawg87enl7bVrwSCjy6NtPN5iG18T8JHe4v_l_v99c-ThNHIPqhTShX_CwEFshdEes6KIc2zBtJ7p0lnoAYJu7onTlcRpZs81-XT9jlrquwhnyEp9BW_a2BsmOif_QgbBtHyZ3esiIoibazy3bfkh775n8Qk6lClDfG3w4ciR2sX_OYmR1VE30chPjkQdEkEfvuOZy-ItOlyVbLN-EjoZSH8tyg',
    query: 'chanderi',
  },
  {
    label: 'Patola Silk', sub: 'Double Ikat Art',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkWmsG8vVPePg-4Sie78Qf5JDvb-62OGbyGxNlvtwIBOaRPv_Qk1tVEhYgPRPE7485TvNGAbmg8kyiqy--QlpOd-wAn-Rxd5tEThSORIeN-YigsiiXzDGW7AOw4D62AZWexs1rlRARGpF1XO1tvFo-JL8cuZocfCZgQcftsbUO-liAgb4QlE62nneZ3qvBzGCsbzlgHucWaXJ-fv18bYRFgayWXT1yiscPlVj6an5-1kTHdK_dKNBQBQ',
    query: 'patola',
  },
  {
    label: 'Organza & Chiffon', sub: 'Contemporary Drapes',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvSfaS26nf9nO5Js4j340LjD5i8mleFjblJDuaMTjTSoFOKggYbQmz4UAwkRVub4JubbnumaZOpVRNoxTeNrMJBfihekzAJIxklMaDVTvaxMQVvAgNqNfsn1TVqVPdd3uVPDRtC-bFdzqTSm34VU51Z_Kl_ixO4EroPilwq-GpGHTk0FZ-y7fVMs7i_lLr_D-AgF044zZcNERn6F1e7iezg508Oc7QUHc5O92STP7l8cMQsrUJvAoBsg',
    query: 'organza',
  },
];

const TRUST_BADGES = [
  { icon: 'inventory_2', title: '500+ Designs In Stock', sub: 'Always fresh collection' },
  { icon: 'verified', title: 'Quality Checked', sub: 'Every piece inspected' },
  { icon: 'swap_horiz', title: 'Easy Exchange', sub: 'Hassle-free returns' },
  { icon: 'store', title: 'Visit Our Kamothe Store', sub: 'Sector 35, Navi Mumbai' },
];

// Static new arrivals with the CDN images
const STATIC_NEW_ARRIVALS = [
  {
    id: '5', name: 'Mayura Peacock Brocade Saree', fabric: 'Kanjeevaram',
    badge: 'Pure Zari',
    price: 45999, originalPrice: 58000,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOGRlgZCGGUkCuyScXDf8hONhfKiNReaQNProiAh5EpNs1ayd4mwntFTRPXTL3LafmOlhxJP06oig-oy_MIX9-Dqo3fTRqVjAs0UClMV2FLOcDurymznyGFm7nGMo1d55SH0SinNZWIGJTE0h9roG3TYk72oa0KQ1Rr9_MEh61wniqbbFL61myltssZAE473bIQUGM51YqVca2C6gErR776pIWi6PTx9wcnhwDlzmzLwt8UCW9PZigtA',
  },
  {
    id: '2', name: 'Zardosi Emerald Katan Silk Saree', fabric: 'Banarasi Silk',
    badge: 'Handloom Mark',
    price: 38500, originalPrice: 46000,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAN1LrFd-soy8aZidtGXz2xJGOlAjg9ri_dl5qP9zWwK-RsJgh08wJu8ZuPtvFT0CkBruqORuNAbDVjQiDk4xYk5A_fRNPmgQL1z8EOvFN7kSEeKuJO2spepdZIB-bTktvAUCrer-vUCWazHA4ufceEdOWzgxvTP3eL3ripM2jvemrZILfsTuNFV_zMrkYen2Dl261WZSvvLScr9Sgq6QFsdwx9S6r9at5x9LKCqhnx-tWuAH8dQN-DWg',
  },
  {
    id: '3', name: 'Nava Benarasi Organza Saree', fabric: 'Chanderi',
    badge: 'Limited Drop',
    price: 24399, originalPrice: 30000,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBJ5Exo50iibhqSk1pnFS8A2JUgEv-fkLQ4hoKVENfe_k820Rm78uaRQPK--fiHr7Xsu0F8rjMO5VkDNLzn2-kdulbfEVCEMtWkChNG-RQ744OS5imrDMtUBW_tz7uHCPRK4-cWzbHkuB85_uQh_8xuYn3wxIUmPrmmYCksy2LIMOAYsVA4XTsbU_1wXysiW7OOdrMzaZQ8khjqO8b9LPzsyVquMBogv2uFBBXw8k8wCUYm_0GcDB3Zg',
  },
  {
    id: '4', name: 'Patola Double Ikat Masterpiece', fabric: 'Patola Silk',
    badge: 'Masterpiece',
    price: 93200, originalPrice: 110000,
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOZ0oX-sXVp_yRtWYID2hOB48CC5se99CbUClZsnmxrt05CE0zXNQYKggdcL37jSsQ08Ded9qFAPVBnVN1Mp0HZ9LrAyGH3aPdhuW2RhAkxkP6dgtFgjXkV6AsaYZXB_fBnz7MAOB-OruXjHWB_NOIAHjOhg0S2oJmMo3TQO6Iy8CvVBNceAwbJQnPkiBGRcvpMESe5nUnWQoGsGGZ2eayLFj4jy_uNFe8Vtb40jzTH5pQf_GAcp9jNg',
  },
];

const NewArrivalCard = ({ item }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(item.id);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.06)] group transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
      <div className="relative h-[360px] overflow-hidden bg-maroon-50">
        <img
          src={item.img}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => toggleWishlist({ id: item.id, name: item.name, price: item.price, fabric: item.fabric })}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:text-maroon-900 transition-colors"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
              style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
            >favorite</span>
          </button>
          <button
            onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, fabric: item.fabric })}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md hover:text-maroon-900 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-500">shopping_bag</span>
          </button>
        </div>
        {/* Badge */}
        <span className="absolute bottom-4 left-4 bg-maroon-900 text-white text-[10px] uppercase font-semibold px-3 py-1 rounded-full font-body tracking-wide">
          {item.badge}
        </span>
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
            Exclusive Collection &amp; Best Prices
          </span>
          <h1 className="font-heading text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight max-w-5xl">
            Wide Collection,<br />Trending Designs,<br />Best Prices
          </h1>
          <p className="font-body text-base md:text-xl text-white/80 mb-12 max-w-2xl font-light leading-relaxed">
            Explore our wide range of premium sarees, curated specially for your finest moments with guaranteed quality.
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
            Curated Weaves
          </span>
          <h2 className="font-heading text-4xl font-semibold text-charcoal">Explore by Mastercraft Category</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {CATEGORIES.map(({ label, sub, img, query }) => (
            <Link
              key={label}
              to={`/collection?fabric=${encodeURIComponent(query)}`}
              className="group relative h-[400px] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-end p-5 bg-maroon-100 transition-transform duration-500 hover:-translate-y-2"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${img}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
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
                Fresh Arrivals
              </span>
              <h2 className="font-heading text-4xl font-semibold text-charcoal">New Arrivals</h2>
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
                  At Viraasat, we curate sarees that carry both beauty and unmatched quality. From our Kamothe store to your doorstep, we bring you the finest collection with competitive prices and easy exchange — no middlemen, no compromises.
                </p>
                <div className="pt-2 flex items-center gap-10">
                  <div>
                    <span className="font-heading text-3xl font-bold text-maroon-900 block">500+</span>
                    <span className="font-body text-xs text-gray-500">Designs Always In Stock</span>
                  </div>
                  <div className="w-px h-14 bg-gold-700/30" />
                  <div>
                    <span className="font-heading text-3xl font-bold text-maroon-900 block">120+</span>
                    <span className="font-body text-xs text-gray-500">Brands &amp; Suppliers</span>
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
