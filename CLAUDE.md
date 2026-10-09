# CLAUDE.md — Vaibhav Laxmi Saree: E-Commerce & Inventory Platform

Read this whole file before doing anything. It is the single source of truth for this project.

## 1. Who you are working with
- Team: Yuvrajvarthan Nadar (backend/DB/devops lead), Akash Konar (frontend/UI), Sneha Thevar (UI/docs).
- Final-year B.E. IT major project (SIES GST, Mumbai University), outhouse project for a real shop.
- The team are **beginners**. Explain what you are doing in simple words, keep changes small, and say how to test each change.
- **Deadline: Sem VII demo on Mon 12 / Tue 13 Oct 2026.** Prioritise a working, secure core over extra features.

## 2. The client (use this exact information — never invent shop facts)
- Shop: **Vaibhav Laxmi Saree** (since 2016), proprietor **Mrs. Mamta Bhandari**
- Address: Shop No. 15, Surmalar Building, Sector 36, Near Shree Mahalaxmi Ladies Tailor, Kamothe, Navi Mumbai – 410209, Maharashtra
- Phone / WhatsApp orders: +91 93200 79225 · Email: mamtavaibhavlaxmi@gmail.com
- Prices: roughly ₹200 – ₹3,000. Customers: all age groups.
- Delivery: all over India, delivery charges apply. Payment: **UPI only**.
- Returns and exchanges available. Blouse piece included. Fall/pico service available. In-shop tailor stitches blouses.
- No logo yet. Category list and real product photos are still being collected → use clearly-marked placeholder sarees until then.

## 3. Current code (Akash's starter — keep the design, replace the data layer)
- `client/` — React 19 + Vite + Tailwind 3 + react-router. Pages: Home, Collection, ProductDetail, Cart, Wishlist, StoreLocator. Runs on **port 3000**.
- `server/` — Express serving `server/data/products.json` (12 demo products) on port 5000. **To be retired**: the data moves to Supabase.
- Product images referenced in products.json (`/images/...`) do not exist in the repo.

### Content that MUST be fixed (it is not true for this shop)
- Brand "Viraasat" → **Vaibhav Laxmi Saree** everywhere (title, header, footer, meta).
- Wrong address ("Shop 6, Suyash Harmony, Sector 35") → real address above.
- Remove all **fake customer reviews** and invented claims ("500+ designs", "120+ brands", "₹500 off in-store", "Silk Mark", "Complimentary insured shipping"). Never add fake reviews, ratings or testimonials.
- Demo prices of ₹24,000–₹93,000 → realistic ₹200–₹3,000 placeholders.

## 4. Design system (keep Akash's look — also use it for the admin panel)
- Colours (from `client/tailwind.config.js`): maroon-900 `#5d0325` primary, gold-700 `#755b00` accent, cream `#fff8f7` background, charcoal `#2d1f1f` text.
- Fonts: headings Cormorant Garamond (serif), body Poppins. Icons: Material Symbols Outlined.
- Reuse existing classes (`btn-primary`, `btn-secondary`, `btn-gold`, `shadow-card`, etc.). Mobile-first: the owner uses her phone.

## 5. Target stack (decided)
- Frontend: existing React + Vite + Tailwind (no rewrite).
- Backend: **Supabase** = PostgreSQL database + Auth + Storage (product photos) + Row Level Security. Free tier.
- Sensitive logic (placing orders, prices, stock) runs in **Postgres functions (RPC)**, not in the browser.
- Hosting: Vercel (frontend). No separate Node server needed.
- Env vars in `client/.env.local`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The anon key is public by design; security comes from RLS. **The service_role key must never appear in frontend code or Git.**

## 6. Pages
Customer (14): Home, Shop/All Sarees (filters: fabric, colour, occasion, price; sort; search), Category, Saree Detail (photos, price, fabric, blouse piece, stock status, fall/pico add-on, Add to Cart, **Order on WhatsApp**), Cart, Checkout (address + UPI), Order Confirmation, Login/Sign-up (email + Google), My Account (orders + status, addresses), Wishlist, Tailoring Services, About & Contact, Policies (Shipping, Returns & Exchange, Privacy, Terms), 404.

Admin at `/admin` (10): Admin Login, Dashboard (today's orders, month sales, low-stock, out-of-stock, orders needing action), All Sarees (search, edit, hide/show, quick +/− stock), Add/Edit Saree (photos, name, category, fabric, colour, price, MRP, stock, occasions, blouse piece, auto product code), Stock Register, Orders, Customers, Categories, Settings (shop info, UPI ID, WhatsApp no., delivery charges, home banners), Admin Users & Activity Log.

## 7. Data model (Postgres / Supabase)
- `profiles` (id = auth user id, full_name, phone, role: 'customer' | 'admin', created_at)
- `categories` (id, name, slug, is_active)
- `products` (id, code, name, slug, description, category_id, fabric, color, occasions text[], price, mrp, stock int ≥ 0, low_stock_threshold default 1, blouse_included bool, is_active, created_at, updated_at)
- `product_images` (id, product_id, storage_path, sort_order)
- `orders` (id, order_no, user_id, status, subtotal, addons_total, delivery_charge, total, shipping_address jsonb, upi_utr, payment_status: 'pending' | 'verified' | 'rejected', courier, tracking_no, created_at)
- `order_items` (id, order_id, product_id, name_snapshot, unit_price, qty, addons jsonb)
- `stock_movements` (id, product_id, change int, reason: 'new_stock' | 'online_order' | 'shop_sale' | 'order_cancelled' | 'return' | 'adjustment', note, created_by, created_at)
- `settings` (single row: upi_id, whatsapp_number, delivery_charge_maharashtra, delivery_charge_rest_of_india, fall_pico_price, banners jsonb)
- `admin_activity_log` (id, admin_id, action, entity, entity_id, details jsonb, created_at)

## 8. Business rules
- **Stock**: every change goes through a function that also writes a `stock_movements` row. Never update `products.stock` directly from the client.
- Placing an order **reserves** stock immediately (reason 'online_order'); cancelling/rejecting an order restores it ('order_cancelled'). Stock can never go below 0; if a saree is out of stock it cannot be added to cart or ordered.
- Admin has a **"Sold in shop"** button (−1, reason 'shop_sale') so offline sales keep online stock correct.
- Order status flow: `payment_pending` → `payment_verified` → `packed` → `shipped` (courier + tracking no.) → `delivered`; branches: `cancelled`, `return_requested`, `returned`, `exchange_requested`.
- **UPI payment (no gateway)**: checkout shows UPI QR + `upi://pay?pa=<upi_id>&pn=Vaibhav Laxmi Saree&am=<total>&cu=INR&tn=<order_no>` link. Customer submits the UTR. Admin verifies manually and taps Verify/Reject.
- **Totals are always computed on the server** from DB prices + settings. Never trust prices sent by the browser.

## 9. Security requirements (non-negotiable)
1. RLS enabled on **every** table. Customers read/write only their own orders/profile. Only admins write products, stock, categories, settings, order statuses.
2. Admin check = `profiles.role = 'admin'`, enforced in RLS and inside every admin RPC. Hiding a button is not security.
3. No public way to become admin. Admin accounts are created manually in Supabase and given role 'admin' by SQL.
4. Supabase Auth handles password hashing and login rate limiting. Require strong admin passwords.
5. Validate every form (client with zod, server via constraints/RPC checks).
6. Uploads: only jpg/png/webp, max 5 MB, compressed in the browser before upload; storage bucket write access = admins only.
7. Every admin write action inserts an `admin_activity_log` row.
8. Secrets only in `.env.local` (already git-ignored). Never commit keys.
9. Admin "Export data" (CSV) for backups.

## 10. How to work (rules for Claude)
- Work on a git branch (e.g. `dev` or `feature/...`), never directly on `main`.
- One feature at a time: plan → implement → tell the user how to test → **commit** when it works.
- Do not run `npm audit fix --force`. Do not upgrade major versions without asking.
- Do not delete Akash's components; refactor them to read from Supabase.
- Put SQL (tables, RLS policies, functions, seed data) in `supabase/migrations/*.sql` so it is versioned and repeatable.
- When something needs the user to click in the Supabase/Vercel dashboard, give exact step-by-step instructions.

## 11. Build order (Sem VII)
- [ ] 1. Content fixes (§3) + placeholder products at realistic prices
- [ ] 2. Supabase setup: schema, RLS, storage bucket, seed placeholder data
- [ ] 3. Catalogue reads from Supabase (Home, Collection, Product Detail, Wishlist)
- [ ] 4. Auth: customer email + Google login; admin login; route guard for `/admin`
- [ ] 5. Admin: dashboard, sarees list, add/edit saree with photo upload, stock +/−, Sold-in-shop, stock register
- [ ] 6. Cart → checkout (address, delivery charge, fall/pico add-on) → `place_order` RPC → UPI + UTR → confirmation
- [ ] 7. Admin orders: verify payment, status updates, courier/tracking; customer My Account shows status
- [ ] 8. Order on WhatsApp button, About/Contact, Services, Policies, 404
- [ ] 9. Settings, categories, activity log, CSV export
- [ ] 10. Deploy to Vercel, test on mobile, demo rehearsal

## 12. Later (Sem VIII — do NOT start now)
AI layer: auto-tagging from a photo (CLIP), shop-by-photo visual search, explainable recommendations, multilingual descriptions (EN/HI/MR), demand insights from real order data; research paper.
