-- Cover foreign-key lookups used by ownership, audit and cleanup operations.
create index if not exists audit_events_target_user_idx
  on public.audit_events(target_user_id);
create index if not exists campaign_invites_created_by_idx
  on public.campaign_invites(created_by);
create index if not exists campaign_state_updated_by_idx
  on public.campaign_state(updated_by);
create index if not exists campaign_state_history_updated_by_idx
  on public.campaign_state_history(updated_by);
create index if not exists campaigns_owner_idx
  on public.campaigns(owner_id);
create index if not exists media_assets_owner_idx
  on public.media_assets(owner_id);

-- Membership writes are only allowed through validated SECURITY DEFINER RPCs,
-- so this legacy ALL policy is redundant and adds a second SELECT predicate.
drop policy if exists members_manage_gm on public.campaign_members;

-- Keep read and write predicates separate so SELECT evaluates only media_read.
drop policy if exists media_write on public.media_assets;
create policy media_insert_own on public.media_assets
for insert to authenticated with check (
  owner_id = (select auth.uid())
  and (campaign_id is null or public.campaign_role(campaign_id) in ('gm', 'admin'))
);
create policy media_update_own on public.media_assets
for update to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and (campaign_id is null or public.campaign_role(campaign_id) in ('gm', 'admin'))
);
create policy media_delete_own on public.media_assets
for delete to authenticated using (owner_id = (select auth.uid()));

-- This installation helper may exist on projects created through the dashboard,
-- but is intentionally absent from clean local/CI databases.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;
