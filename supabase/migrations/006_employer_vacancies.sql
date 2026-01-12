-- Таблица для вакансий от работодателей (создаются на платформе)
CREATE TABLE employer_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Основное
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  city TEXT NOT NULL,

  -- Зарплата
  salary_from INTEGER,
  salary_to INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'RUB',

  -- Условия
  experience TEXT,              -- no_experience, 1-3, 3-6, 6+
  employment_type TEXT,         -- full, part, remote
  schedule TEXT,                -- full_day, flexible, shift

  -- Описание
  description TEXT NOT NULL,
  requirements TEXT,
  conditions TEXT,

  -- Контакты
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,

  -- Статус
  status VARCHAR(20) DEFAULT 'draft',  -- draft, published, closed
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  responses_count INTEGER DEFAULT 0,

  -- Даты
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- Индексы
CREATE INDEX idx_employer_vacancies_user_id ON employer_vacancies(user_id);
CREATE INDEX idx_employer_vacancies_status ON employer_vacancies(status);
CREATE INDEX idx_employer_vacancies_city ON employer_vacancies(city);
CREATE INDEX idx_employer_vacancies_is_active ON employer_vacancies(is_active);
CREATE INDEX idx_employer_vacancies_created_at ON employer_vacancies(created_at DESC);
CREATE INDEX idx_employer_vacancies_published_at ON employer_vacancies(published_at DESC);

-- Полнотекстовый поиск
CREATE INDEX idx_employer_vacancies_title_search ON employer_vacancies
  USING gin(to_tsvector('russian', title));
CREATE INDEX idx_employer_vacancies_description_search ON employer_vacancies
  USING gin(to_tsvector('russian', description));

-- Триггер для updated_at
CREATE OR REPLACE FUNCTION update_employer_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_employer_vacancies_updated_at
  BEFORE UPDATE ON employer_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION update_employer_vacancies_updated_at();

-- RLS (Row Level Security)
ALTER TABLE employer_vacancies ENABLE ROW LEVEL SECURITY;

-- Политики безопасности
-- Все могут читать опубликованные активные вакансии
CREATE POLICY "Public can view published vacancies"
  ON employer_vacancies
  FOR SELECT
  USING (status = 'published' AND is_active = true);

-- Авторизованные пользователи видят свои вакансии
CREATE POLICY "Users can view own vacancies"
  ON employer_vacancies
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Авторизованные пользователи могут создавать вакансии
CREATE POLICY "Users can create vacancies"
  ON employer_vacancies
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Пользователи могут редактировать свои вакансии
CREATE POLICY "Users can update own vacancies"
  ON employer_vacancies
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Пользователи могут удалять свои вакансии
CREATE POLICY "Users can delete own vacancies"
  ON employer_vacancies
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
