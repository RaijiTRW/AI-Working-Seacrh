-- Миграция: Система подписок и лимитов запросов
-- Дата: 2024

-- ===========================================
-- Таблица подписок пользователей
-- ===========================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- План и статус
  plan VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial, pro
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, expired, cancelled

  -- Даты
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,

  -- YooKassa данные
  yookassa_payment_id VARCHAR(100),
  yookassa_subscription_id VARCHAR(100),

  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Один пользователь = одна активная подписка
  UNIQUE(user_id)
);

-- ===========================================
-- Таблица лимитов запросов
-- ===========================================
CREATE TABLE IF NOT EXISTS user_request_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Дневные запросы (сбрасываются каждый день)
  daily_limit INT NOT NULL DEFAULT 3,
  daily_used INT NOT NULL DEFAULT 0,
  daily_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Докупленные запросы (не сгорают, используются после daily)
  bonus_requests INT NOT NULL DEFAULT 0,

  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- ===========================================
-- История платежей
-- ===========================================
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Тип платежа
  type VARCHAR(20) NOT NULL, -- subscription, extra_requests
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',
  status VARCHAR(20) NOT NULL, -- pending, succeeded, failed, refunded

  -- YooKassa данные
  yookassa_payment_id VARCHAR(100),
  yookassa_status VARCHAR(50),

  -- Дополнительные данные
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- Индексы для быстрого поиска
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON user_subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_limits_user ON user_request_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_limits_reset ON user_request_limits(daily_reset_at);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payments_yookassa ON payment_history(yookassa_payment_id);

-- ===========================================
-- RLS политики (Row Level Security)
-- ===========================================
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_request_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои данные
CREATE POLICY "Users can view own subscription" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own limits" ON user_request_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

-- Service role может всё (для backend)
CREATE POLICY "Service role full access subscriptions" ON user_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access limits" ON user_request_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access payments" ON payment_history
  FOR ALL USING (auth.role() = 'service_role');

-- ===========================================
-- Триггер для автоматического создания триала при регистрации
-- ===========================================
CREATE OR REPLACE FUNCTION create_trial_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Создаём триал подписку на 3 дня
  INSERT INTO user_subscriptions (user_id, plan, status, expires_at)
  VALUES (NEW.id, 'trial', 'active', now() + INTERVAL '3 days')
  ON CONFLICT (user_id) DO NOTHING;

  -- Создаём лимиты запросов (3 в день для триала)
  INSERT INTO user_request_limits (user_id, daily_limit, daily_used, daily_reset_at)
  VALUES (NEW.id, 3, 0, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Привязываем триггер к созданию пользователя
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_trial_on_signup();

-- ===========================================
-- Функция для сброса дневных лимитов
-- Вызывается cron-ом каждый день в 00:00
-- ===========================================
CREATE OR REPLACE FUNCTION reset_daily_request_limits()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_request_limits
  SET
    daily_used = 0,
    daily_reset_at = CURRENT_DATE,
    updated_at = now()
  WHERE daily_reset_at < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Функция для проверки истёкших подписок
-- Вызывается cron-ом каждый час
-- ===========================================
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE user_subscriptions
  SET
    status = 'expired',
    updated_at = now()
  WHERE
    status = 'active'
    AND expires_at < now();

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- Вьюха для удобного получения статуса пользователя
-- ===========================================
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT
  u.id as user_id,
  u.email,
  s.plan,
  s.status,
  s.expires_at,
  GREATEST(0, EXTRACT(DAY FROM (s.expires_at - now()))) as days_left,
  l.daily_limit,
  l.daily_used,
  l.bonus_requests,
  (l.daily_used < l.daily_limit OR l.bonus_requests > 0) as can_use_request,
  (s.status = 'expired' OR (s.status = 'active' AND s.expires_at < now())) as is_expired
FROM auth.users u
LEFT JOIN user_subscriptions s ON s.user_id = u.id
LEFT JOIN user_request_limits l ON l.user_id = u.id;

-- Разрешить доступ к вьюхе
GRANT SELECT ON user_subscription_status TO authenticated;
