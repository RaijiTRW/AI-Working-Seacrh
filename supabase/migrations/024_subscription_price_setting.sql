-- Настройка цены Pro подписки
-- Миграция: 024

-- Добавляем настройку цены Pro подписки
INSERT INTO site_settings (id, value) VALUES
    ('subscription_price', '{"price": 499}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Обновляем существующую настройку скидки чтобы использовать цену из настроек
UPDATE site_settings
SET value = COALESCE(value, '{}'::jsonb) || '{"enabled": false, "discount_percent": 20}'::jsonb
WHERE id = 'first_purchase_discount';
