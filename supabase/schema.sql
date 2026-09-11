create table if not exists public.app_users (
  id text primary key check (id in ('user_1', 'user_2')),
  display_name text not null unique,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.auth_sessions (
  token_hash text primary key,
  user_id text not null references public.app_users(id) on delete cascade,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists auth_sessions_user_id_idx on public.auth_sessions(user_id);
create index if not exists auth_sessions_expires_at_idx on public.auth_sessions(expires_at);

alter table public.messages
  alter column sender_id type text using sender_id::text;

alter table public.messages
  add column if not exists read_at timestamptz;

alter table public.messages
  add column if not exists reply_to_message_id uuid references public.messages(id) on delete set null;

create index if not exists messages_reply_to_message_id_idx
  on public.messages(reply_to_message_id);

alter table public.messages enable row level security;
alter table public.app_users enable row level security;
alter table public.auth_sessions enable row level security;

drop policy if exists "No public access to messages" on public.messages;
drop policy if exists "No public access to app users" on public.app_users;
drop policy if exists "No public access to auth sessions" on public.auth_sessions;

create policy "No public access to messages"
  on public.messages for all to anon, authenticated using (false) with check (false);

create policy "No public access to app users"
  on public.app_users for all to anon, authenticated using (false) with check (false);

create policy "No public access to auth sessions"
  on public.auth_sessions for all to anon, authenticated using (false) with check (false);

insert into public.app_users (id, display_name, password_hash)
values
  ('user_1', 'Yuhda', '$2b$12$dS3CBYkv92UDN49WP4R6Eu6NOufjANWWa22WcY0agM.oeexKqqvr6'),
  ('user_2', 'Ratih', '$2b$12$TOUU4cbiKLEgujsGUSend.M7iNVv3ALDqU3VV6NgmesP.hEfx4i7i')
on conflict (id) do update set
  display_name = excluded.display_name,
  password_hash = excluded.password_hash;

do $$
begin
  alter table public.messages
    add constraint messages_content_length_check
    check (content is null or char_length(content) between 1 and 2000);
exception
  when duplicate_object then null;
end $$;

alter table public.messages
  alter column created_at set default timezone('utc', now());

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;
