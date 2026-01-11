-- Таблица для хранения вакансий (парсинг каждые 2 часа)
CREATE TABLE vacancies_storage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(20) NOT NULL,        -- hh, avito, superjob
  source_id VARCHAR(100) NOT NULL,    -- ID на площадке
  title TEXT NOT NULL,
  company TEXT,
  salary_from INTEGER,
  salary_to INTEGER,
  city TEXT,
  experience TEXT,
  employment_type TEXT,
  description TEXT,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(source, source_id)           -- Дедупликация по источнику + ID
);

-- Индексы для быстрого поиска
CREATE INDEX idx_vacancies_source ON vacancies_storage(source);
CREATE INDEX idx_vacancies_city ON vacancies_storage(city);
CREATE INDEX idx_vacancies_active ON vacancies_storage(is_active);
CREATE INDEX idx_vacancies_created ON vacancies_storage(created_at DESC);
CREATE INDEX idx_vacancies_last_checked ON vacancies_storage(last_checked_at ASC NULLS FIRST);

-- Full-text search по заголовку и описанию
CREATE INDEX idx_vacancies_title_search ON vacancies_storage USING gin(to_tsvector('russian', title));
CREATE INDEX idx_vacancies_description_search ON vacancies_storage USING gin(to_tsvector('russian', COALESCE(description, '')));

-- RLS (Row Level Security) - публичный доступ на чтение
ALTER TABLE vacancies_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active vacancies"
  ON vacancies_storage
  FOR SELECT
  USING (is_active = true);

-- Функция для автообновления updated_at
CREATE OR REPLACE FUNCTION update_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vacancies_storage_updated_at
  BEFORE UPDATE ON vacancies_storage
  FOR EACH ROW
  EXECUTE FUNCTION update_vacancies_updated_at();
