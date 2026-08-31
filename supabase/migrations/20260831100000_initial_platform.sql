create extension if not exists pgcrypto;

create type public.app_role as enum ('player', 'gm', 'admin');
create type public.campaign_visibility as enum ('private', 'invite_only');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  avatar_url text,
  global_role public.app_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  system text not null default 'OTHER',
  description text not null default '',
  visibility public.campaign_visibility not null default 'invite_only',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'player',
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table public.campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  channel text not null default 'general' check (char_length(channel) between 1 and 40),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create table public.campaign_state (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  state_key text not null check (state_key in ('battlemap', 'initiative', 'characters', 'macros', 'notes')),
  payload jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (campaign_id, state_key),
  check (pg_column_size(payload) <= 1048576)
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  storage_path text not null unique,
  name text not null check (char_length(name) between 1 and 180),
  mime_type text not null check (mime_type like 'image/%'),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  width integer check (width is null or width between 1 and 12000),
  height integer check (height is null or height between 1 and 12000),
  created_at timestamptz not null default now()
);

create index campaign_messages_campaign_created_idx on public.campaign_messages(campaign_id, created_at desc);
create index campaign_members_user_idx on public.campaign_members(user_id);
create index media_assets_campaign_idx on public.media_assets(campaign_id);

create or replace function public.is_global_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and global_role = 'admin');
$$;

create or replace function public.campaign_role(target_campaign uuid)
returns public.app_role language sql stable security definer set search_path = '' as $$
  select case
    when public.is_global_admin() then 'admin'::public.app_role
    else (select role from public.campaign_members where campaign_id = target_campaign and user_id = auth.uid())
  end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'jogador'), '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.add_campaign_owner()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.campaign_members(campaign_id, user_id, role) values(new.id, new.owner_id, 'gm');
  return new;
end;
$$;

create trigger on_campaign_created after insert on public.campaigns
for each row execute procedure public.add_campaign_owner();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.campaign_messages enable row level security;
alter table public.campaign_state enable row level security;
alter table public.media_assets enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and global_role = (select p.global_role from public.profiles p where p.id = auth.uid()));
create policy campaigns_read_members on public.campaigns for select to authenticated using (public.campaign_role(id) is not null);
create policy campaigns_create on public.campaigns for insert to authenticated with check (owner_id = auth.uid());
create policy campaigns_update_gm on public.campaigns for update to authenticated using (public.campaign_role(id) in ('gm', 'admin')) with check (public.campaign_role(id) in ('gm', 'admin'));
create policy campaigns_delete_owner on public.campaigns for delete to authenticated using (owner_id = auth.uid() or public.is_global_admin());
create policy members_read on public.campaign_members for select to authenticated using (public.campaign_role(campaign_id) is not null);
create policy members_manage_gm on public.campaign_members for all to authenticated using (public.campaign_role(campaign_id) in ('gm', 'admin')) with check (public.campaign_role(campaign_id) in ('gm', 'admin'));
create policy messages_read on public.campaign_messages for select to authenticated using (public.campaign_role(campaign_id) is not null);
create policy messages_create on public.campaign_messages for insert to authenticated with check (author_id = auth.uid() and public.campaign_role(campaign_id) is not null);
create policy messages_edit_own on public.campaign_messages for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy messages_delete on public.campaign_messages for delete to authenticated using (author_id = auth.uid() or public.campaign_role(campaign_id) in ('gm', 'admin'));
create policy state_read on public.campaign_state for select to authenticated using (public.campaign_role(campaign_id) is not null);
create policy state_write_gm on public.campaign_state for all to authenticated using (public.campaign_role(campaign_id) in ('gm', 'admin')) with check (updated_by = auth.uid() and public.campaign_role(campaign_id) in ('gm', 'admin'));
create policy media_read on public.media_assets for select to authenticated using (owner_id = auth.uid() or (campaign_id is not null and public.campaign_role(campaign_id) is not null));
create policy media_write on public.media_assets for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and (campaign_id is null or public.campaign_role(campaign_id) in ('gm', 'admin')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('campaign-media', 'campaign-media', false, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy storage_media_read on storage.objects for select to authenticated using (
  bucket_id = 'campaign-media' and exists(select 1 from public.media_assets m where m.storage_path = name and (m.owner_id = auth.uid() or (m.campaign_id is not null and public.campaign_role(m.campaign_id) is not null)))
);
create policy storage_media_insert on storage.objects for insert to authenticated with check (bucket_id = 'campaign-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy storage_media_update on storage.objects for update to authenticated using (bucket_id = 'campaign-media' and owner_id = auth.uid()::text) with check (bucket_id = 'campaign-media' and owner_id = auth.uid()::text);
create policy storage_media_delete on storage.objects for delete to authenticated using (bucket_id = 'campaign-media' and owner_id = auth.uid()::text);

alter publication supabase_realtime add table public.campaign_messages;
alter publication supabase_realtime add table public.campaign_state;

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles, public.campaigns, public.campaign_members, public.campaign_messages, public.campaign_state, public.media_assets to authenticated;
