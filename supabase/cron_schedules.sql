-- Run this in Supabase SQL Editor AFTER deploying all 4 Edge Functions.
-- Requires the pg_cron extension (enable in Supabase → Database → Extensions → pg_cron)

-- 1. Payment reminders — every hour
select cron.schedule(
  'payment-reminder-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/payment-reminder',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'))
  );
  $$
);

-- 2. SLA checker — every hour
select cron.schedule(
  'sla-checker-hourly',
  '30 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/sla-checker',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'))
  );
  $$
);

-- 3. Visit reminders — daily at 6 PM IST (12:30 UTC)
select cron.schedule(
  'visit-reminder-daily',
  '30 12 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/visit-reminder',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'))
  );
  $$
);

-- 4. Expire tokens — every 6 hours
select cron.schedule(
  'expire-tokens-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/expire-tokens',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.supabase_anon_key'))
  );
  $$
);

-- View all scheduled jobs:
-- select * from cron.job;

-- Remove a job (if needed):
-- select cron.unschedule('payment-reminder-hourly');
