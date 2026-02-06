-- Добавляем поле для сохранения платёжного метода YooKassa
-- Миграция: 027

-- Добавляем колонку для хранения YooKassa payment_method_id
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS yookassa_payment_method_id TEXT;

-- Добавляем индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS profiles_yookassa_payment_method_id_idx
ON profiles(yookassa_payment_method_id);
