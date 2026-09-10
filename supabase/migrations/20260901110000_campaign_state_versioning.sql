create table public.campaign_state_history (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  state_key text not null,
  payload jsonb not null,
  revision bigint not null,
  updated_by uuid references public.profiles(id) on delete set null,
  archived_at timestamptz not null default now(),
  check (pg_column_size(payload) <= 1048576)
);

create index campaign_state_history_lookup_idx
  on public.campaign_state_history(campaign_id, state_key, revision desc);

alter table public.campaign_state_history enable row level security;
create policy state_history_read_managers on public.campaign_state_history
for select to authenticated using (public.campaign_role(campaign_id) in ('gm', 'admin'));

create or replace function public.archive_campaign_state_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.campaign_state_history(campaign_id, state_key, payload, revision, updated_by)
  values(old.campaign_id, old.state_key, old.payload, old.revision, old.updated_by);
  delete from public.campaign_state_history
  where id in (
    select id from public.campaign_state_history
    where campaign_id = old.campaign_id and state_key = old.state_key
    order by revision desc offset 50
  );
  return new;
end;
$$;

create trigger campaign_state_archive_before_update
before update on public.campaign_state
for each row execute function public.archive_campaign_state_revision();

create or replace function public.can_edit_campaign_state(target_campaign uuid, target_key text)
returns boolean language sql stable security definer set search_path = '' as $$
  select case
    when public.is_global_admin() then true
    when exists(select 1 from public.campaigns where id = target_campaign and owner_id = auth.uid()) then true
    when public.campaign_role(target_campaign) = 'gm' then coalesce((
      select case
        when target_key = 'battlemap' then (permissions ->> 'canEditMaps')::boolean
        when target_key = 'initiative' then (permissions ->> 'canManageInitiative')::boolean
        when target_key = 'macros' then (permissions ->> 'canEditSharedMacros')::boolean
        else false
      end
      from public.campaign_members where campaign_id = target_campaign and user_id = auth.uid()
    ), false)
    else false
  end;
$$;

drop policy if exists state_write_gm on public.campaign_state;

create or replace function public.save_campaign_state_versioned(
  target_campaign uuid,
  target_state_key text,
  target_payload jsonb,
  expected_revision bigint default 0
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  current_revision bigint;
  next_revision bigint;
begin
  if target_state_key not in ('battlemap', 'initiative', 'characters', 'macros', 'notes') then
    raise exception 'Tipo de estado inválido.' using errcode = '22023';
  end if;
  if pg_column_size(target_payload) > 1048576 then
    raise exception 'O estado excede o limite de 1 MB.' using errcode = '22023';
  end if;
  if not public.can_edit_campaign_state(target_campaign, target_state_key) then
    raise exception 'Você não tem permissão para editar este conteúdo.' using errcode = '42501';
  end if;

  select revision into current_revision from public.campaign_state
  where campaign_id = target_campaign and state_key = target_state_key for update;

  if current_revision is null then
    if expected_revision <> 0 then
      raise exception 'O conteúdo foi alterado em outro dispositivo.' using errcode = '40001';
    end if;
    insert into public.campaign_state(campaign_id, state_key, payload, revision, updated_by)
    values(target_campaign, target_state_key, target_payload, 1, auth.uid());
    next_revision := 1;
  else
    if current_revision <> expected_revision then
      raise exception 'O conteúdo foi alterado em outro dispositivo.' using errcode = '40001';
    end if;
    next_revision := current_revision + 1;
    update public.campaign_state set payload = target_payload, revision = next_revision,
      updated_by = auth.uid(), updated_at = now()
    where campaign_id = target_campaign and state_key = target_state_key;
  end if;

  insert into public.audit_events(actor_id, campaign_id, action, metadata)
  values(auth.uid(), target_campaign, 'campaign.state.updated', jsonb_build_object('stateKey', target_state_key, 'revision', next_revision));
  return next_revision;
end;
$$;

revoke insert, update, delete on public.campaign_state from authenticated;
grant select on public.campaign_state, public.campaign_state_history to authenticated;
revoke all on function public.save_campaign_state_versioned(uuid, text, jsonb, bigint) from public;
grant execute on function public.save_campaign_state_versioned(uuid, text, jsonb, bigint) to authenticated;
