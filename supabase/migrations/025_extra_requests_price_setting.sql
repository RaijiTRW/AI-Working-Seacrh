-- Настройка цены дополнительных запросов
-- Миграция: 025

-- Добавляем настройку цены дополнительных запросов
INSERT INTO site_settings (id, value) VALUES
    ('extra_requests_price', '{"price": 99}'::jsonb)
ON CONFLICT (id) DO NOTHING;
