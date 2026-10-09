import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const gst = Math.round(cartTotal * 0.05);
  const discount = promoApplied ? Math.round(cartTotal * 0.1) : 0;
  const finalTotal = cartTotal - discount + gst;

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'VIRAASAT10') {
      setPromoApplied(true);
      setPromoError('');
    } else {
      setPromoError('Invalid promo code');
      setPromoApplied(false);
    }
  };

  if (cart.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-24 h-24 bg-maroon-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl text-maroon-900">shopping_bag</span>
        </div>
        <h1 className="font-heading text-4xl text-charcoal mb-3">Your bag is empty</h1>
        <p className="font-body text-gray-500 text-sm mb-8">Add beautiful sarees to your bag to see them here.</p>
        <Link to="/collection" className="btn-primary inline-flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">collections</span>
          Explore Collection
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Heading */}
      <div className="mb-8">
        <p className="font-body font-semibold text-xs tracking-widest uppercase text-gray-500 mb-1">Secure Bag & Checkout</p>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">Your Selection</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {cart.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-soft p-5 flex gap-5 border border-gray-50">
              {/* Image */}
              <div
                className="w-24 h-28 rounded shrink-0 flex items-center justify-center"
                style={{ backgroundColor: `${item.colorCode}22` }}
              >
                <div className="w-10 h-10 rounded-full" style={{ backgroundColor: item.colorCode }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-base text-charcoal leading-tight mb-1">{item.name}</h3>
                <p className="font-body text-xs text-gray-500 mb-2">{item.fabric} • {item.dyeType || 'Antique Gold Zari'}</p>
                {item.blouseDetail && (
                  <div className="flex items-center gap-1.5 text-xs font-body text-emerald-700 bg-emerald-50 inline-flex px-2 py-1 rounded-full mb-3">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    {item.blouseDetail}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
                  {/* Quantity */}
                  <div className="flex items-center border border-gray-200 rounded-sm overflow-hidden">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-body text-base transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-body text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-body text-base transition-colors"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="flex items-center gap-1 font-body text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="font-body font-semibold text-maroon-900 text-base">
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">info</span>
            <div>
              <p className="font-body font-semibold text-sm text-amber-800">Visit Our Kamothe Store</p>
              <p className="font-body text-xs text-amber-700 mt-0.5">
                Step into our store at Sector 35, Kamothe, Navi Mumbai. Experience the sarees in person before buying — get ₹500 in-store discount.
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-50 sticky top-24">
            <h2 className="font-heading text-2xl font-semibold text-charcoal mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between font-body text-sm">
                <span className="text-gray-600">Subtotal ({cart.reduce((s, i) => s + i.qty, 0)} items)</span>
                <span className="font-medium text-charcoal">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              {promoApplied && (
                <div className="flex justify-between font-body text-sm">
                  <span className="text-emerald-700">Promo (VIRAASAT10)</span>
                  <span className="font-medium text-emerald-700">−₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between font-body text-sm">
                <span className="text-gray-600">Insured Shipping</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-gray-600">Estimated GST (5%)</span>
                <span className="font-medium text-charcoal">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-body text-sm font-bold">
                <span className="text-charcoal">Total Amount</span>
                <span className="text-maroon-900 text-base">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Promo */}
            <div className="flex gap-2 mb-5">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                placeholder="Promo Code (e.g. VIRAASAT10)"
                className="flex-1 border border-gray-200 rounded-sm px-3 py-2 text-xs font-body focus:outline-none focus:border-maroon-900"
              />
              <button
                onClick={applyPromo}
                className="px-4 py-2 bg-maroon-900 text-white font-body font-semibold text-xs rounded-sm hover:bg-maroon-800 transition-colors"
              >
                Apply
              </button>
            </div>
            {promoError && <p className="font-body text-xs text-red-500 -mt-3 mb-3">{promoError}</p>}
            {promoApplied && <p className="font-body text-xs text-emerald-700 -mt-3 mb-3">✓ 10% discount applied!</p>}

            {/* Checkout CTA */}
            <button className="btn-gold w-full flex items-center justify-center gap-2 py-4">
              <span className="material-symbols-outlined text-base">lock</span>
              Proceed to Secure Checkout
            </button>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: 'local_shipping', label: 'Free Insured Shipping' },
                { icon: 'swap_horiz', label: '7-Day Easy Returns' },
                { icon: 'verified', label: 'Quality Checked' },
              ].map(({ icon, label }) => (
                <div key={label} className="text-center">
                  <span className="material-symbols-outlined text-maroon-900 text-2xl block mb-1">{icon}</span>
                  <p className="font-body text-[10px] text-gray-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Cart;
