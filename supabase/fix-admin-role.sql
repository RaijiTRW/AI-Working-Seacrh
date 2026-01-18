-- Проверка и исправление роли администратора
-- Выполни этот скрипт в Supabase SQL Editor

-- 1. Показать всех пользователей и их роли
SELECT
  user_id,
  email,
  role,
  is_banned,
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Найти твой профиль (замени на свой email)
-- SELECT * FROM profiles WHERE email = 'твой_email@example.com';

-- 3. Установить роль admin для своего пользователя (замени user_id)
-- UPDATE profiles
-- SET role = 'admin'
-- WHERE user_id = 'твой_user_id_из_шага_1';

-- 4. Проверить что роль обновилась
-- SELECT user_id, email, role FROM profiles WHERE role = 'admin';

-- ВАЖНО: После выполнения перезайди в приложение (выход + вход)
