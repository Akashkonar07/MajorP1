import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { SHOP } from '../config/shop';
import { AVAILABILITY_NOTE } from '../lib/catalogue';

const Cart = () => {
  const { cart, removeFromCart, updateQty, cartTotal } = useCart();
  const navigate = useNavigate();
  // Delivery charge and final total are calculated on the server at checkout

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
              {/* Photo */}
              <Link to={`/product/${item.slug}?colour=${encodeURIComponent(item.colorName ?? '')}`} className="w-24 h-28 rounded shrink-0 overflow-hidden bg-maroon-50">
                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-semibold text-base text-charcoal leading-tight mb-1">{item.name}</h3>
                <p className="font-body text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  {item.colorHex && <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.colorHex }} />}
                  Colour: {item.colorName}
                </p>

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
                      disabled={item.qty >= 10}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 font-body text-base transition-colors disabled:opacity-30"
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

          <p className="flex items-start gap-2 font-body text-xs text-gray-500">
            <span className="material-symbols-outlined text-sm text-gold-700">info</span>
            {AVAILABILITY_NOTE}
          </p>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-amber-700 text-xl shrink-0">info</span>
            <div>
              <p className="font-body font-semibold text-sm text-amber-800">Visit Our Kamothe Shop</p>
              <p className="font-body text-xs text-amber-700 mt-0.5">
                See the sarees in person at {SHOP.addressShort}. Open {SHOP.hours}.
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
              <div className="flex justify-between font-body text-sm">
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-gray-500">Calculated at checkout</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between font-body text-sm font-bold">
                <span className="text-charcoal">Total (before delivery)</span>
                <span className="text-maroon-900 text-base">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button onClick={() => navigate('/checkout')} className="btn-gold w-full flex items-center justify-center gap-2 py-4">
              <span className="material-symbols-outlined text-base">lock</span>
              Proceed to Secure Checkout
            </button>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: 'local_shipping', label: 'Delivery All Over India' },
                { icon: 'swap_horiz', label: 'Returns & Exchange' },
                { icon: 'currency_rupee', label: 'UPI Payment' },
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
