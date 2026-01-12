-- Admin System Migration
-- Добавляет роли, баны, настройки сайта

-- 1. Добавляем колонки в profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS can_create_vacancies BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT now();

-- 2. Создаём таблицу настроек сайта
CREATE TABLE IF NOT EXISTS site_settings (
    id VARCHAR(50) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Начальные настройки
INSERT INTO site_settings (id, value) VALUES
    ('registration_enabled', '{"enabled": true}'::jsonb),
    ('chat_enabled', '{"enabled": true}'::jsonb),
    ('vacancies_enabled', '{"enabled": true}'::jsonb),
    ('vacancy_creation_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS для site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Все могут читать настройки
CREATE POLICY "Anyone can read site settings"
ON site_settings FOR SELECT
USING (true);

-- Только админы могут изменять настройки
CREATE POLICY "Admins can update site settings"
ON site_settings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert site settings"
ON site_settings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- 4. Функция для обновления last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_seen_at = now() WHERE user_id = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Индексы
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);

-- 6. Политика для админов видеть всех пользователей
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM profiles AS admin_check
        WHERE admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
);

-- 7. Политика для админов изменять профили
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM profiles AS admin_check
        WHERE admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
);
