alter table public.campaign_messages
  add column if not exists message_type text not null default 'TEXT'
    check (message_type in ('TEXT', 'ROLL', 'IMAGE')),
  add column if not exists metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 16384);

comment on column public.campaign_messages.metadata is
  'Bounded presentation metadata such as character label, avatar, image URL and dice result. Author identity always comes from author_id.';
