-- Linked accounts (A <-> B) persisted server-side
create table if not exists public.account_links (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  user_email text not null,
  linked_user_id uuid references auth.users(id) on delete cascade not null,
  linked_email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint account_links_no_self_link check (user_id <> linked_user_id)
);

create unique index if not exists account_links_user_linked_uidx
  on public.account_links(user_id, linked_user_id);

create index if not exists account_links_user_id_idx
  on public.account_links(user_id);

alter table public.account_links enable row level security;

-- Users can read only their own links.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'account_links'
      and policyname = 'Users can view own account links'
  ) then
    create policy "Users can view own account links"
      on public.account_links for select
      using (auth.uid() = user_id);
  end if;
end $$;
