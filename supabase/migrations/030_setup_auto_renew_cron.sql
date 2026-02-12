-- Настройка автоматического продления подписок через pg_cron
-- Выполни этот SQL в Supabase Dashboard → SQL Editor

-- 1. Включаем расширение pg_cron (если ещё не включено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Добавляем cron job для автоматического продления
-- ДЛЯ ТЕСТИРОВАНИЯ: каждую минуту
-- ДЛЯ ПРОДА: '* * * * *' (каждую минуту) или '*/5 * * * *' (каждые 5 минут)
-- Вызывает Supabase Edge Function через HTTP

-- Сначала удалим если уже существует
SELECT cron.schedule(
  'auto-renew-subscriptions',
  '* * * * *', -- каждую минуту (для тестирования, измени на '*/5 * * * *' для продакшена)
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
