-- Добавляем поле для хранения цены покупки подписки
-- Миграция: 029

-- Добавляем колонку для хранения цены, по которой пользователь купил подписку
ALTER TABLE user_subscriptions
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_purchase_price ON user_subscriptions(purchase_price);
