-- Настройка количества дополнительных запросов
-- Миграция: 026

-- Добавляем настройку количества дополнительных запросов
INSERT INTO site_settings (id, value) VALUES
    ('extra_requests_count', '{"count": 10}'::jsonb)
ON CONFLICT (id) DO NOTHING;
