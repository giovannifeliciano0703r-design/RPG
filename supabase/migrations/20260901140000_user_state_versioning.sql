alter table public.user_app_state add column if not exists revision bigint not null default 1;

create table public.user_app_state_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  state_key text not null,
  payload jsonb not null,
  revision bigint not null,
  archived_at timestamptz not null default now(),
  check (pg_column_size(payload) <= 4194304)
);
create index user_app_state_history_lookup_idx on public.user_app_state_history(user_id, state_key, revision desc);
alter table public.user_app_state_history enable row level security;
create policy user_state_history_read_own on public.user_app_state_history for select to authenticated using (user_id = auth.uid());

create or replace function public.archive_user_app_state_revision()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_app_state_history(user_id, state_key, payload, revision)
  values(old.user_id, old.state_key, old.payload, old.revision);
  delete from public.user_app_state_history where id in (
    select id from public.user_app_state_history where user_id = old.user_id and state_key = old.state_key
    order by revision desc offset 20
  );
  return new;
end;
$$;
create trigger user_app_state_archive_before_update before update on public.user_app_state
for each row execute function public.archive_user_app_state_revision();

create or replace function public.save_my_app_state_batch(target_rows jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; target_state_key text; target_payload jsonb; expected_revision bigint;
  current_revision bigint; next_revision bigint; result jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or jsonb_typeof(target_rows) <> 'array' or jsonb_array_length(target_rows) > 10 then
    raise exception 'Lote de estado inválido.' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(target_rows) loop
    target_state_key := item ->> 'stateKey';
    target_payload := item -> 'payload';
    expected_revision := coalesce((item ->> 'expectedRevision')::bigint, 0);
    if target_state_key not in ('active_system','characters','monsters','macros','npc_folders','npcs','campaigns','campaign_messages','battlemap','initiative')
      or target_payload is null or pg_column_size(target_payload) > 4194304 then
      raise exception 'Seção de estado inválida.' using errcode = '22023';
    end if;
    current_revision := null;
    select revision into current_revision from public.user_app_state
    where user_id = auth.uid() and state_key = target_state_key for update;
    if current_revision is null then
      if expected_revision <> 0 then raise exception 'Dados alterados em outro aparelho.' using errcode = '40001'; end if;
      insert into public.user_app_state(user_id,state_key,payload,revision) values(auth.uid(),target_state_key,target_payload,1);
      next_revision := 1;
    else
      if current_revision <> expected_revision then raise exception 'Dados alterados em outro aparelho.' using errcode = '40001'; end if;
      next_revision := current_revision + 1;
      update public.user_app_state set payload=target_payload,revision=next_revision,updated_at=now()
      where user_id=auth.uid() and state_key=target_state_key;
    end if;
    result := result || jsonb_build_object(target_state_key, next_revision);
  end loop;
  return result;
end;
$$;

revoke insert, update, delete on public.user_app_state from authenticated;
grant select on public.user_app_state, public.user_app_state_history to authenticated;
revoke all on function public.save_my_app_state_batch(jsonb) from public;
grant execute on function public.save_my_app_state_batch(jsonb) to authenticated;
