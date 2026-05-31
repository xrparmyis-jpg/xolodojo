-- Fix table privileges for Supabase API roles.
-- Run once in Supabase Dashboard → SQL Editor if you see:
--   permission denied for table user_pins (42501)
--
-- The API server uses SUPABASE_SERVICE_ROLE_KEY; that role needs explicit
-- GRANTs on app tables (RLS alone is not enough without privileges).

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;

grant select on all tables in schema public to anon, authenticated;

alter default privileges in schema public
  grant all on tables to postgres, service_role;

alter default privileges in schema public
  grant all on sequences to postgres, service_role;

alter default privileges in schema public
  grant all on routines to postgres, service_role;

alter default privileges in schema public
  grant select on tables to anon, authenticated;

-- Explicit grants for app tables (safe to re-run).
grant all on table public.profiles to service_role;
grant all on table public.wallet_sessions to service_role;
grant all on table public.user_wallets to service_role;
grant all on table public.user_pins to service_role;
grant all on table public.globe_pin_bookmarks to service_role;

grant select on table public.profiles to anon, authenticated;
grant select on table public.user_pins to anon, authenticated;

grant execute on function public.set_updated_at() to service_role;
grant execute on function public.handle_new_user() to service_role;
