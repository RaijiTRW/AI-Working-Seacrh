-- Добавляем email соискателя в таблицу разговоров для отображения
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS applicant_email TEXT;

-- Обновляем существующие разговоры (получаем email из auth.users)
-- Это нужно запустить вручную, т.к. нужен доступ к auth.users
