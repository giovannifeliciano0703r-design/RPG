create table if not exists public.user_app_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  state_key text not null check (state_key in (
    'active_system', 'characters', 'monsters', 'macros', 'npc_folders',
    'npcs', 'campaigns', 'campaign_messages', 'battlemap', 'initiative'
  )),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, state_key),
  check (pg_column_size(payload) <= 4194304)
);

alter table public.user_app_state enable row level security;

create policy user_app_state_read_own on public.user_app_state
for select to authenticated using (user_id = auth.uid());

create policy user_app_state_insert_own on public.user_app_state
for insert to authenticated with check (user_id = auth.uid());

create policy user_app_state_update_own on public.user_app_state
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy user_app_state_delete_own on public.user_app_state
for delete to authenticated using (user_id = auth.uid());

revoke all on public.user_app_state from anon;
grant select, insert, update, delete on public.user_app_state to authenticated;

alter table public.media_assets add column if not exists album text not null default 'Geral'
check (album in ('Tokens', 'Retratos', 'Mapas & Cenários', 'Handouts', 'Geral'));
