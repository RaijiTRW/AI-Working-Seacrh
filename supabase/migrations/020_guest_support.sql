-- Поддержка неавторизованных пользователей (гостей) в чате поддержки
-- Гости будут идентифицироваться через guest_id формата 'guest_xxxxx'

-- 1. Сделать user_id nullable в support_chats
ALTER TABLE support_chats
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Добавить колонку для хранения guest_id (опционально, для удобства)
ALTER TABLE support_chats
  ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- 3. Индекс для быстрого поиска по guest_id
CREATE INDEX idx_support_chats_guest_id ON support_chats(guest_id) WHERE guest_id IS NOT NULL;

-- 4. Индекс для поиска по user_id ИЛИ guest_id (для гостей user_id будет NULL)
-- Дополнительно существующий idx_support_chats_user уже будет работать

-- 5. Обновить RLS политики для поддержки гостей

-- Удалить старые политики
DROP POLICY IF EXISTS "Users view own support chats" ON support_chats;
DROP POLICY IF EXISTS "Users create support chats" ON support_chats;
DROP POLICY IF EXISTS "Users update own support chats" ON support_chats;
DROP POLICY IF EXISTS "Users view own support messages" ON support_messages;
DROP POLICY IF EXISTS "Users send support messages" ON support_messages;

-- Создать новые политики которые работают с user_id И guest_id

-- Авторизованные пользователи видят свои чаты
CREATE POLICY "Users view own support chats" ON support_chats
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Админы видят все чаты (включая гостевые)
CREATE POLICY "Admins view all support chats" ON support_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Пользователи могут создавать чаты
CREATE POLICY "Users create support chats" ON support_chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Гости могут создавать чаты (через API, не напрямую)
-- Эта политика не применяется для гостей, они работают через service role

-- Пользователи могут обновлять свои чаты (для рейтинга)
CREATE POLICY "Users update own support chats" ON support_chats
  FOR UPDATE USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Пользователи видят сообщения своих чатов
CREATE POLICY "Users view own support messages" ON support_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    chat_id IN (
      SELECT id FROM support_chats
      WHERE user_id = auth.uid() OR (user_id IS NULL AND guest_id IS NOT NULL)
    )
  );

-- Пользователи могут отправлять сообщения в свои чаты
CREATE POLICY "Users send support messages" ON support_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    sender_type = 'user' AND
    chat_id IN (SELECT id FROM support_chats WHERE user_id = auth.uid())
  );

-- 6. Добавить комментарий для документации
COMMENT ON COLUMN support_chats.user_id IS 'UUID авторизованного пользователя (NULL для гостей)';
COMMENT ON COLUMN support_chats.guest_id IS 'ID гостя формата guest_xxxxx (заполняется если user_id NULL)';
