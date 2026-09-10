alter table public.campaign_members
  add column if not exists permissions jsonb not null default '{}'::jsonb;

alter table public.campaign_members
  add constraint campaign_member_permissions_size check (pg_column_size(permissions) <= 8192);

create table public.campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{10}$'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  max_uses integer not null default 25 check (max_uses between 1 and 250),
  uses integer not null default 0 check (uses >= 0 and uses <= max_uses),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index campaign_invites_campaign_idx on public.campaign_invites(campaign_id, created_at desc);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  action text not null check (char_length(action) between 3 and 80),
  target_user_id uuid references public.profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (pg_column_size(metadata) <= 16384)
);

create index audit_events_campaign_created_idx on public.audit_events(campaign_id, created_at desc);
create index audit_events_actor_created_idx on public.audit_events(actor_id, created_at desc);

alter table public.campaign_invites enable row level security;
alter table public.audit_events enable row level security;

create policy campaign_invites_read_managers on public.campaign_invites
for select to authenticated using (public.campaign_role(campaign_id) in ('gm', 'admin'));

create policy audit_events_read_managers on public.audit_events
for select to authenticated using (
  actor_id = auth.uid()
  or (campaign_id is not null and public.campaign_role(campaign_id) in ('gm', 'admin'))
  or public.is_global_admin()
);

create or replace function public.create_campaign_invite(
  target_campaign uuid,
  lifetime_hours integer default 168,
  allowed_uses integer default 25
) returns text
language plpgsql security definer set search_path = '' as $$
declare
  generated_code text;
begin
  if public.campaign_role(target_campaign) not in ('gm', 'admin') then
    raise exception 'Você não tem permissão para convidar participantes.' using errcode = '42501';
  end if;

  if lifetime_hours not between 1 and 720 or allowed_uses not between 1 and 250 then
    raise exception 'Parâmetros de convite inválidos.' using errcode = '22023';
  end if;

  loop
    generated_code := upper(encode(extensions.gen_random_bytes(5), 'hex'));
    exit when not exists(select 1 from public.campaign_invites where code = generated_code);
  end loop;

  insert into public.campaign_invites(campaign_id, code, created_by, expires_at, max_uses)
  values(target_campaign, generated_code, auth.uid(), now() + make_interval(hours => lifetime_hours), allowed_uses);

  insert into public.audit_events(actor_id, campaign_id, action, metadata)
  values(auth.uid(), target_campaign, 'campaign.invite.created', jsonb_build_object('maxUses', allowed_uses, 'lifetimeHours', lifetime_hours));

  return generated_code;
end;
$$;

create or replace function public.join_campaign_by_invite(invite_code text)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  selected_invite public.campaign_invites%rowtype;
begin
  select * into selected_invite
  from public.campaign_invites
  where code = upper(trim(invite_code))
    and revoked_at is null
    and expires_at > now()
    and uses < max_uses
  for update;

  if selected_invite.id is null then
    raise exception 'Convite inválido, expirado ou esgotado.' using errcode = '22023';
  end if;

  insert into public.campaign_members(campaign_id, user_id, role)
  values(selected_invite.campaign_id, auth.uid(), 'player')
  on conflict (campaign_id, user_id) do nothing;

  if found then
    update public.campaign_invites set uses = uses + 1 where id = selected_invite.id;
    insert into public.audit_events(actor_id, campaign_id, action)
    values(auth.uid(), selected_invite.campaign_id, 'campaign.member.joined');
  end if;

  return selected_invite.campaign_id;
end;
$$;

create or replace function public.update_campaign_member_access(
  target_campaign uuid,
  target_user uuid,
  target_role text,
  target_permissions jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  owner_user uuid;
  stored_role public.app_role;
  safe_permissions jsonb;
begin
  select owner_id into owner_user from public.campaigns where id = target_campaign;
  if owner_user is null or public.campaign_role(target_campaign) not in ('gm', 'admin') then
    raise exception 'Você não tem permissão para alterar participantes.' using errcode = '42501';
  end if;
  if target_user = owner_user then
    raise exception 'O acesso do Mestre criador é protegido.' using errcode = '42501';
  end if;
  if target_role not in ('PLAYER', 'CO_GM', 'SPECTATOR') then
    raise exception 'Papel inválido.' using errcode = '22023';
  end if;

  stored_role := case when target_role = 'CO_GM' then 'gm'::public.app_role else 'player'::public.app_role end;
  safe_permissions := case
    when target_role = 'CO_GM' then coalesce(target_permissions, '{}'::jsonb) - 'isSpectator'
    when target_role = 'SPECTATOR' then '{"isSpectator":true}'::jsonb
    else '{}'::jsonb
  end;
  if pg_column_size(safe_permissions) > 8192 then
    raise exception 'Permissões excedem o limite permitido.' using errcode = '22023';
  end if;

  update public.campaign_members
  set role = stored_role, permissions = safe_permissions
  where campaign_id = target_campaign and user_id = target_user;
  if not found then raise exception 'Participante não encontrado.' using errcode = 'P0002'; end if;

  insert into public.audit_events(actor_id, campaign_id, action, target_user_id, metadata)
  values(auth.uid(), target_campaign, 'campaign.member.access_updated', target_user, jsonb_build_object('role', target_role));
end;
$$;

revoke all on public.campaign_invites, public.audit_events from anon, authenticated;
grant select on public.campaign_invites, public.audit_events to authenticated;
grant usage, select on sequence public.audit_events_id_seq to authenticated;
revoke all on function public.create_campaign_invite(uuid, integer, integer) from public;
revoke all on function public.join_campaign_by_invite(text) from public;
revoke all on function public.update_campaign_member_access(uuid, uuid, text, jsonb) from public;
grant execute on function public.create_campaign_invite(uuid, integer, integer) to authenticated;
grant execute on function public.join_campaign_by_invite(text) to authenticated;
grant execute on function public.update_campaign_member_access(uuid, uuid, text, jsonb) to authenticated;
