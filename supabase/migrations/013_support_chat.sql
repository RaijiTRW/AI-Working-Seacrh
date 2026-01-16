-- Чаты поддержки (тикеты)
CREATE TABLE IF NOT EXISTS support_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Статус чата
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, closed

  -- Админ который взял чат
  admin_id UUID REFERENCES auth.users(id),

  -- Рейтинг и отзыв (после закрытия)
  rating INT CHECK (rating >= 1 AND rating <= 5),
  feedback_submitted_at TIMESTAMPTZ,

  -- Метаданные
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Сообщения в чате поддержки
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES support_chats(id) ON DELETE CASCADE,

  -- Отправитель: user, admin, ai
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin', 'ai')),
  sender_id UUID REFERENCES auth.users(id), -- NULL для AI

  -- Содержимое
  content TEXT NOT NULL,

  -- Прочитано ли (для уведомлений)
  is_read BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX idx_support_chats_user ON support_chats(user_id);
CREATE INDEX idx_support_chats_status ON support_chats(status);
CREATE INDEX idx_support_chats_admin ON support_chats(admin_id);
CREATE INDEX idx_support_messages_chat ON support_messages(chat_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at);

-- RLS политики
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои чаты
CREATE POLICY "Users view own support chats" ON support_chats
  FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут создавать чаты
CREATE POLICY "Users create support chats" ON support_chats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять свои чаты (для рейтинга)
CREATE POLICY "Users update own support chats" ON support_chats
  FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи видят сообщения своих чатов
CREATE POLICY "Users view own support messages" ON support_messages
  FOR SELECT USING (
    chat_id IN (SELECT id FROM support_chats WHERE user_id = auth.uid())
  );

-- Пользователи могут отправлять сообщения в свои чаты
CREATE POLICY "Users send support messages" ON support_messages
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT id FROM support_chats WHERE user_id = auth.uid())
    AND sender_type = 'user'
  );

-- Быстрые вопросы для AI чата
CREATE TABLE IF NOT EXISTS chat_quick_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(100) NOT NULL,
  prompt TEXT NOT NULL,
  icon VARCHAR(50), -- название иконки
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Базовые быстрые вопросы
INSERT INTO chat_quick_questions (label, prompt, icon, sort_order) VALUES
  ('Как искать вакансии?', 'Расскажи как пользоваться поиском вакансий на этом сайте', 'search', 1),
  ('Как работает AI?', 'Объясни как работает AI-поиск работы на этом сайте', 'sparkles', 2),
  ('Как создать резюме?', 'Помоги мне создать резюме, что нужно указать?', 'document', 3),
  ('Связь с администрацией', 'ADMIN_CONTACT', 'support', 4);

-- RLS для быстрых вопросов (все могут читать)
ALTER TABLE chat_quick_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read quick questions" ON chat_quick_questions
  FOR SELECT USING (true);
