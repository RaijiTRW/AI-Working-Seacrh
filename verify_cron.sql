-- Проверка состояния cron job
SELECT * FROM cron.job;

-- Если auto-renew-subscriptions отсутствует, выполнить:
-- SELECT cron.schedule(
--   'auto-renew-subscriptions',
--   '0 0 * * *',
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://pakzojxyudiiztniqayd.supabase.co/functions/v1/auto-renew-subscriptions',
--       headers := '{"Content-Type": "application/json", "Authorization": "Bearer jobseacrhsecretkey123"}'::jsonb,
--       timeout_milliseconds := 30000
--     );
--   $$
-- );
