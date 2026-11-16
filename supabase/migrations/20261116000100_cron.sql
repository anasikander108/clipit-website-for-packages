-- Scheduled jobs. Needs the pg_cron extension (Dashboard → Database → Extensions → pg_cron) and,
-- for the reminder emails, pg_net. Access checks never wait for these jobs: they compare
-- expires_at with now() directly, so a late run only delays the status label and the emails.
create extension if not exists pg_cron;

select cron.schedule('clipit-expire-subscriptions', '*/5 * * * *', $$ select public.expire_subscriptions(); $$);

-- Daily reminder emails at 10:00 Pakistan time (05:00 UTC). Set the two settings first:
--   select vault.create_secret('https://YOUR-PROJECT.supabase.co', 'project_url');
--   select vault.create_secret('a-long-random-string', 'cron_secret');   -- same value as the CRON_SECRET function secret
-- then run this block once (it is commented out so the migration works before those exist):
--
-- create extension if not exists pg_net;
-- select cron.schedule('clipit-subscription-reminders', '0 5 * * *', $$
--   select net.http_post(
--     url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/subscription-reminders',
--     headers := jsonb_build_object('Content-Type', 'application/json',
--                                   'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--     body := '{}'::jsonb);
-- $$);
