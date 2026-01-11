-- Таблица резюме пользователей
create table if not exists public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  desired_position text,
  desired_salary text,
  skills text,
  about text,
  work_experience jsonb default '[]'::jsonb,
  education jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Индексы
create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- RLS (Row Level Security)
alter table public.resumes enable row level security;

-- Политики для resumes
create policy "Users can view own resume"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can create own resume"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resume"
  on public.resumes for update
  using (auth.uid() = user_id);

create policy "Users can delete own resume"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Триггер для обновления updated_at
drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.handle_updated_at();
