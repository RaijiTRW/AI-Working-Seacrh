-- Добавляем поле для отслеживания модерации в vacancies_storage
ALTER TABLE vacancies_storage 
ADD COLUMN IF NOT EXISTS moderation_checked_at TIMESTAMPTZ;

-- Индекс для быстрого поиска непроверенных вакансий
CREATE INDEX IF NOT EXISTS idx_vacancies_moderation 
ON vacancies_storage(moderation_checked_at) 
WHERE is_active = true AND moderation_checked_at IS NULL;

-- Индекс для новых вакансий
CREATE INDEX IF NOT EXISTS idx_vacancies_recent 
ON vacancies_storage(created_at DESC) 
WHERE is_active = true;

COMMENT ON COLUMN vacancies_storage.moderation_checked_at IS 'Время последней проверки модерацией (NULL = не проверялась)';
