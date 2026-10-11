import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, stockStatus } from '../lib/catalogue';

const ProductCard = ({ product }) => {
  const { toggleWishlist, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const colours = product.variants;
  const soldOut = colours.length > 0 && colours.every(v => stockStatus(v) === 'out');
  const link = `/product/${product.slug}`;

  return (
    <div className="group relative bg-white rounded overflow-hidden shadow-soft card-hover">
      {/* Photo */}
      <Link to={link} className="block relative overflow-hidden aspect-[3/4] bg-maroon-50">
        {product.mainImage ? (
          <img
            src={product.mainImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center font-heading text-charcoal text-sm px-4 text-center">
            {product.name}
          </div>
        )}
        {soldOut && (
          <span className="absolute top-3 left-3 text-[10px] font-body font-semibold px-2 py-0.5 rounded-sm bg-gray-600 text-white">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Wishlist */}
      <button
        onClick={() => toggleWishlist(product)}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      >
        <span
          className={`material-symbols-outlined text-lg ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
          style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
        >
          favorite
        </span>
      </button>

      {/* Info */}
      <div className="p-3.5">
        <p className="font-body text-[10px] font-medium text-gold-700 tracking-widest uppercase mb-1 truncate">
          {product.category?.name}
        </p>
        <Link to={link}>
          <h3 className="font-heading text-base font-semibold text-charcoal leading-snug mb-2 hover:text-maroon-900 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <span className="font-body font-semibold text-maroon-900 text-sm">{formatPrice(product.price)}</span>
          {colours.length > 1 && (
            <span className="flex items-center gap-1 font-body text-[11px] text-gray-500">
              <span className="flex -space-x-1">
                {colours.slice(0, 4).map(v => (
                  <span
                    key={v.id}
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: v.color_hex ?? '#ccc' }}
                  />
                ))}
              </span>
              {colours.length} colours
            </span>
          )}
        </div>
        <Link
          to={link}
          className="mt-2.5 block text-center border border-maroon-900 text-maroon-900 font-body text-xs font-medium py-1.5 rounded-sm hover:bg-maroon-900 hover:text-white transition-all duration-200"
        >
          {colours.length > 1 ? 'Choose Colour' : 'View Saree'}
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
