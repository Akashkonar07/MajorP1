// Real shop details (from project brief §2). Change them here, not in individual pages.
// In build step 9 these move into the Supabase `settings` table.

// Starts with the shop name so Google Maps finds the exact shop, not just the building
const ADDRESS_LINES = [
  'Vaibhav Laxmi Saree, Shop No. 15,',
  'Soormalhar Apartment Complex, Nirmala CHS,',
  'Sector 36, Kamothe, Mansarovar,',
  'Thane, Panvel, Maharashtra 410209, India',
];

export const SHOP = {
  name: 'Vaibhav Laxmi Saree',
  since: 2016,
  proprietor: 'Mrs. Mamta Bhandari',
  addressLines: ADDRESS_LINES,
  addressShort: 'Shop No. 15, Soormalhar Apartment Complex, Sector 36, Kamothe',
  phoneDisplay: '+91 93200 79225',
  phoneHref: 'tel:+919320079225',
  whatsappHref: 'https://wa.me/919320079225',
  email: 'mamtavaibhavlaxmi@gmail.com',
  hours: '10:00 AM – 10:00 PM',
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_LINES.join(' '))}`,
  mapsEmbedUrl: `https://maps.google.com/maps?q=${encodeURIComponent(ADDRESS_LINES.join(' '))}&output=embed`,
};
