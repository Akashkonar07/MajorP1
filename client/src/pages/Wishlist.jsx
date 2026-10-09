import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveAllToBag = () => {
    wishlist.forEach(item => addToCart(item));
    wishlist.forEach(item => removeFromWishlist(item.id));
  };

  const moveToBag = (item) => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  const stockBadge = (stock) =>
    stock === 'low-stock'
      ? <span className="font-body text-[10px] font-semibold text-white bg-red-600 px-2 py-0.5 rounded-sm">Low Stock</span>
      : <span className="font-body text-[10px] font-semibold text-white bg-emerald-700 px-2 py-0.5 rounded-sm">In Stock</span>;

  if (wishlist.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-maroon-900">favorite</span>
        </div>
        <h1 className="font-heading text-4xl text-charcoal mb-3">Your wishlist is empty</h1>
        <p className="font-body text-gray-500 text-sm mb-8">Save sarees you love using the heart icon on each product.</p>
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="section-label mb-1">Personal Vault</p>
          <h1 className="font-heading text-4xl font-semibold text-charcoal">My Wishlist</h1>
          <p className="font-body text-sm text-gray-500 mt-1">
            {wishlist.length} saree{wishlist.length !== 1 ? 's' : ''} saved for your upcoming celebrations.
          </p>
        </div>
        <button
          onClick={moveAllToBag}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-base">shopping_bag</span>
          Move All to Bag
        </button>
      </div>

      {/* Wishlist grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {wishlist.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-soft border border-gray-50 overflow-hidden relative flex gap-0">
            {/* Remove */}
            <button
              onClick={() => removeFromWishlist(item.id)}
              className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors z-10"
            >
              <span className="material-symbols-outlined text-sm text-gray-400">close</span>
            </button>

            {/* Image */}
            <div
              className="w-36 shrink-0 flex items-center justify-center"
              style={{ backgroundColor: `${item.colorCode}22`, minHeight: '180px' }}
            >
              {stockBadge(item.stock)}
              <div
                className="w-12 h-12 rounded-full mt-6"
                style={{ backgroundColor: item.colorCode }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 p-4">
              <p className="font-body text-[10px] font-medium text-gold-700 tracking-widest uppercase mb-1">{item.fabric}</p>
              <h3 className="font-heading font-semibold text-base text-charcoal leading-snug mb-2">{item.name}</h3>
              <p className="font-body text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{item.description}</p>

              <div className="flex items-center gap-2 mb-4">
                <span className="font-body font-bold text-maroon-900 text-sm">
                  ₹{item.price.toLocaleString('en-IN')}
                </span>
                {item.originalPrice && (
                  <span className="font-body text-xs text-gray-400 line-through">
                    ₹{item.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <button
                onClick={() => moveToBag(item)}
                className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4 w-full justify-center"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_bag</span>
                Move to Bag
              </button>
            </div>
          </div>
        ))}
      </div>

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
            Explore our latest festive drops featuring Chanderi organzas, Banarasi brocades, and classic Kanjeevaram silks.
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
            <div className="w-20 h-20 bg-maroon-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-heading font-bold text-white text-2xl">VS</span>
            </div>
            <p className="font-heading text-maroon-900 text-lg font-semibold">500+ Designs</p>
            <p className="font-body text-xs text-gray-500 mt-1">Always in Stock</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Wishlist;
