import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { fetchCatalogue, formatPrice, stockStatus } from '../lib/catalogue';
import logoPrimary from '../assets/brand/logo-primary.svg';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [catalogue, setCatalogue] = useState(null);

  // The wishlist only stores ids; current name, price and photo come from the catalogue
  useEffect(() => {
    fetchCatalogue().then(setCatalogue).catch(() => setCatalogue([]));
  }, []);

  const items = catalogue
    ? wishlist.map(w => catalogue.find(p => p.id === w.id)).filter(Boolean)
    : [];

  if (wishlist.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-maroon-900">favorite</span>
        </div>
        <h1 className="font-heading text-4xl text-charcoal mb-3">Your wishlist is empty</h1>
        <p className="font-body text-gray-500 text-sm mb-8">Save sarees you love using the heart icon on each saree.</p>
        <Link to="/collection" className="btn-primary inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">collections</span>
          Browse Collection
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="section-label mb-1">Saved For Later</p>
        <h1 className="font-heading text-4xl font-semibold text-charcoal">My Wishlist</h1>
        <p className="font-body text-sm text-gray-500 mt-1">
          {wishlist.length} saree{wishlist.length !== 1 ? 's' : ''} saved for your upcoming celebrations.
        </p>
      </div>

      {/* Wishlist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {catalogue === null
          ? wishlist.map(w => <div key={w.id} className="h-48 bg-gray-100 rounded-lg animate-pulse" />)
          : items.map((item) => {
            const soldOut = item.variants.every(v => stockStatus(v) === 'out');
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-soft border border-gray-50 overflow-hidden relative flex">
                {/* Remove */}
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors z-10"
                >
                  <span className="material-symbols-outlined text-sm text-gray-400">close</span>
                </button>

                {/* Photo */}
                <Link to={`/product/${item.slug}`} className="w-36 shrink-0 bg-maroon-50" style={{ minHeight: '180px' }}>
                  {item.mainImage && (
                    <img src={item.mainImage} alt={item.name} loading="lazy" className="w-full h-full object-cover" />
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 p-4 pr-10">
                  <p className="font-body text-[10px] font-medium text-gold-700 tracking-widest uppercase mb-1">{item.category?.name}</p>
                  <h3 className="font-heading font-semibold text-base text-charcoal leading-snug mb-2">{item.name}</h3>
                  <p className="font-body text-xs text-gray-500 mb-3">
                    {item.variants.length} colour{item.variants.length !== 1 ? 's' : ''} · {item.fabric}
                  </p>
                  <p className="font-body font-bold text-maroon-900 text-sm mb-4">{formatPrice(item.price)}</p>

                  {soldOut ? (
                    <span className="block text-center font-body text-xs font-semibold text-gray-500 bg-gray-100 py-2 rounded-sm">
                      Out of Stock
                    </span>
                  ) : (
                    <Link
                      to={`/product/${item.slug}`}
                      className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4 w-full justify-center"
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                      Choose Colour &amp; Add to Bag
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {catalogue !== null && items.length < wishlist.length && (
        <p className="font-body text-xs text-gray-500 -mt-8 mb-10">
          Some saved sarees are no longer available and are not shown.
        </p>
      )}

      {/* Discover More Banner */}
      <div
        className="rounded-xl overflow-hidden flex flex-col md:flex-row min-h-[280px]"
        style={{ background: 'linear-gradient(135deg, #fff8f7 0%, #fce7ed 100%)' }}
      >
        <div className="flex-1 p-10 flex flex-col justify-center">
          <p className="section-label mb-3">Curated For Your Taste</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal leading-tight mb-4">
            Discover More<br />Beautiful Designs
          </h2>
          <p className="font-body text-sm text-gray-600 mb-6 leading-relaxed max-w-sm">
            Explore fancy, designer printed and partywear sarees for daily wear, festivals and weddings.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/collection" className="btn-primary flex items-center gap-2">
              View All Collection
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <Link to="/store-locator" className="btn-secondary">Visit Our Store</Link>
          </div>
        </div>
        <div className="w-full md:w-96 min-h-[200px] bg-maroon-50 flex items-center justify-center">
          <div className="text-center p-8">
            <img src={logoPrimary} alt="Vaibhav Laxmi Saree" className="h-32 w-auto mx-auto" />
            <p className="font-body text-xs text-gray-500 mt-2">Kamothe, Navi Mumbai</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
