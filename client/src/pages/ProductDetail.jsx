import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SHOP, whatsappWith } from '../config/shop';
import { supabase } from '../lib/supabase';
import { logEvent } from '../lib/events';
import SimilarSarees from '../components/SimilarSarees';
import {
  fetchProductBySlug, formatPrice, stockStatus, isOrderable, AVAILABILITY_NOTE,
} from '../lib/catalogue';

const WHY_US = [
  {
    icon: 'content_cut',
    title: 'Blouse Stitching In-Shop',
    desc: 'Every saree comes with a blouse piece. Our in-shop tailor stitches blouses (measurements are taken at the shop) and does fall beading and pico.',
  },
  {
    icon: 'local_shipping',
    title: 'Delivery All Over India',
    desc: 'Delivery charges are shown at checkout. Orders are dispatched within 2 working days of payment verification.',
  },
  {
    icon: 'swap_horiz',
    title: 'Returns & Exchange',
    desc: 'Return or exchange within 7 days of delivery — tell us on WhatsApp within 48 hours of delivery.',
  },
];

const STOCK_BADGE = {
  untracked: null,
  out: { text: 'Out of stock in this colour', cls: 'bg-gray-100 text-gray-600' },
  low: { text: 'Only a few left', cls: 'bg-red-50 text-red-700' },
  in: { text: 'In stock', cls: 'bg-emerald-50 text-emerald-700' },
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loaded, setLoaded] = useState({ slug: null, product: null, error: false });
  const [addons, setAddons] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  useEffect(() => {
    let cancelled = false;
    fetchProductBySlug(slug)
      .then(product => {
        if (cancelled) return;
        setLoaded({ slug, product, error: false });
        if (product) logEvent(product.id, 'view');          // anonymous activity (lib/events.js)
      })
      .catch(() => { if (!cancelled) setLoaded({ slug, product: null, error: true }); });
    return () => { cancelled = true; };
  }, [slug]);

  // Fall beading / pico prices (the only online add-ons), from the services table
  useEffect(() => {
    supabase.from('services').select('name, price').eq('is_online_addon', true).order('sort_order')
      .then(({ data }) => setAddons(data ?? []));
  }, []);

  const loading = loaded.slug !== slug;
  const product = loading ? null : loaded.product;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
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
        <p className="font-heading text-3xl text-gray-400">
          {loaded.error ? 'Could not load this saree' : 'Saree not found'}
        </p>
        <Link to="/collection" className="btn-primary mt-6 inline-block">Back to Collection</Link>
      </div>
    );
  }

  // The chosen colour lives in the URL (?colour=Pink) so a link opens the same colour
  const colourParam = searchParams.get('colour');
  const variant = product.variants.find(v => v.color_name === colourParam) ?? product.variants[0];
  const photos = [...(variant?.images ?? []), ...product.sharedImages];
  const mainPhoto = photos[Math.min(imageIndex, photos.length - 1)];
  const status = stockStatus(variant);
  const orderable = isOrderable(variant);
  const wishlisted = isWishlisted(product.id);

  const chooseColour = (v) => {
    setImageIndex(0);
    setSearchParams({ colour: v.color_name }, { replace: true });
  };

  const handleAddToCart = () => {
    if (!variant || !orderable) return;
    addToCart({
      id: variant.id,                       // one bag line per colour
      productId: product.id,
      slug: product.slug,
      name: product.name,
      colorName: variant.color_name,
      colorHex: variant.color_hex,
      price: product.price,                 // shown in the bag only; checkout recalculates on the server
      image: variant.images[0] ?? product.mainImage,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const details = [
    ['Category', product.category?.name],
    ['Fabric', product.fabric],
    ['Occasion', product.occasions?.join(', ')],
    ['Blouse', product.blouse_details || (product.blouse_included ? 'Blouse piece included' : null)],
    ['Work', product.work],
    ['Saree length', product.saree_length_m ? `${product.saree_length_m} m` : null],
    ['Product code', product.code],
  ].filter(([, value]) => value);

  return (
    <main>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400">
          <Link to="/" className="hover:text-maroon-900 transition-colors">Home</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          {product.category ? (
            <Link to={`/category/${product.category.slug}`} className="hover:text-maroon-900 transition-colors">
              {product.category.name}
            </Link>
          ) : (
            <Link to="/collection" className="hover:text-maroon-900 transition-colors">Collection</Link>
          )}
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-charcoal font-medium truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* PHOTO GALLERY */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex sm:flex-col gap-2 sm:w-16 shrink-0 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px]">
                {photos.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setImageIndex(i)}
                    aria-label={`Photo ${i + 1}`}
                    className={`w-16 h-20 shrink-0 rounded overflow-hidden border-2 transition-all ${
                      src === mainPhoto ? 'border-maroon-900' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main photo */}
            <div className="flex-1 relative">
              <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-white shadow-soft">
                {mainPhoto ? (
                  <img
                    src={mainPhoto}
                    alt={`${product.name} — ${variant?.color_name}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-heading text-gray-400">
                    Photo coming soon
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {STOCK_BADGE[status] && (
                <span className={`font-body font-medium text-xs px-3 py-1 rounded-full ${STOCK_BADGE[status].cls}`}>
                  {STOCK_BADGE[status].text}
                </span>
              )}
              {product.blouse_included && (
                <span className="flex items-center gap-1 bg-maroon-50 text-maroon-900 font-body font-medium text-xs px-3 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">checkroom</span>
                  Blouse piece included
                </span>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-semibold text-charcoal leading-tight mb-4">
              {product.name}
            </h1>

            <p className="font-heading text-3xl font-bold text-maroon-900 mb-6">{formatPrice(product.price)}</p>

            {/* Colour swatches */}
            <div className="mb-6">
              <p className="font-body font-semibold text-sm text-charcoal mb-3">
                Colour: <span className="font-normal text-gray-600">{variant?.color_name}</span>
                {product.variants.length > 1 && (
                  <span className="font-normal text-gray-400"> · {product.variants.length} colours</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map(v => {
                  const selected = v.id === variant?.id;
                  const soldOut = stockStatus(v) === 'out';
                  return (
                    <button
                      key={v.id}
                      onClick={() => chooseColour(v)}
                      title={v.color_name + (soldOut ? ' (out of stock)' : '')}
                      aria-label={v.color_name}
                      aria-pressed={selected}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        selected ? 'border-maroon-900 ring-2 ring-maroon-900/30' : 'border-gray-200 hover:border-gray-400'
                      } ${soldOut ? 'opacity-40' : ''}`}
                    >
                      {v.images[0] ? (
                        <img src={v.images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="block w-full h-full" style={{ backgroundColor: v.color_hex ?? '#ccc' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-cream rounded-lg p-4">
              {details.map(([label, value]) => (
                <div key={label}>
                  <p className="font-body text-[10px] text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-body text-sm font-medium text-charcoal">{value}</p>
                </div>
              ))}
            </div>

            {product.description && (
              <p className="font-body text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Add-ons (chosen at checkout) */}
            {addons.length > 0 && (
              <div className="mb-6 flex items-start gap-2 font-body text-sm text-gray-600">
                <span className="material-symbols-outlined text-base text-maroon-900 mt-0.5">content_cut</span>
                <span>
                  Add at checkout: {addons.map(a => `${a.name} ${formatPrice(a.price)}`).join(' · ')}.
                  Blouse stitching — enquire on WhatsApp.
                </span>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={!orderable}
                className={`flex-1 flex items-center justify-center gap-2 font-body font-semibold py-3.5 rounded-sm transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  addedToCart ? 'bg-emerald-700 text-white' : 'bg-maroon-900 text-white hover:bg-maroon-800'
                }`}
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {addedToCart ? 'check_circle' : 'shopping_bag'}
                </span>
                {!orderable ? 'Out of Stock' : addedToCart ? 'Added to Bag!' : 'Add to Bag'}
              </button>
              <button
                onClick={() => toggleWishlist(product)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
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

            {/* Order on WhatsApp: same saree + colour, ready-typed */}
            <a
              href={whatsappWith(
                `Namaste, I would like to ${orderable ? 'order' : 'ask about'} this saree:\n` +
                `${product.name}${product.code ? ` (${product.code})` : ''}\n` +
                `Colour: ${variant?.color_name ?? '-'}\nPrice: ${formatPrice(product.price)}\n` +
                `${window.location.origin}/product/${product.slug}?colour=${encodeURIComponent(variant?.color_name ?? '')}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mb-4 flex items-center justify-center gap-2 font-body font-semibold py-3 rounded-sm border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chat</span>
              {orderable ? 'Order on WhatsApp' : 'Ask on WhatsApp'}
            </a>

            {status === 'untracked' && (
              <p className="flex items-start gap-2 font-body text-xs text-gray-500 mb-5">
                <span className="material-symbols-outlined text-sm text-gold-700 mt-0.5">info</span>
                {AVAILABILITY_NOTE}
              </p>
            )}

            {/* Notes */}
            <div className="space-y-2 text-xs font-body text-gray-500">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">local_shipping</span>
                <span>Delivery all over India — charges shown at checkout</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">swap_horiz</span>
                <span>Return or exchange within 7 days of delivery (unused, tags intact)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-sm text-maroon-900 mt-0.5">currency_rupee</span>
                <span>Payment by UPI</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHY SHOP WITH US */}
        <SimilarSarees productId={product.id} />

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

          {/* Store Banner */}
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
      </div>
    </main>
  );
};

export default ProductDetail;
