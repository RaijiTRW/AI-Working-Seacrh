-- Добавляем поле для хранения платёжного метода в истории платежей
-- Миграция: 028

-- Добавляем колонку для хранения YooKassa payment_method_id
ALTER TABLE payment_history
ADD COLUMN IF NOT EXISTS payment_method_id TEXT;
