-- Модерация вакансий работодателей

-- Добавляем поля для модерации
ALTER TABLE employer_vacancies
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS moderation_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_employer_vacancies_pending
ON employer_vacancies(created_at DESC)
WHERE status = 'pending_review';

CREATE INDEX IF NOT EXISTS idx_employer_vacancies_rejected
ON employer_vacancies(created_at DESC)
WHERE status = 'rejected';

COMMENT ON COLUMN employer_vacancies.rejection_reason IS 'Причина отклонения вакансии (от AI или админа)';
COMMENT ON COLUMN employer_vacancies.moderation_checked_at IS 'Время проверки модерацией';
COMMENT ON COLUMN employer_vacancies.moderated_by IS 'ID админа, который проверил вручную (NULL = автомодерация)';

-- Статусы: draft, published, closed, pending_review, rejected
