import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const FALLBACK_COLORS = [
  'bg-maroon-100', 'bg-gold-100', 'bg-pink-100', 'bg-purple-100',
  'bg-blue-100', 'bg-green-100', 'bg-amber-100', 'bg-teal-100',
];

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;
  const colorIndex = parseInt(product.id) % FALLBACK_COLORS.length;

  const badgeColor = {
    'Low Stock': 'bg-red-800 text-white',
    'Out of Stock': 'bg-gray-600 text-white',
  };

  return (
    <div className="group relative bg-white rounded overflow-hidden shadow-soft card-hover">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4]">
        <div
          className={`w-full h-full ${FALLBACK_COLORS[colorIndex]} flex items-center justify-center transition-transform duration-500 group-hover:scale-105`}
        >
          <img
            src={product.images?.[0] || '/images/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="hidden w-full h-full flex-col items-center justify-center absolute inset-0"
            style={{ background: `${product.colorCode}22` }}
          >
            <div
              className="w-16 h-16 rounded-full mb-3 border-4 border-white shadow-md"
              style={{ backgroundColor: product.colorCode }}
            />
            <span className="font-heading text-charcoal text-center px-4 text-sm font-medium">
              {product.name}
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
          {product.badge && (
            <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-sm ${badgeColor[product.badge] || 'bg-maroon-900 text-white'}`}>
              {product.badge}
            </span>
          )}
          {/* Placeholder products are marked until real sarees and photos are added */}
          {product.placeholder && (
            <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-sm bg-white/90 text-charcoal border border-gray-200">
              Sample
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product)}
          className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <span
            className={`material-symbols-outlined text-lg ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
            style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>

        {/* Quick add overlay */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className="w-full bg-maroon-900 text-white font-body font-medium text-sm py-3 hover:bg-maroon-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {outOfStock ? 'Out of Stock' : 'Quick Add to Bag'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-body text-[10px] font-medium text-gold-700 tracking-widest uppercase mb-1">
          {product.fabric}
        </p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug mb-2 hover:text-maroon-900 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-body font-semibold text-maroon-900 text-sm">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.originalPrice && (
            <>
              <span className="font-body text-xs text-gray-400 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="font-body text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {product.discount}% off
              </span>
            </>
          )}
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-2.5 block text-center border border-maroon-900 text-maroon-900 font-body text-xs font-medium py-1.5 rounded-sm hover:bg-maroon-900 hover:text-white transition-all duration-200"
        >
          Quick View
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
