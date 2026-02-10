-- Таблица для логирования использования AI
create table if not exists public.ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  field text not null,
  text_length integer not null,
  improved_length integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Индекс для быстрых запросов
create index if not exists ai_usage_logs_user_id_idx on public.ai_usage_logs(user_id);
create index if not exists ai_usage_logs_created_at_idx on public.ai_usage_logs(created_at);

-- RLS
alter table public.ai_usage_logs enable row level security;

-- Политики RLS
create policy "Users can view own AI logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI logs"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);

create policy "Service role can view all AI logs"
  on public.ai_usage_logs for select
  to service_role
  using (true);
