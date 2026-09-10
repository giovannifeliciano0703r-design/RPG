create or replace function public.has_campaign_permission(target_campaign uuid, permission_key text)
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns c
    where c.id = target_campaign and c.owner_id = auth.uid()
  ) or exists (
    select 1 from public.campaign_members cm
    where cm.campaign_id = target_campaign
      and cm.user_id = auth.uid()
      and cm.role = 'gm'
      and coalesce((cm.permissions ->> permission_key)::boolean, false)
  ) or public.is_global_admin();
$$;

create or replace function public.create_campaign_invite(
  target_campaign uuid,
  lifetime_hours integer default 168,
  allowed_uses integer default 25
) returns text
language plpgsql security definer set search_path = '' as $$
declare generated_code text;
begin
  if not public.has_campaign_permission(target_campaign, 'canInvitePlayers') then
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

create or replace function public.update_campaign_member_access(
  target_campaign uuid,
  target_user uuid,
  target_role text,
  target_permissions jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = '' as $$
declare owner_user uuid; stored_role public.app_role; safe_permissions jsonb;
begin
  select owner_id into owner_user from public.campaigns where id = target_campaign;
  if owner_user is null or (auth.uid() <> owner_user and not public.is_global_admin()) then
    raise exception 'Você não tem permissão para alterar participantes.' using errcode = '42501';
  end if;
  if target_user = owner_user then raise exception 'O acesso do Mestre criador é protegido.' using errcode = '42501'; end if;
  if target_role not in ('PLAYER', 'CO_GM', 'SPECTATOR') then raise exception 'Papel inválido.' using errcode = '22023'; end if;
  stored_role := case when target_role = 'CO_GM' then 'gm'::public.app_role else 'player'::public.app_role end;
  safe_permissions := case
    when target_role = 'CO_GM' then coalesce(target_permissions, '{}'::jsonb) - 'isSpectator'
    when target_role = 'SPECTATOR' then '{"isSpectator":true}'::jsonb
    else '{}'::jsonb end;
  if pg_column_size(safe_permissions) > 8192 then raise exception 'Permissões excedem o limite permitido.' using errcode = '22023'; end if;
  update public.campaign_members set role = stored_role, permissions = safe_permissions
  where campaign_id = target_campaign and user_id = target_user;
  if not found then raise exception 'Participante não encontrado.' using errcode = 'P0002'; end if;
  insert into public.audit_events(actor_id, campaign_id, action, target_user_id, metadata)
  values(auth.uid(), target_campaign, 'campaign.member.access_updated', target_user, jsonb_build_object('role', target_role));
end;
$$;

create or replace function public.revoke_campaign_invite(target_invite uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare selected_campaign uuid;
begin
  select campaign_id into selected_campaign from public.campaign_invites where id = target_invite;
  if selected_campaign is null then raise exception 'Convite não encontrado.' using errcode = 'P0002'; end if;
  if not public.has_campaign_permission(selected_campaign, 'canInvitePlayers') then
    raise exception 'Você não tem permissão para revogar convites.' using errcode = '42501';
  end if;
  update public.campaign_invites set revoked_at = coalesce(revoked_at, now()) where id = target_invite;
  insert into public.audit_events(actor_id, campaign_id, action, metadata)
  values(auth.uid(), selected_campaign, 'campaign.invite.revoked', jsonb_build_object('inviteId', target_invite));
end;
$$;

create or replace function public.remove_campaign_member(target_campaign uuid, target_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare owner_user uuid;
begin
  select owner_id into owner_user from public.campaigns where id = target_campaign;
  if owner_user is null then raise exception 'Campanha não encontrada.' using errcode = 'P0002'; end if;
  if target_user = owner_user then raise exception 'O Mestre criador não pode sair sem excluir a campanha.' using errcode = '42501'; end if;
  if auth.uid() <> target_user and not public.has_campaign_permission(target_campaign, 'canKickPlayers') then
    raise exception 'Você não tem permissão para remover este participante.' using errcode = '42501';
  end if;
  delete from public.campaign_members where campaign_id = target_campaign and user_id = target_user;
  if not found then raise exception 'Participante não encontrado.' using errcode = 'P0002'; end if;
  insert into public.audit_events(actor_id, campaign_id, action, target_user_id)
  values(auth.uid(), target_campaign, case when auth.uid() = target_user then 'campaign.member.left' else 'campaign.member.removed' end, target_user);
end;
$$;

revoke all on function public.has_campaign_permission(uuid, text) from public, anon, authenticated;
revoke all on function public.revoke_campaign_invite(uuid) from public, anon;
revoke all on function public.remove_campaign_member(uuid, uuid) from public, anon;
grant execute on function public.revoke_campaign_invite(uuid) to authenticated;
grant execute on function public.remove_campaign_member(uuid, uuid) to authenticated;
