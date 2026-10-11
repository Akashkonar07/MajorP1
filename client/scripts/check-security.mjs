// Checks the LIVE Supabase project's security rules from the outside,
// exactly like a visitor (and optionally a logged-in customer) would see them.
// Run from client/:  npm run check:security
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in client/.env.local');
  process.exit(1);
}

let pass = 0;
let fail = 0;
const check = (name, ok, info = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '✅' : '❌'} ${name}${info ? `  — ${info}` : ''}`);
};
// "Blocked" = an error, or nothing returned/changed
const blocked = ({ data, error }) => !!error || !data || (Array.isArray(data) && data.length === 0);

const run = async (label, db) => {
  console.log(`\n— ${label} —`);

  const products = await db.from('products').select('code, price');
  check('can browse sarees', products.data?.length >= 1, products.error?.message ?? `${products.data?.length} sarees`);
  const variants = await db.from('product_variants').select('id').limit(1);
  check('can see colours', variants.data?.length === 1, variants.error?.message);
  check('can read services', ((await db.from('services').select('name')).data?.length ?? 0) > 0);
  check("CANNOT read the owner's base prices", blocked(await db.from('product_costs').select('*')));
  check('cannot set a base price', blocked(await db.from('product_costs').insert({ product_id: variants.data?.[0]?.id, base_price: 1 }).select()));
  check('cannot set colour stock directly', blocked(await db.from('product_variants').update({ stock: 99 }).eq('id', variants.data?.[0]?.id).select()));
  const settings = await db.from('settings').select('whatsapp_number');
  check('can read settings', settings.data?.length === 1, settings.error?.message);

  check('cannot add a saree', blocked(await db.from('products').insert({ name: 'Hack', price: 1 }).select()));
  check('cannot edit a saree', blocked(await db.from('products').update({ price: 1 }).eq('code', 'VLS-0001').select()));
  const anyId = variants.data?.[0]?.id ?? null;
  const stock = await db.rpc('adjust_stock', { p_variant_id: anyId, p_change: 5, p_reason: 'new_stock' });
  check('cannot change stock', !!stock.error, stock.error?.message);
  check('cannot change shop stock', !!(await db.rpc('adjust_shop_stock', { p_item_id: anyId, p_change: 5, p_reason: 'received' })).error);
  check('cannot create an order directly', blocked(await db.from('orders')
    .insert({ subtotal: 1, total: 1, shipping_address: {} }).select()));
  check('cannot change settings', blocked(await db.from('settings').update({ upi_id: 'hacker@upi' }).eq('id', 1).select()));
  check('cannot add a shop item', blocked(await db.from('shop_items').insert({ name: 'Hack', selling_price: 1 }).select()));
  for (const t of ['stock_movements', 'admin_activity_log', 'shop_items', 'shop_stock_movements']) {
    check(`cannot read ${t}`, blocked(await db.from(t).select('*')));
  }
  const upload = await db.storage.from('product-images')
    .upload(`security-check-${Date.now()}.png`, new Blob(['x'], { type: 'image/png' }));
  check('cannot upload photos', !!upload.error, upload.error?.message);
};

// 1. Visitor (not logged in)
const visitor = createClient(url, key, { auth: { persistSession: false } });
await run('Visitor (not logged in)', visitor);
for (const t of ['orders', 'profiles', 'addresses']) {
  check(`cannot read ${t}`, blocked(await visitor.from(t).select('*')));
}

// 2. Logged-in customer (optional: needs a TEST customer account in .env.local)
const email = process.env.TEST_CUSTOMER_EMAIL;
const password = process.env.TEST_CUSTOMER_PASSWORD;
if (email && password) {
  const customer = createClient(url, key, { auth: { persistSession: false } });
  const { data: login, error } = await customer.auth.signInWithPassword({ email, password });
  if (error) {
    check('test customer can log in', false, error.message);
  } else {
    await run('Customer (logged in)', customer);
    const me = login.user.id;
    check('cannot make self admin', blocked(await customer.from('profiles').update({ role: 'admin' }).eq('id', me).select()));
    const profiles = await customer.from('profiles').select('id');
    check('sees only own profile', profiles.data?.length === 1 && profiles.data[0].id === me, profiles.error?.message);
    const { data: prof } = await customer.from('profiles').select('role').eq('id', me).single();
    check('is still a customer', prof?.role === 'customer', prof?.role);
  }
} else {
  console.log('\n(Skipping logged-in customer checks: add TEST_CUSTOMER_EMAIL / TEST_CUSTOMER_PASSWORD to .env.local)');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
