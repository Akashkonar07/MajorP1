-- =====================================================================
-- 006_lock_trigger_functions.sql — clears 4 Security Advisor warnings
-- These two functions only run automatically as triggers (on sign-up and
-- on admin changes). Nobody needs to call them through the API, so remove
-- that permission. Triggers still fire normally after this.
--
-- NOTE for future migrations: Supabase still gives anon/authenticated EXECUTE on
-- new functions (the default-privilege change in 002 does not override that), so
-- every new function must be revoked/granted explicitly in its own migration.
-- =====================================================================

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.audit_admin_change() from public, anon, authenticated;
