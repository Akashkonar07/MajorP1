-- Make an EXISTING login an admin (project brief §9.3).
-- 1. First create the user: Supabase → Authentication → Users → Add user → Create new user
--    (strong password, tick "Auto Confirm User").
-- 2. Put that user's email below and run this in SQL Editor.
-- This is NOT a migration: run it by hand only for trusted people.

update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'PUT-EMAIL-HERE@example.com');

-- Check: should list every admin
select p.role, u.email, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
