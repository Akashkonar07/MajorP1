import React, { useState } from 'react';

const FAQS = [
  {
    q: 'Do I need an appointment to visit the Kamothe store?',
    a: 'No appointment is needed for walk-in visits. However, for a dedicated styling session with our expert advisors, we recommend booking a private styling appointment to ensure personalised attention.',
  },
  {
    q: 'Are all the sarees in store also available online?',
    a: 'Most of our in-store collection is listed online. However, we often have exclusive walk-in pieces and limited stock items that are only available at the Kamothe store. Visit us for the fullest selection.',
  },
  {
    q: 'Can I request a saree tailoring or blouse stitching at the store?',
    a: 'Yes! We have trusted tailoring partners near our store. Please inquire at the store counter for tailoring packages and turnaround times.',
  },
  {
    q: 'What is the customer support contact for online orders?',
    a: 'For online orders, please reach us at +91 (22) 2743 4441 or via WhatsApp at +91 98765 54321. Our team is available Monday to Saturday, 10:30 AM – 8:00 PM.',
  },
];

const FAQ = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="font-body font-medium text-sm text-charcoal pr-4">{q}</span>
        <span
          className="material-symbols-outlined text-base text-gray-400 shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      {open && (
        <div className="pb-4">
          <p className="font-body text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
};

const StoreLocator = () => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '11:00AM - 12:00PM',
    preference: 'Kanjeevaram Pure Silk',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ name: '', phone: '', date: '', time: '11:00AM - 12:00PM', preference: 'Kanjeevaram Pure Silk', notes: '' });
  };

  return (
    <main>
      {/* HERO */}
      <section
        className="relative flex flex-col md:flex-row min-h-[280px] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #fff8f7 0%, #fce7ed 40%, #fff8f7 100%)' }}
      >
        <div className="flex-1 flex flex-col justify-center px-8 md:px-16 py-12">
          <p className="section-label mb-3">Flagship & Experience Centre</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-charcoal leading-tight mb-4">
            Visit Our Flagship<br />Experience Store<br />
            <span className="text-maroon-900">in Kamothe</span>
          </h1>
          <p className="font-body text-sm text-gray-600 max-w-md leading-relaxed mb-6">
            Step into a sanctuary of generational artistry. Feel the living weight of pure silk sarees, in-person collections of Chanderi and experience personalised styling amidst the timeless elegance of Viraasat.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => document.getElementById('booking-form').scrollIntoView({ behavior: 'smooth' })}
              className="btn-primary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Book Private Styling
            </button>
            <a
              href="https://maps.google.com/?q=Kamothe+Navi+Mumbai"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">map</span>
              View Store Details
            </a>
          </div>
        </div>
        {/* Store image placeholder */}
        <div className="w-full md:w-80 bg-maroon-900 flex items-center justify-center min-h-[220px] shrink-0">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="font-heading font-bold text-white text-3xl">VS</span>
            </div>
            <p className="font-heading text-white text-xl font-semibold">Viraasat</p>
            <p className="font-body text-white/70 text-xs mt-1">Kamothe, Navi Mumbai</p>
          </div>
        </div>
      </section>

      {/* LOCATION & MAP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Info */}
          <div className="bg-white rounded-lg shadow-soft p-7 border border-gray-50">
            <p className="section-label mb-3">Location & Store</p>
            <h2 className="font-heading text-3xl font-semibold text-charcoal mb-6">Viraasat Navi Mumbai</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">location_on</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Address</p>
                  <p className="font-body text-sm text-gray-600 leading-relaxed">
                    Shop 6, Suyash Harmony, Sector 35,<br />Kamothe, Navi Mumbai 410 209
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">schedule</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Store Hours</p>
                  <p className="font-body text-sm text-gray-600">Monday – Sunday: 10:30 AM – 8:00 PM</p>
                  <p className="font-body text-xs text-gray-400 mt-0.5">Appointments recommended for styling sessions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-maroon-900 text-xl shrink-0 mt-0.5">support_agent</span>
                <div>
                  <p className="font-body font-semibold text-sm text-charcoal mb-0.5">Direct Assistance</p>
                  <p className="font-body text-sm text-gray-600">+91 (22) 2743 4441</p>
                  <p className="font-body text-sm text-gray-600">+91 98765 54321</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <a
                href="https://maps.google.com/?q=Sector+35+Kamothe+Navi+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-maroon-900 flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">navigation</span>
                View Parking Instruction
              </a>
              <a
                href="https://maps.google.com/?q=Sector+35+Kamothe+Navi+Mumbai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-xs text-maroon-900 flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Get Directions →
              </a>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden shadow-soft min-h-[320px] bg-blue-50 flex items-center justify-center border border-gray-100">
            <iframe
              title="Viraasat Kamothe Store"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.344!2d73.094!3d18.994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7e8c3b3b3b3b3%3A0x3b3b3b3b3b3b3b3b!2sKamothe%2C%20Navi%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '320px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* APPOINTMENT FORM */}
      <section id="booking-form" className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <p className="section-label mb-2">Personalised Experience</p>
          <h2 className="font-heading text-4xl font-semibold text-charcoal mb-3">
            Book a Private Styling Appointment
          </h2>
          <p className="font-body text-sm text-gray-500">
            Allow our expert stylists to guide you through a curated saree experience — exclusively tailored to your upcoming occasion, wedding, or trousseau selection.
          </p>
        </div>

        {submitted && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <p className="font-body text-sm text-emerald-700 font-medium">
              Appointment confirmed! We'll call you within 24 hours to finalise the details.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-soft p-8 border border-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                className="input-field"
              />
            </div>
            <div>
              <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Phone Number</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 00000 00000"
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Preferred Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Preferred Time Slot</label>
              <div className="relative">
                <select
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  className="input-field appearance-none pr-8"
                >
                  <option>11:00AM - 12:00PM</option>
                  <option>12:00PM - 1:00PM</option>
                  <option>2:00PM - 3:00PM</option>
                  <option>3:00PM - 4:00PM</option>
                  <option>5:00PM - 6:00PM</option>
                  <option>6:00PM - 7:00PM</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-3 text-base text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div>
              <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">Saree Preference</label>
              <div className="relative">
                <select
                  value={form.preference}
                  onChange={e => setForm({ ...form, preference: e.target.value })}
                  className="input-field appearance-none pr-8"
                >
                  <option>Kanjeevaram Pure Silk</option>
                  <option>Banarasi Brocade</option>
                  <option>Chanderi Organza</option>
                  <option>Patola Double Ikat</option>
                  <option>Mixed / Surprise Me</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-3 text-base text-gray-400 pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="font-body font-semibold text-xs text-charcoal uppercase tracking-wide block mb-1.5">
              Special Requests or Occasion Details <span className="text-gray-400 font-normal normal-case tracking-normal">(Optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Tell us about the occasion (e.g. wedding, reception) or specific saree colours you are looking for..."
              rows={4}
              className="input-field resize-none"
            />
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-4">
            <span className="material-symbols-outlined text-base">calendar_month</span>
            Confirm Private Appointment
          </button>
        </form>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-8">
          <p className="section-label mb-2">Help & Support</p>
          <h2 className="font-heading text-4xl font-semibold text-charcoal mb-2">Frequently Asked Questions</h2>
          <p className="font-body text-sm text-gray-500">
            Everything you need to know about visiting the Kamothe boutique and our collection.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-soft p-6 border border-gray-50">
          {FAQS.map(({ q, a }) => <FAQ key={q} q={q} a={a} />)}
        </div>
      </section>
    </main>
  );
};

export default StoreLocator;
