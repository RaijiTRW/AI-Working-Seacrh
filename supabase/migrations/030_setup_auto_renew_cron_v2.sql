-- Настройка автоматического продления подписок через pg_cron
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- 1. Включаем расширение pg_cron (если ещё не включено)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Удаляем старый cron job если существует
SELECT cron.unschedule('auto-renew-subscriptions');

-- 3. Создаём cron job для ежедневного продления подписок
-- Запускается каждый день в 00:00 по времени UTC
SELECT cron.schedule(
  'auto-renew-subscriptions',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://pakzojxyudiiztniqayd.supabase.co/functions/v1/auto-renew-subscriptions',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer jobseacrhsecretkey123"}'::jsonb,
      timeout_milliseconds := 30000
    );
  $$
);

-- 4. Проверяем что cron job создан успешно
SELECT * FROM cron.job WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'auto-renew-subscriptions'
);

-- Результат должен показать:
-- jobid | jobname                | schedule    | command
-- ------|-----------------------|-------------|--------
-- ...   | auto-renew-subscriptions | 0 0 * * *  | ...

-- Для отладки можно временно запускать чаще (например, каждую минуту):
-- SELECT cron.unschedule('auto-renew-subscriptions');
-- SELECT cron.schedule('auto-renew-subscriptions', '* * * * *', $$ ... $$);

-- Удаление cron job (если нужно):
-- SELECT cron.unschedule('auto-renew-subscriptions');
