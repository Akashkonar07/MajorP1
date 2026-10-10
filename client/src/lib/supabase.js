import { createClient } from '@supabase/supabase-js';

// Values come from client/.env.local (see client/.env.example).
// The publishable/anon key is public by design — security comes from RLS in the database.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in client/.env.local');
}

export const supabase = createClient(url, key);
