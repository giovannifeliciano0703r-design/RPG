create or replace function public.move_owned_campaign_token(
  target_campaign uuid,
  target_token_id text,
  target_x double precision,
  target_y double precision,
  expected_revision bigint default 0
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := (select auth.uid());
  current_payload jsonb;
  current_revision bigint;
  current_token jsonb;
  updated_tokens jsonb;
  next_revision bigint;
begin
  if current_user_id is null then
    raise exception 'Entre na sua conta para mover tokens.' using errcode = '42501';
  end if;
  if target_token_id is null or length(target_token_id) not between 1 and 120 then
    raise exception 'Token inválido.' using errcode = '22023';
  end if;
  if target_x::text in ('NaN', 'Infinity', '-Infinity')
     or target_y::text in ('NaN', 'Infinity', '-Infinity')
     or target_x not between 0 and 100000 or target_y not between 0 and 100000 then
    raise exception 'Posição do token inválida.' using errcode = '22023';
  end if;
  if public.campaign_role(target_campaign) is null then
    raise exception 'Você não participa desta campanha.' using errcode = '42501';
  end if;

  select payload, revision into current_payload, current_revision
  from public.campaign_state
  where campaign_id = target_campaign and state_key = 'battlemap'
  for update;

  if current_payload is null or current_revision <> expected_revision then
    raise exception 'O mapa foi alterado em outro dispositivo.' using errcode = '40001';
  end if;
  if jsonb_typeof(current_payload -> 'tokens') is distinct from 'array' then
    raise exception 'O mapa contém tokens inválidos.' using errcode = '22023';
  end if;

  select token into current_token
  from jsonb_array_elements(coalesce(current_payload -> 'tokens', '[]'::jsonb)) token
  where token ->> 'id' = target_token_id
  limit 1;

  if current_token is null then
    raise exception 'Token não encontrado.' using errcode = 'P0002';
  end if;
  if current_token -> 'isEnemy' = 'true'::jsonb
     or current_token ->> 'ownerId' is distinct from current_user_id::text then
    raise exception 'Você só pode mover tokens que pertencem à sua conta.' using errcode = '42501';
  end if;

  select jsonb_agg(
    case when token ->> 'id' = target_token_id
      then jsonb_set(jsonb_set(token, '{x}', to_jsonb(target_x), true), '{y}', to_jsonb(target_y), true)
      else token
    end order by token_index
  ) into updated_tokens
  from jsonb_array_elements(coalesce(current_payload -> 'tokens', '[]'::jsonb)) with ordinality as entries(token, token_index);

  next_revision := current_revision + 1;
  update public.campaign_state
  set payload = jsonb_set(current_payload, '{tokens}', coalesce(updated_tokens, '[]'::jsonb), true),
      revision = next_revision,
      updated_by = current_user_id,
      updated_at = now()
  where campaign_id = target_campaign and state_key = 'battlemap';

  insert into public.audit_events(actor_id, campaign_id, action, metadata)
  values(current_user_id, target_campaign, 'campaign.token.moved',
    jsonb_build_object('tokenId', target_token_id, 'revision', next_revision));
  return next_revision;
end;
$$;

revoke all on function public.move_owned_campaign_token(uuid, text, double precision, double precision, bigint) from public, anon;
grant execute on function public.move_owned_campaign_token(uuid, text, double precision, double precision, bigint) to authenticated;
