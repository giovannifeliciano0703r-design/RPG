alter table public.user_app_state add column if not exists last_writer uuid;

drop function if exists public.save_my_app_state_batch(jsonb);
create or replace function public.save_my_app_state_batch(target_rows jsonb, target_writer uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare item jsonb; target_state_key text; target_payload jsonb; expected_revision bigint;
  current_revision bigint; next_revision bigint; result jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or target_writer is null or jsonb_typeof(target_rows) <> 'array' or jsonb_array_length(target_rows) > 10 then
    raise exception 'Lote de estado inválido.' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(target_rows) loop
    target_state_key := item ->> 'stateKey'; target_payload := item -> 'payload';
    expected_revision := coalesce((item ->> 'expectedRevision')::bigint, 0);
    if target_state_key not in ('active_system','characters','monsters','macros','npc_folders','npcs','campaigns','campaign_messages','battlemap','initiative')
      or target_payload is null or pg_column_size(target_payload) > 4194304 then
      raise exception 'Seção de estado inválida.' using errcode = '22023';
    end if;
    current_revision := null;
    select revision into current_revision from public.user_app_state where user_id=auth.uid() and state_key=target_state_key for update;
    if current_revision is null then
      if expected_revision <> 0 then raise exception 'Dados alterados em outro aparelho.' using errcode = '40001'; end if;
      insert into public.user_app_state(user_id,state_key,payload,revision,last_writer) values(auth.uid(),target_state_key,target_payload,1,target_writer);
      next_revision := 1;
    else
      if current_revision <> expected_revision then raise exception 'Dados alterados em outro aparelho.' using errcode = '40001'; end if;
      next_revision := current_revision + 1;
      update public.user_app_state set payload=target_payload,revision=next_revision,last_writer=target_writer,updated_at=now()
      where user_id=auth.uid() and state_key=target_state_key;
    end if;
    result := result || jsonb_build_object(target_state_key,next_revision);
  end loop;
  return result;
end;
$$;
revoke all on function public.save_my_app_state_batch(jsonb,uuid) from public;
grant execute on function public.save_my_app_state_batch(jsonb,uuid) to authenticated;

alter publication supabase_realtime add table public.user_app_state;
