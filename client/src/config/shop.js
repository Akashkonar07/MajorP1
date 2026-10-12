// Real shop details (from project brief §2). Change them here, not in individual pages.
// In build step 9 these move into the Supabase `settings` table.

// Postal address shown on the pages (project brief §2)
const ADDRESS_LINES = [
  'Shop No. 15, Soormalhar Apartment, Sector 36,',
  'Near Shree Mahalaxmi Ladies Tailor, Kamothe,',
  'Navi Mumbai – 410209, Maharashtra',
];

// Used only for map links/embeds: starts with the shop name so Google Maps finds the exact shop
const MAPS_QUERY =
  'Vaibhav Laxmi Saree, Shop No. 15, Soormalhar Apartment Complex, Nirmala CHS, Sector 36, Kamothe, Mansarovar, Thane, Panvel, Maharashtra 410209, India';

export const SHOP = {
  name: 'Vaibhav Laxmi Saree',
  since: 2016,
  proprietor: 'Mrs. Mamta Bhandari',
  addressLines: ADDRESS_LINES,
  addressShort: 'Shop No. 15, Soormalhar Apartment, Sector 36, Kamothe',
  phoneDisplay: '+91 93200 79225',
  phoneHref: 'tel:+919320079225',
  whatsappHref: 'https://wa.me/919320079225',
  email: 'mamtavaibhavlaxmi@gmail.com',
  gstin: '27AQSPM3230A1Z2',
  hours: '10:00 AM – 10:00 PM',
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`,
  mapsEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`,
};

// About page story (project brief §2)
export const ABOUT_STORY =
  'Since 2016, Vaibhav Laxmi Saree has been dressing the women of Kamothe in sarees they love. ' +
  'From everyday cottons and printed sarees to fancy and partywear designs, we keep a saree for every occasion and every budget. ' +
  'Our in-shop tailor completes your look with blouse stitching, fall and pico, so your saree is ready to wear. ' +
  'Now you can shop our collection from anywhere in India.';

// WhatsApp chat with a ready-typed message
export const whatsappWith = text => `${SHOP.whatsappHref}?text=${encodeURIComponent(text)}`;
