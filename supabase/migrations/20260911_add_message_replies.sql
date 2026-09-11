alter table public.messages
  add column if not exists reply_to_message_id uuid;

alter table public.messages
  drop constraint if exists messages_reply_to_message_id_fkey;

alter table public.messages
  add constraint messages_reply_to_message_id_fkey
  foreign key (reply_to_message_id)
  references public.messages(id)
  on delete set null;

create index if not exists messages_reply_to_message_id_idx
  on public.messages(reply_to_message_id);
