create table public.campaign_invite_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

create index campaign_invite_attempts_user_time_idx
  on public.campaign_invite_attempts(user_id, attempted_at desc);

alter table public.campaign_invite_attempts enable row level security;
revoke all on public.campaign_invite_attempts from public, anon, authenticated;

create or replace function public.join_campaign_by_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_invite public.campaign_invites%rowtype;
begin
  if current_user_id is null then
    return null;
  end if;

  -- Serialize attempts for this account so concurrent requests cannot bypass
  -- the ten-attempt, ten-minute window.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(current_user_id::text, 0));
  delete from public.campaign_invite_attempts
  where user_id = current_user_id and attempted_at < now() - interval '1 day';
  if (
    select count(*) from public.campaign_invite_attempts
    where user_id = current_user_id and attempted_at >= now() - interval '10 minutes'
  ) >= 10 then
    return null;
  end if;

  insert into public.campaign_invite_attempts(user_id) values(current_user_id);

  select * into selected_invite
  from public.campaign_invites
  where code = upper(trim(invite_code))
    and revoked_at is null
    and expires_at > now()
    and uses < max_uses
  for update;

  if selected_invite.id is null then
    return null;
  end if;

  insert into public.campaign_members(campaign_id, user_id, role)
  values(selected_invite.campaign_id, current_user_id, 'player')
  on conflict (campaign_id, user_id) do nothing;

  if found then
    update public.campaign_invites set uses = uses + 1 where id = selected_invite.id;
    insert into public.audit_events(actor_id, campaign_id, action)
    values(current_user_id, selected_invite.campaign_id, 'campaign.member.joined');
  end if;

  return selected_invite.campaign_id;
end;
$$;

revoke all on function public.join_campaign_by_invite(text) from public, anon;
grant execute on function public.join_campaign_by_invite(text) to authenticated;
