# client — website and admin panel

React 19 + Vite + Tailwind. See the [main README](../README.md) for the full project.

```bash
cp .env.example .env.local   # Supabase URL + publishable (anon) key
npm install
npm run dev                  # http://localhost:3000  (admin: /admin/login)
npm run build                # production build in dist/
npm run lint                 # oxlint
npm run check:security       # tests the live Supabase security rules
```

- `src/pages/` — customer pages · `src/pages/admin/` — admin pages
- `src/lib/` — all Supabase calls (`catalogue.js`, `orders.js`, `admin.js`, `adminOrders.js`) and form rules (`validation.js`)
- `src/context/` — login, bag and wishlist state
- `src/config/shop.js` — shop address, phone and hours in one place
