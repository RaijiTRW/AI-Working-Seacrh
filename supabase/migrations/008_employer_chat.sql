-- Чаты между пользователями и работодателями
-- Для откликов на вакансии и переписки

-- Таблица чатов/переписок
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vacancy_id UUID NOT NULL REFERENCES employer_vacancies(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
    last_message_at TIMESTAMPTZ,
    applicant_unread_count INT DEFAULT 0,
    employer_unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Уникальный чат для каждой пары вакансия-соискатель
    UNIQUE(vacancy_id, applicant_id)
);

-- Таблица сообщений (conversation_messages, чтобы не конфликтовать с messages для AI чата)
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_conversations_applicant ON conversations(applicant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_employer ON conversations(employer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vacancy ON conversations(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created ON conversation_messages(created_at DESC);

-- RLS политики
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Пользователи видят только свои чаты
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT
    USING (auth.uid() = applicant_id OR auth.uid() = employer_id);

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE
    USING (auth.uid() = applicant_id OR auth.uid() = employer_id);

-- Пользователи видят только сообщения из своих чатов
CREATE POLICY "Users can view messages in own conversations" ON conversation_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.applicant_id = auth.uid() OR c.employer_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in own conversations" ON conversation_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.applicant_id = auth.uid() OR c.employer_id = auth.uid())
        )
    );

CREATE POLICY "Users can update own messages" ON conversation_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.applicant_id = auth.uid() OR c.employer_id = auth.uid())
        )
    );

-- Триггер для обновления last_message_at и unread counts
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET
        last_message_at = NEW.created_at,
        updated_at = now(),
        -- Увеличиваем счётчик непрочитанных для получателя
        applicant_unread_count = CASE
            WHEN NEW.sender_id = employer_id THEN applicant_unread_count + 1
            ELSE applicant_unread_count
        END,
        employer_unread_count = CASE
            WHEN NEW.sender_id = applicant_id THEN employer_unread_count + 1
            ELSE employer_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON conversation_messages;
CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();
