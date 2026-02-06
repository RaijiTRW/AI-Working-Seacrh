-- Настройка автоматического продления подписок через pg_cron
-- Выполни этот SQL в Supabase Dashboard → SQL Editor

-- 1. Включаем расширение pg_cron (если ещё не включено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Добавляем cron job для автоматического продления
-- Запускается каждый день в 00:00 UTC (03:00 Москва)
-- Вызывает Supabase Edge Function через HTTP

-- Сначала удалим если уже существует
SELECT cron.schedule(
  'auto-renew-subscriptions',
  '0 0 * * *', -- каждый день в 00:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT.supabase.co/functions/v1/auto-renew-subscriptions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);

-- 3. Проверить все cron jobs
SELECT * FROM cron.job;

-- 4. Удалить cron job (если нужно)
-- SELECT cron.unschedule('auto-renew-subscriptions');

-- ВАЖНО: Замени в запросе выше:
-- - YOUR_PROJECT - на твой проект Supabase
-- - YOUR_CRON_SECRET - на твой секрет из переменной окружения
