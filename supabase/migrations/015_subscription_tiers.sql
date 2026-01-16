-- Миграция: Новая система подписок (Pro Trial / Base / Pro)
-- Дата: 2025
--
-- Изменения:
-- - trial → pro_trial (7 дней, 15 запросов/день, полный доступ)
-- - Новый план base (бесплатно навсегда, 3 запроса/день, только лента)
-- - pro остаётся (799₽/мес, 15 запросов/день, полный доступ)
-- - Добавлено поле can_search_online

-- ===========================================
-- 1. Добавить поле can_search_online
-- ===========================================
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS can_search_online BOOLEAN DEFAULT true;

-- ===========================================
-- 2. Обновить существующие trial → pro_trial
-- ===========================================
UPDATE user_subscriptions
SET plan = 'pro_trial'
WHERE plan = 'trial' AND status = 'active';

-- Истёкшие trial → base
UPDATE user_subscriptions
SET
  plan = 'base',
  status = 'active',
  can_search_online = false,
  expires_at = NULL
WHERE plan = 'trial' AND status = 'expired';

-- Обновить истёкшие trial которые ещё не обновлены
UPDATE user_subscriptions
SET
  plan = 'base',
  status = 'active',
  can_search_online = false,
  expires_at = NULL
WHERE plan = 'trial' AND expires_at < now();

-- ===========================================
-- 3. Обновить функцию синхронизации лимитов
-- ===========================================
CREATE OR REPLACE FUNCTION sync_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
  new_daily_limit INT;
  new_can_search_online BOOLEAN;
BEGIN
  -- Определяем лимиты по плану
  IF NEW.plan = 'pro' AND NEW.status = 'active' THEN
    new_daily_limit := 15;
    new_can_search_online := true;
  ELSIF NEW.plan = 'pro_trial' AND NEW.status = 'active' THEN
    new_daily_limit := 15;
    new_can_search_online := true;
  ELSIF NEW.plan = 'base' THEN
    -- Base план: 3 запроса, только лента (без поиска в сети)
    new_daily_limit := 3;
    new_can_search_online := false;
  ELSE
    -- Fallback для неизвестных планов
    new_daily_limit := 3;
    new_can_search_online := false;
  END IF;

  -- Обновляем или создаём запись в user_request_limits
  INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at, bonus_requests)
  VALUES (NEW.user_id, new_daily_limit, 0, CURRENT_DATE, 0)
  ON CONFLICT (user_id) DO UPDATE SET
    daily_limit = new_daily_limit,
    updated_at = now();

  -- Обновить can_search_online в подписке
  NEW.can_search_online := new_can_search_online;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Пересоздаём триггер
DROP TRIGGER IF EXISTS on_subscription_change ON user_subscriptions;
CREATE TRIGGER on_subscription_change
  BEFORE INSERT OR UPDATE OF plan, status ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_subscription_limits();

-- ===========================================
-- 4. Обновить функцию создания триала при регистрации
-- ===========================================
CREATE OR REPLACE FUNCTION create_trial_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаём Pro Trial подписку на 7 дней
  INSERT INTO user_subscriptions (user_id, plan, status, expires_at, can_search_online)
  VALUES (NEW.id, 'pro_trial', 'active', now() + INTERVAL '7 days', true)
  ON CONFLICT (user_id) DO NOTHING;

  -- Создаём лимиты запросов (15 в день для Pro Trial)
  INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at)
  VALUES (NEW.id, 15, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 5. Функция автоперехода pro_trial → base при истечении
-- ===========================================
CREATE OR REPLACE FUNCTION check_expired_pro_trials()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Pro Trial истёк → переходим на Base
  UPDATE user_subscriptions
  SET
    plan = 'base',
    status = 'active',
    can_search_online = false,
    expires_at = NULL,
    updated_at = now()
  WHERE plan = 'pro_trial'
    AND expires_at < now()
    AND status = 'active';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  -- Также обновляем лимиты для этих пользователей
  UPDATE user_request_limits l
  SET
    daily_limit = 3,
    updated_at = now()
  FROM user_subscriptions s
  WHERE s.user_id = l.user_id
    AND s.plan = 'base';

  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновить check_expired_subscriptions чтобы вызывать и check_expired_pro_trials
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
  pro_trial_count INTEGER;
BEGIN
  -- 1. Pro подписки истекли
  UPDATE user_subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'active'
    AND plan = 'pro'
    AND expires_at < now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- 2. Pro Trial истёк → Base
  SELECT check_expired_pro_trials() INTO pro_trial_count;

  RETURN expired_count + pro_trial_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- 6. Обновить вьюху статуса подписки
-- ===========================================
DROP VIEW IF EXISTS user_subscription_status;
CREATE VIEW user_subscription_status AS
SELECT
  u.id as user_id,
  u.email,
  s.plan,
  s.status,
  s.expires_at,
  s.can_search_online,
  CASE
    WHEN s.expires_at IS NULL THEN NULL
    ELSE GREATEST(0, EXTRACT(DAY FROM (s.expires_at - now())))
  END as days_left,
  l.daily_limit,
  l.daily_used,
  l.bonus_requests,
  (l.daily_used < l.daily_limit OR l.bonus_requests > 0) as can_use_request,
  -- Флаги для удобства
  (s.plan = 'pro_trial') as is_pro_trial,
  (s.plan = 'base') as is_base,
  (s.plan = 'pro' AND s.status = 'active') as is_pro,
  -- Pro Trial истёк = сейчас на base после истечения pro_trial
  (s.plan = 'base' AND EXISTS (
    SELECT 1 FROM user_subscriptions prev
    WHERE prev.user_id = s.user_id
    AND prev.plan = 'base'
  )) as is_pro_trial_expired
FROM auth.users u
LEFT JOIN user_subscriptions s ON s.user_id = u.id
LEFT JOIN user_request_limits l ON l.user_id = u.id;

-- Разрешить доступ к вьюхе
GRANT SELECT ON user_subscription_status TO authenticated;

-- ===========================================
-- 7. Синхронизировать существующие подписки
-- ===========================================
DO $$
DECLARE
  sub RECORD;
  new_limit INT;
  new_can_online BOOLEAN;
BEGIN
  FOR sub IN SELECT * FROM user_subscriptions LOOP
    IF sub.plan = 'pro' AND sub.status = 'active' THEN
      new_limit := 15;
      new_can_online := true;
    ELSIF sub.plan = 'pro_trial' AND sub.status = 'active' THEN
      new_limit := 15;
      new_can_online := true;
    ELSIF sub.plan = 'base' THEN
      new_limit := 3;
      new_can_online := false;
    ELSE
      new_limit := 3;
      new_can_online := false;
    END IF;

    -- Обновить лимиты
    INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at, bonus_requests)
    VALUES (sub.user_id, new_limit, 0, CURRENT_DATE, 0)
    ON CONFLICT (user_id) DO UPDATE SET
      daily_limit = new_limit,
      updated_at = now();

    -- Обновить can_search_online
    UPDATE user_subscriptions
    SET can_search_online = new_can_online
    WHERE user_id = sub.user_id;
  END LOOP;
END $$;
