create table public.trash_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('character')),
  item_key text not null,
  item_name text not null check (char_length(item_name) between 1 and 160),
  payload jsonb not null,
  deleted_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  check (pg_column_size(payload) <= 4194304)
);
create index trash_items_user_expiry_idx on public.trash_items(user_id, expires_at);
alter table public.trash_items enable row level security;
create policy trash_items_own on public.trash_items for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.trash_items from anon;
grant select, insert, delete on public.trash_items to authenticated;

create or replace function public.purge_expired_trash()
returns integer language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  delete from public.trash_items where expires_at <= now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function public.purge_expired_trash() from public, anon, authenticated;
