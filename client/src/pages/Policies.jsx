import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatPrice } from '../lib/catalogue';
import { SHOP } from '../config/shop';

// Shipping, payment, returns, cancellation, privacy and terms (project brief §2, §8).
// Wording is kept plain so it can later be translated to Hindi / Marathi.

const SECTIONS = [
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
  { id: 'returns', label: 'Returns & Exchange' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'terms', label: 'Terms' },
];

const Block = ({ id, title, children }) => (
  <section id={id} className="scroll-mt-24 bg-white rounded-lg shadow-soft border border-gray-50 p-5 sm:p-7">
    <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-charcoal mb-4">{title}</h2>
    <div className="font-body text-sm text-gray-700 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">{children}</div>
  </section>
);

const Policies = () => {
  const { hash } = useLocation();
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    supabase.from('settings').select('delivery_zones, extra_saree_delivery_charge').eq('id', 1).single()
      .then(({ data }) => setDelivery(data));
  }, []);

  // Jump to #returns etc. when opened from a link
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, delivery]);

  const whatsapp = <a href={SHOP.whatsappHref} target="_blank" rel="noopener noreferrer" className="text-maroon-900 underline">WhatsApp ({SHOP.phoneDisplay})</a>;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <div>
        <p className="section-label mb-2">Help</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal mb-4">Shop policies</h1>
        <nav className="flex flex-wrap gap-2">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`} className="px-3 py-1.5 rounded-full border border-gray-200 bg-white font-body text-xs hover:border-maroon-900">{s.label}</a>
          ))}
        </nav>
      </div>

      <Block id="shipping" title="Shipping">
        <p>We deliver all over India. We pack every order ourselves and send it by courier / India Post.</p>
        <p className="font-semibold text-charcoal">Delivery charges</p>
        {delivery ? (
          <ul>
            {(delivery.delivery_zones ?? []).map(z => <li key={z.name}>{z.name}: {formatPrice(Number(z.charge))} for the first saree</li>)}
            <li>{formatPrice(Number(delivery.extra_saree_delivery_charge))} for each additional saree in the same order</li>
          </ul>
        ) : <div className="h-16 bg-gray-50 rounded animate-pulse" />}
        <p>The exact charge for your pincode is shown at checkout before you pay.</p>
        <ul>
          <li>Orders are dispatched within <span className="font-semibold">2 working days of payment verification</span>. Fall beading / pico adds 1–2 days.</li>
          <li>Once shipped, the courier name and tracking number appear in <Link to="/account" className="text-maroon-900 underline">My Account → My Orders</Link>.</li>
          <li>Delivery time after dispatch depends on the courier and your location.</li>
        </ul>
      </Block>

      <Block id="payment" title="Payment">
        <ul>
          <li>We accept <span className="font-semibold">UPI</span> (Google Pay, PhonePe, Paytm, BHIM and other UPI apps). Cash on Delivery is not available yet.</li>
          <li>After placing an order, pay the exact amount using the QR code or UPI ID shown on the order page, then enter the 12-digit UTR / UPI reference number.</li>
          <li>We check every payment by hand. Your order status changes to “Payment verified” once it is confirmed.</li>
          <li>Some sarees are confirmed by the shop before dispatch. If a saree you paid for is not available, you get a <span className="font-semibold">full UPI refund</span>.</li>
        </ul>
      </Block>

      <Block id="returns" title="Returns & Exchange">
        <ul>
          <li>Tell us within <span className="font-semibold">48 hours of delivery</span> on {whatsapp}, with an unboxing video and photos.</li>
          <li>Return or exchange within <span className="font-semibold">7 days of delivery</span>.</li>
          <li>The saree must be unused and unwashed, with tags and original packing intact.</li>
          <li>You pay the return shipping, <span className="font-semibold">except</span> when the item is damaged or wrong — then we pay.</li>
          <li>Refunds are sent by UPI within <span className="font-semibold">7 working days</span> after we receive and check the item.</li>
        </ul>
        <p className="font-semibold text-charcoal">Not returnable</p>
        <ul>
          <li>Stitched blouses</li>
          <li>Sarees with fall or pico done</li>
          <li>Sale items</li>
        </ul>
        <p className="text-gray-500">A slight colour difference because of screen or photo lighting is not a defect.</p>
      </Block>

      <Block id="cancellation" title="Cancellation">
        <ul>
          <li>Not paid yet? Cancel the order yourself from <Link to="/account" className="text-maroon-900 underline">My Orders</Link>.</li>
          <li>Already paid? Message us on {whatsapp} — orders can be cancelled for a <span className="font-semibold">full refund before dispatch</span>.</li>
          <li>We may cancel an order if the saree is not available or the payment cannot be found; any amount paid is refunded in full by UPI.</li>
        </ul>
      </Block>

      <Block id="privacy" title="Privacy">
        <p>We collect only what we need to deliver your order:</p>
        <ul>
          <li>Your name, email, mobile number and delivery address</li>
          <li>Your orders and the UPI reference number you enter</li>
        </ul>
        <p>
          <span className="font-semibold text-charcoal">Shopping activity.</span> We record anonymous activity on our own website — which sarees
          are viewed, wishlisted, added to the bag and ordered — with a random id for your browser (and your account id if you are
          logged in). It never contains your name, phone, email or address. We use it only to improve which sarees we show, and we
          never sell or share it.
        </p>
        <ul>
          <li>We use these details only to process and deliver your orders and to contact you about them. Your address and phone are shared with the courier for delivery only.</li>
          <li>We never sell or share your details for advertising. We do not use advertising or tracking cookies.</li>
          <li>Passwords are handled by our secure login provider; we never see them. Your bag and wishlist are saved only on your own device.</li>
          <li>To see, correct or delete your details, edit them in My Account or email us at <a href={`mailto:${SHOP.email}`} className="text-maroon-900 underline">{SHOP.email}</a>.</li>
        </ul>
      </Block>

      <Block id="terms" title="Terms of use">
        <ul>
          <li>This website is run by {SHOP.name}, {SHOP.addressLines.join(' ')} (GSTIN {SHOP.gstin}).</li>
          <li>Prices are in Indian Rupees. The amount you pay is the total shown when you place the order.</li>
          <li>Colours in photos may look slightly different on different screens.</li>
          <li>An order is confirmed once we verify your payment. If there is a mistake in a price or a saree is unavailable, we will contact you and refund any payment in full.</li>
          <li>For any question, call or WhatsApp us on {SHOP.phoneDisplay} ({SHOP.hours}).</li>
        </ul>
      </Block>
    </main>
  );
};

export default Policies;
