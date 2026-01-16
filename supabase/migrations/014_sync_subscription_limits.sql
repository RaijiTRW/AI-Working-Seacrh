-- Миграция: Автоматическая синхронизация лимитов при изменении подписки
-- Дата: 2025

-- ===========================================
-- Триггер: при изменении подписки обновлять лимиты
-- ===========================================
CREATE OR REPLACE FUNCTION sync_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
  new_daily_limit INT;
BEGIN
  -- Определяем лимит в зависимости от плана
  IF NEW.plan = 'pro' AND NEW.status = 'active' THEN
    new_daily_limit := 10;
  ELSIF NEW.plan = 'trial' AND NEW.status = 'active' THEN
    new_daily_limit := 3;
  ELSE
    new_daily_limit := 0;
  END IF;

  -- Обновляем или создаём запись в user_request_limits
  INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at, bonus_requests)
  VALUES (NEW.user_id, new_daily_limit, 0, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_limit = new_daily_limit,
    daily_used = 0,
    daily_reset_at = CURRENT_DATE,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscriptions;

-- Создаём триггер на INSERT и UPDATE
CREATE TRIGGER on_subscription_change
  AFTER INSERT OR UPDATE OF plan, status ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_limits();

-- ===========================================
-- Сразу синхронизируем существующие подписки
-- ===========================================
DO $$
DECLARE
  sub RECORD;
  new_limit INT;
BEGIN
  FOR sub IN SELECT * FROM user_subscriptions WHERE status = 'active' LOOP
    IF sub.plan = 'pro' THEN
      new_limit := 10;
    ELSIF sub.plan = 'trial' THEN
      new_limit := 3;
    ELSE
      new_limit := 0;
    END IF;

    INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at, bonus_requests)
    VALUES (sub.user_id, new_limit, 0, CURRENT_DATE, 0)
    ON CONFLICT (user_id) DO UPDATE SET
      daily_limit = new_limit,
      updated_at = now();
  END LOOP;
END $$;
