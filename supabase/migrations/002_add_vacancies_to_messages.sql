-- Добавляем колонку для хранения вакансий
alter table public.messages
add column if not exists vacancies jsonb default null;

-- Комментарий
comment on column public.messages.vacancies is 'JSON array of vacancy objects for assistant messages';
