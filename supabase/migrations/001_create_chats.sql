-- Таблица чатов
create table if not exists public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text default 'Новый чат',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Таблица сообщений
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Индексы
create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists chats_updated_at_idx on public.chats(updated_at desc);
create index if not exists messages_chat_id_idx on public.messages(chat_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- RLS (Row Level Security)
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Политики для chats
create policy "Users can view own chats"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Users can create own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update own chats"
  on public.chats for update
  using (auth.uid() = user_id);

create policy "Users can delete own chats"
  on public.chats for delete
  using (auth.uid() = user_id);

-- Политики для messages
create policy "Users can view messages in own chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can create messages in own chats"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- Функция для автообновления updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Триггер для обновления updated_at в chats
drop trigger if exists chats_updated_at on public.chats;
create trigger chats_updated_at
  before update on public.chats
  for each row
  execute function public.handle_updated_at();

-- Триггер для обновления updated_at в chats при новом сообщении
create or replace function public.update_chat_on_message()
returns trigger as $$
begin
  update public.chats
  set updated_at = timezone('utc'::text, now())
  where id = new.chat_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_update_chat on public.messages;
create trigger messages_update_chat
  after insert on public.messages
  for each row
  execute function public.update_chat_on_message();
