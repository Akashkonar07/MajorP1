import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SHOP } from '../config/shop';
import logoIcon from '../assets/brand/icon.svg';

const WHY_US = [
  {
    icon: 'content_cut',
    title: 'Blouse Stitching In-Shop',
    desc: 'Every saree comes with a blouse piece, and our in-shop tailor can stitch it for you. Fall & beading / pico service is also available.',
  },
  {
    icon: 'local_shipping',
    title: 'Delivery All Over India',
    desc: 'We deliver across India. Delivery charges apply and are shown at checkout.',
  },
  {
    icon: 'swap_horiz',
    title: 'Returns & Exchange',
    desc: 'Returns and exchanges are available. Call or WhatsApp us and we will help.',
  },
];

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    setLoading(true);
    axios.get(`http://localhost:5000/api/products/${id}`)
      .then(res => { setProduct(res.data); setSelectedImage(0); })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (product && product.stock !== 0) {
      addToCart(product);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-24">
        <p className="font-heading text-3xl text-gray-400">Product not found</p>
        <Link to="/collection" className="btn-primary mt-6 inline-block">Back to Collection</Link>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock === 0;

  // Placeholder color tiles for images
  const imagePlaceholders = [product.colorCode, '#755b00', '#2d1f1f', '#5d0325'];

  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400">
          <Link to="/" className="hover:text-maroon-900 transition-colors">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <Link to="/collection" className="hover:text-maroon-900 transition-colors">Collection</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-charcoal font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* IMAGE GALLERY */}
          <div className="flex gap-3">
            {/* Thumbnails */}
            <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
              {imagePlaceholders.map((color, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-20 rounded overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-maroon-900' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${color}33` }}>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                </button>
              ))}
            </div>

            {/* Main image */}
            <div className="flex-1 relative">
              <div
                className="w-full aspect-[3/4] rounded-lg flex items-center justify-center overflow-hidden relative"
                style={{ backgroundColor: `${imagePlaceholders[selectedImage]}22` }}
              >
                <div className="text-center p-8">
                  <div
                    className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
                    style={{ backgroundColor: imagePlaceholders[selectedImage] }}
                  />
                  <img src={logoIcon} alt="Vaibhav Laxmi Saree" className="w-12 h-12 mx-auto opacity-60" />
                </div>
                {product.placeholder && (
                  <span className="absolute bottom-4 left-4 bg-white/90 text-charcoal font-body text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                    Sample product — photo coming soon
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div>
            {/* Top badges */}
            <div className="flex items-center gap-3 mb-4">
              {outOfStock ? (
                <span className="bg-gray-100 text-gray-600 font-body font-medium text-xs px-3 py-1 rounded-full">Out of Stock</span>
              ) : product.stock <= 1 ? (
                <span className="bg-red-50 text-red-700 font-body font-medium text-xs px-3 py-1 rounded-full">Only {product.stock} left</span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 font-body font-medium text-xs px-3 py-1 rounded-full">In Stock</span>
              )}
              <span className="flex items-center gap-1 bg-maroon-50 text-maroon-900 font-body font-medium text-xs px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">checkroom</span>
                Blouse piece included
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="font-heading text-3xl font-bold text-maroon-900">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && (
                <>
                  <span className="font-body text-lg text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-emerald-600 text-white font-body font-semibold text-xs px-2 py-0.5 rounded">
                    {product.discount}% saving now
                  </span>
                </>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-cream rounded-lg p-4">
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Fabric</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.fabric}</p>
              </div>
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Colour</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.color}</p>
              </div>
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Occasion</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.occasion}</p>
              </div>
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Blouse Piece</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.blouseDetail}</p>
              </div>
            </div>

            {/* Services (prices to be confirmed with the shop) */}
            <div className="mb-6 flex items-start gap-2 font-body text-sm text-gray-600">
              <span className="material-symbols-outlined text-base text-maroon-900 mt-0.5">content_cut</span>
              <span>Blouse stitching and fall &amp; beading / pico available — ask us on WhatsApp.</span>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className={`flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-body font-semibold py-3.5 rounded-sm transition-all duration-200 ${
                  addedToCart ? 'bg-emerald-700 text-white' : 'bg-maroon-900 text-white hover:bg-maroon-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {addedToCart ? 'check_circle' : 'shopping_bag'}
                </span>
                {outOfStock ? 'Out of Stock' : addedToCart ? 'Added to Bag!' : 'Add to Bag'}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                className={`w-14 h-14 flex items-center justify-center rounded-sm border-2 transition-all ${
                  wishlisted ? 'border-maroon-900 bg-maroon-50' : 'border-gray-200 hover:border-maroon-900'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${wishlisted ? 'text-maroon-900' : 'text-gray-400'}`}
                  style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
            </div>

            {/* Notes */}
            <div className="space-y-2 text-xs font-body text-gray-500">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">local_shipping</span>
                <span>Delivery all over India (delivery charges apply)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">swap_horiz</span>
                <span>Returns and exchanges available</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">currency_rupee</span>
                <span>Payment by UPI</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHY SHOP WITH US */}
        <section className="mt-16 text-center">
          <p className="section-label mb-2">Our Promise</p>
          <h2 className="font-heading text-4xl font-semibold text-charcoal mb-3">Why Shop With Us</h2>
          <p className="font-body text-sm text-gray-500 max-w-lg mx-auto mb-10">
            Your neighbourhood saree shop in Kamothe since {SHOP.since}.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {WHY_US.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-lg p-6 shadow-soft text-left border border-gray-50">
                <div className="w-12 h-12 bg-maroon-50 rounded-lg flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-maroon-900 text-2xl">{icon}</span>
                </div>
                <h3 className="font-heading font-semibold text-lg text-charcoal mb-2">{title}</h3>
                <p className="font-body text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Store Pickup Banner */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-cream border border-gold-700/20 rounded-lg px-6 py-4 gap-4">
            <div className="text-left">
              <p className="font-body font-semibold text-sm text-charcoal">Visit our shop in Kamothe</p>
              <p className="font-body text-xs text-gray-500 mt-0.5">{SHOP.addressShort} · Open {SHOP.hours}</p>
            </div>
            <Link to="/store-locator" className="btn-primary whitespace-nowrap shrink-0">
              Get Directions
            </Link>
          </div>
        </section>

        {/* CARE & MAINTENANCE */}
        <div className="mt-12">
          {/* Care */}
          <div className="bg-white rounded-lg p-6 shadow-soft border border-gray-50">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-maroon-900">local_laundry_service</span>
              <h3 className="font-heading text-2xl font-semibold text-charcoal">Care & Maintenance</h3>
            </div>
            <ul className="space-y-4">
              {product.careInstructions?.map((care, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-maroon-900 text-base mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body text-sm text-gray-600 leading-relaxed">
                    <strong>{care.split(':')[0]}: </strong>
                    {care.split(':').slice(1).join(':')}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
