-- Run in Supabase SQL Editor AFTER importing MySQL data with explicit IDs.
-- Resets identity sequences so the next auto-generated id won't collide.

select setval(pg_get_serial_sequence('public.users', 'id'), coalesce((select max(id) from public.users), 1), true);
select setval(pg_get_serial_sequence('public.user_profiles', 'id'), coalesce((select max(id) from public.user_profiles), 1), true);
select setval(pg_get_serial_sequence('public.user_wallets', 'id'), coalesce((select max(id) from public.user_wallets), 1), true);
select setval(pg_get_serial_sequence('public.user_pins', 'id'), coalesce((select max(id) from public.user_pins), 1), true);
select setval(pg_get_serial_sequence('public.globe_pin_bookmarks', 'id'), coalesce((select max(id) from public.globe_pin_bookmarks), 1), true);
