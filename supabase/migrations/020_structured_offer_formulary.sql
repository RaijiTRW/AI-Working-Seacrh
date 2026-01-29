-- Миграция: Переход к структурированному оффер-формуляру вакансий
-- Добавляет детализированные поля для зарплаты, договора, графика и других условий

-- === 1. Детали зарплаты (salary_details) ===

-- Тип зарплаты: fix (фикс), range (вилка), bonuses (только бонусы), kpi (только kpi)
ALTER TABLE employer_vacancies
ADD COLUMN salary_type VARCHAR(20) DEFAULT 'range'
CHECK (salary_type IN ('fix', 'range', 'bonuses', 'kpi'));

-- Gross/Net: gross, net
ALTER TABLE employer_vacancies
ADD COLUMN salary_tax_type VARCHAR(10) DEFAULT 'net'
CHECK (salary_tax_type IN ('gross', 'net'));

-- Периодичность выплат
ALTER TABLE employer_vacancies
ADD COLUMN salary_period VARCHAR(20) DEFAULT 'month'
CHECK (salary_period IN ('month', 'week', 'day', 'hour', 'shift', 'project'));

-- Бонусы (отдельное поле, JSONB для гибкости)
ALTER TABLE employer_vacancies
ADD COLUMN salary_bonuses JSONB DEFAULT '{"enabled": false}'
CHECK (jsonb_typeof(salary_bonuses) = 'object');

-- KPI (отдельное поле, JSONB)
ALTER TABLE employer_vacancies
ADD COLUMN salary_kpi JSONB DEFAULT '{"enabled": false}'
CHECK (jsonb_typeof(salary_kpi) = 'object');

-- === 2. Тип договора (contract_type) ===

ALTER TABLE employer_vacancies
ADD COLUMN contract_type VARCHAR(20) DEFAULT 'labor_rf'
CHECK (contract_type IN ('labor_rf', 'gph', 'ip', 'self_employed'));

-- Комментарий к договору
ALTER TABLE employer_vacancies
ADD COLUMN contract_comment TEXT;

-- === 3. Детали графика (schedule_details) ===

-- Рабочий формат: office, remote, hybrid
ALTER TABLE employer_vacancies
ADD COLUMN work_format VARCHAR(20) DEFAULT 'office'
CHECK (work_format IN ('office', 'remote', 'hybrid'));

-- Часы работы (JSONB: {from: "9:00", to: "18:00"} или {hours: 8})
ALTER TABLE employer_vacancies
ADD COLUMN work_hours JSONB DEFAULT '{"hours": 8, "type": "per_day"}'
CHECK (jsonb_typeof(work_hours) = 'object');

-- Переработки: paid (оплачиваются), unpaid (не оплачиваются), negotiable (по договорённости)
ALTER TABLE employer_vacancies
ADD COLUMN overtime_policy VARCHAR(20) DEFAULT 'unpaid'
CHECK (overtime_policy IN ('paid', 'unpaid', 'negotiable'));

-- === 4. Испытательный срок (probation_period) ===

-- Длительность в месяцах (0 = нет испытательного срока)
ALTER TABLE employer_vacancies
ADD COLUMN probation_months INTEGER DEFAULT 3
CHECK (probation_months >= 0 AND probation_months <= 12);

-- Снижение ЗП на испытательном (%)
ALTER TABLE employer_vacancies
ADD COLUMN probation_salary_reduction INTEGER DEFAULT 0
CHECK (probation_salary_reduction >= 0 AND probation_salary_reduction <= 50);

-- === 5. Обязанности (responsibilities) ===

-- Структурированный список обязанностей (JSONB массив)
ALTER TABLE employer_vacancies
ADD COLUMN responsibilities JSONB DEFAULT '[]'
CHECK (jsonb_typeof(responsibilities) = 'array');

-- === 6. Технический стек (tech_stack) ===

-- Теги технологий (JSONB массив строк)
ALTER TABLE employer_vacancies
ADD COLUMN tech_stack JSONB DEFAULT '[]'
CHECK (jsonb_typeof(tech_stack) = 'array');

-- === 7. Уровень позиции (grade_level) ===

ALTER TABLE employer_vacancies
ADD COLUMN grade_level VARCHAR(20)
CHECK (grade_level IN ('intern', 'junior', 'middle', 'senior', 'lead', 'principal'));

-- === Индексы для новых полей ===

CREATE INDEX idx_employer_vacancies_salary_type ON employer_vacancies(salary_type);
CREATE INDEX idx_employer_vacancies_contract_type ON employer_vacancies(contract_type);
CREATE INDEX idx_employer_vacancies_work_format ON employer_vacancies(work_format);
CREATE INDEX idx_employer_vacancies_grade_level ON employer_vacancies(grade_level);

-- GIN индексы для JSONB полей
CREATE INDEX idx_employer_vacancies_tech_stack ON employer_vacancies
USING gin(tech_stack);
CREATE INDEX idx_employer_vacancies_responsibilities ON employer_vacancies
USING gin(responsibilities);

-- === Обратная совместимость ===
-- Устанавливаем значения по умолчанию для существующих вакансий

UPDATE employer_vacancies
SET
  salary_type = CASE
    WHEN salary_from IS NOT NULL AND salary_to IS NOT NULL THEN 'range'
    WHEN salary_from IS NOT NULL THEN 'fix'
    ELSE 'fix'
  END,
  salary_tax_type = 'net',
  salary_period = 'month',
  salary_bonuses = '{"enabled": false}'::jsonb,
  salary_kpi = '{"enabled": false}'::jsonb,
  contract_type = 'labor_rf',
  work_format = CASE
    WHEN schedule = 'remote' THEN 'remote'
    ELSE 'office'
  END,
  work_hours = '{"hours": 8, "type": "per_day"}'::jsonb,
  overtime_policy = 'unpaid',
  probation_months = 3,
  probation_salary_reduction = 0,
  responsibilities = '[]'::jsonb,
  tech_stack = '[]'::jsonb,
  grade_level = CASE
    WHEN experience = 'no_experience' THEN 'junior'
    WHEN experience = '1-3' THEN 'junior'
    WHEN experience = '3-6' THEN 'middle'
    WHEN experience = '6+' THEN 'senior'
    ELSE NULL
  END
WHERE created_at < NOW();

-- Комментарий: старые поля salary_from, salary_to, salary_currency,
-- experience, employment_type, schedule, description, requirements, conditions
-- оставляем для обратной совместимости
