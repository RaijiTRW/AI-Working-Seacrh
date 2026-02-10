-- Миграция для Resume Builder
-- Добавляет новые колонки для конструктора резюме

-- Добавляем новые колонки в существующую таблицу resumes
alter table public.resumes
  add column if not exists personal_info jsonb default '{}'::jsonb,
  add column if not exists contacts jsonb default '{}'::jsonb,
  add column if not exists languages jsonb default '[]'::jsonb,
  add column if not exists achievements jsonb default '[]'::jsonb,
  add column if not exists template_id text default 'modern',
  add column if not exists guest_id text unique,
  add column if not exists ats_score integer,
  add column if not exists is_published boolean default false,
  add column if not exists published_url text unique;

-- Индекс для guest resumes
create index if not exists resumes_guest_id_idx on public.resumes(guest_id);
create index if not exists resumes_template_id_idx on public.resumes(template_id);
create index if not exists resumes_published_url_idx on public.resumes(published_url);

-- Обновляем RLS политики для guest режима
drop policy if exists "Users can view own resume" on public.resumes;
create policy "Users can view own resume"
  on public.resumes for select
  using (auth.uid() = user_id OR guest_id = current_setting('request.jwt.claim.guest_id', true));

drop policy if exists "Users can create own resume" on public.resumes;
create policy "Users can create own resume"
  on public.resumes for insert
  with check (auth.uid() = user_id OR guest_id = current_setting('request.jwt.claim.guest_id', true));

drop policy if exists "Users can update own resume" on public.resumes;
create policy "Users can update own resume"
  on public.resumes for update
  using (auth.uid() = user_id OR guest_id = current_setting('request.jwt.claim.guest_id', true));

drop policy if exists "Users can delete own resume" on public.resumes;
create policy "Users can delete own resume"
  on public.resumes for delete
  using (auth.uid() = user_id OR guest_id = current_setting('request.jwt.claim.guest_id', true));

-- Разрешаем анонимное чтение для published резюме
create policy "Anyone can view published resumes"
  on public.resumes for select
  using (is_published = true);

-- Создаем таблицу для shares (публичные ссылки на резюме)
create table if not exists public.resume_shares (
  id uuid default gen_random_uuid() primary key,
  resume_id uuid references public.resumes(id) on delete cascade not null,
  share_token text unique not null,
  expires_at timestamp with time zone,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Индексы для resume_shares
create index if not exists resume_shares_resume_id_idx on public.resume_shares(resume_id);
create index if not exists resume_shares_share_token_idx on public.resume_shares(share_token);
create index if not exists resume_shares_expires_at_idx on public.resume_shares(expires_at);

-- RLS для resume_shares
alter table public.resume_shares enable row level security;

create policy "Anyone can view resume shares by token"
  on public.resume_shares for select
  using (true);

-- Функция для создания share токена
create or replace function public.create_resume_share(resume_id uuid, expires_in_days integer default 30)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_share_token text;
  v_expires_at timestamp with time zone;
begin
  -- Генерируем уникальный токен
  v_share_token := encode(gen_random_bytes(32), 'base64');
  v_share_token := regexp_replace(v_share_token, '[^a-zA-Z0-9]', '', 'g');

  -- Вычисляем дату истечения
  v_expires_at := now() + (expires_in_days || ' days')::interval;

  -- Создаем запись
  insert into public.resume_shares (resume_id, share_token, expires_at)
  values (resume_id, v_share_token, v_expires_at)
  returning share_token, expires_at into v_share_token, v_expires_at;

  return jsonb_build_object(
    'share_token', v_share_token,
    'expires_at', v_expires_at,
    'share_url', '/resume/public/' || v_share_token
  );
end;
$$;

-- Функция для увеличения счетчика просмотров
create or replace function public.increment_resume_view_count(p_share_token text)
returns void
language plpgsql
security definer
as $$
begin
  update public.resume_shares
  set view_count = view_count + 1
  where share_token = p_share_token;
end;
$$;

-- Комментарии для документации
comment on column public.resumes.personal_info is 'Личная информация: имя, фамилия, отчество, дата рождения, фото';
comment on column public.resumes.contacts is 'Контакты: email, телефон, город, telegram, готовность к переезду, тип занятости';
comment on column public.resumes.languages is 'Список языков с уровнем владения';
comment on column public.resumes.achievements is 'Список достижений';
comment on column public.resumes.template_id is 'ID шаблона резюме (modern, classic, ats, creative)';
comment on column public.resumes.guest_id is 'ID для неавторизованных пользователей';
comment on column public.resumes.ats_score is 'ATS-скор от 0 до 100';
comment on column public.resumes.is_published is 'Опубликовано ли резюме публично';
comment on column public.resumes.published_url is 'Публичный URL резюме';
