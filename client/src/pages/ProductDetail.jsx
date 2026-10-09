import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const REVIEWS = [
  {
    name: 'Ananya Mukherjee',
    verified: true,
    rating: 5,
    text: 'The saree exceeded my expectations! The colours were vibrant and the drape was perfect. Visited the Kamothe store and got excellent service.',
  },
  {
    name: 'Dr. Meenakshi Iyer',
    verified: true,
    rating: 5,
    text: 'Exceptional quality, and the ₹500 discount certificate for walk-ins is a great touch! Beautiful drape and excellent craftsmanship. Highly recommended.',
  },
];

const WHY_US = [
  {
    icon: 'price_check',
    title: 'Direct & Fair Pricing',
    desc: 'We buy in bulk and pass on the savings — giving you the best prices without middlemen.',
  },
  {
    icon: 'inventory_2',
    title: 'Extensive Variety',
    desc: 'Browse our curated collection of 500+ designs, from classic to contemporary, all in stock.',
  },
  {
    icon: 'verified_user',
    title: 'Years of Trust',
    desc: 'Serving Navi Mumbai for years with quality-checked sarees and reliable customer service.',
  },
];

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined text-base ${i < rating ? 'text-gold-700' : 'text-gray-300'}`}
        style={{ fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
    ))}
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [blouseOption, setBlouseOption] = useState('unstitched');
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
    if (product) {
      const finalPrice = blouseOption === 'custom' ? product.price + 2500 : product.price;
      addToCart({ ...product, price: finalPrice, blouseOption });
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
                  <div className="font-heading text-maroon-900 text-3xl font-bold opacity-30">VS</div>
                </div>
                {/* Watch Reel Badge */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-2 px-4 py-2 shadow-md cursor-pointer hover:bg-white transition-colors">
                  <div className="w-6 h-6 bg-maroon-900 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                  <div>
                    <p className="font-body text-xs font-semibold text-charcoal leading-tight">Watch Saree Draping Reel</p>
                    <p className="font-body text-[10px] text-gray-500">Styling video available</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div>
            {/* Top badges */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-body font-medium text-xs px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Quality Checked
              </span>
              <span className="flex items-center gap-1 bg-maroon-50 text-maroon-900 font-body font-medium text-xs px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">store</span>
                Visit us — ₹500 off in-store
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
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Weave Region</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.region}</p>
              </div>
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Colour Test</p>
                <p className="font-body text-sm font-medium text-charcoal">30 Days</p>
              </div>
              <div>
                <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">Dye Type</p>
                <p className="font-body text-sm font-medium text-charcoal">{product.dyeType}</p>
              </div>
            </div>

            {/* Blouse option */}
            <div className="mb-5">
              <p className="font-body font-semibold text-sm text-charcoal mb-2">Blouse Piece Option</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setBlouseOption('unstitched')}
                  className={`flex-1 py-2.5 px-4 rounded-sm text-sm font-body font-medium transition-all border ${
                    blouseOption === 'unstitched'
                      ? 'bg-maroon-900 text-white border-maroon-900'
                      : 'border-gray-200 text-charcoal hover:border-maroon-900'
                  }`}
                >
                  Included Unstitched
                </button>
                <button
                  onClick={() => setBlouseOption('custom')}
                  className={`flex-1 py-2.5 px-4 rounded-sm text-sm font-body font-medium transition-all border ${
                    blouseOption === 'custom'
                      ? 'bg-maroon-900 text-white border-maroon-900'
                      : 'border-gray-200 text-charcoal hover:border-maroon-900'
                  }`}
                >
                  Custom Stitched (+₹2,500)
                </button>
              </div>
            </div>

            {/* Drape length */}
            <div className="mb-6">
              <label className="font-body font-semibold text-sm text-charcoal mb-2 block">Drape Length</label>
              <div className="relative">
                <select className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm font-body appearance-none focus:outline-none focus:border-maroon-900 bg-white pr-10">
                  <option>Standard 6.3m Saree with Matching Blouse</option>
                  <option>Standard 5.5m (Short Saree)</option>
                  <option>Long 7.5m with Extra Pallu</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mb-5">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 font-body font-semibold py-3.5 rounded-sm transition-all duration-200 ${
                  addedToCart ? 'bg-emerald-700 text-white' : 'bg-maroon-900 text-white hover:bg-maroon-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {addedToCart ? 'check_circle' : 'shopping_bag'}
                </span>
                {addedToCart ? 'Added to Bag!' : 'Add to Bag'}
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
                <span>Complimentary insured express shipping across India & Navi Mumbai</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">swap_horiz</span>
                <span>7-day easy return policy with Silk Mark authenticity tag trial</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHY SHOP WITH US */}
        <section className="mt-16 text-center">
          <p className="section-label mb-2">Our Promise</p>
          <h2 className="font-heading text-4xl font-semibold text-charcoal mb-3">Why Shop With Us</h2>
          <p className="font-body text-sm text-gray-500 max-w-lg mx-auto mb-10">
            Dedicated to providing exceptional retail luxury with unmatched transparency and value.
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
              <p className="font-body font-semibold text-sm text-charcoal">Available at our Kamothe store</p>
              <p className="font-body text-xs text-gray-500 mt-0.5">Shop 6, Suyash Harmony, Sector 35, Kamothe, Navi Mumbai — visit or reserve for pickup</p>
            </div>
            <Link to="/store-locator" className="btn-primary whitespace-nowrap shrink-0">
              Reserve for Pickup
            </Link>
          </div>
        </section>

        {/* CARE & MAINTENANCE + REVIEWS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
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

          {/* Reviews */}
          <div className="bg-white rounded-lg p-6 shadow-soft border border-gray-50">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-2xl font-semibold text-charcoal">Patron Reviews</h3>
              <div className="flex items-center gap-1.5">
                <StarRating rating={5} />
                <span className="font-body text-sm font-semibold text-charcoal">5.0/5</span>
              </div>
            </div>
            <div className="space-y-4">
              {REVIEWS.map(({ name, verified, rating, text }) => (
                <div key={name} className="bg-cream rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-body font-semibold text-sm text-charcoal">{name}</p>
                      {verified && (
                        <span className="font-body text-[10px] text-emerald-700 flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    <StarRating rating={rating} />
                  </div>
                  <p className="font-body text-xs text-gray-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductDetail;
