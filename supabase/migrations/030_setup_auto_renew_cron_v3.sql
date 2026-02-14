-- Setup auto-renewal cron job (every 6 hours, max 2 retry attempts)
-- Execute in Supabase Dashboard -> SQL Editor

-- 1. Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create renewal_attempts table for tracking retries
CREATE TABLE IF NOT EXISTS renewal_attempts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  retry_count INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_renewal_attempts_user ON renewal_attempts(user_id);

-- 3. Remove old cron job if exists
SELECT cron.unschedule('auto-renew-subscriptions');

-- 4. Create cron job - runs every 6 hours
SELECT cron.schedule(
  'auto-renew-subscriptions',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://pakzojxyudiiztniqayd.supabase.co/functions/v1/auto-renew-subscriptions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer jobseacrhsecretkey123"}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);

-- 5. Verify cron job created
SELECT * FROM cron.job WHERE jobname = 'auto-renew-subscriptions';
