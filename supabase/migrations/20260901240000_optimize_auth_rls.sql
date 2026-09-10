-- Cache auth.uid() once per statement instead of recalculating it for every row.
drop policy if exists audit_events_read_managers on public.audit_events;
create policy audit_events_read_managers on public.audit_events for select to authenticated using (
  actor_id = (select auth.uid())
  or (campaign_id is not null and public.campaign_role(campaign_id) in ('gm', 'admin'))
  or public.is_global_admin()
);

drop policy if exists messages_create on public.campaign_messages;
create policy messages_create on public.campaign_messages for insert to authenticated
with check (author_id = (select auth.uid()) and public.campaign_role(campaign_id) is not null);

drop policy if exists messages_delete on public.campaign_messages;
create policy messages_delete on public.campaign_messages for delete to authenticated
using (author_id = (select auth.uid()) or public.campaign_role(campaign_id) in ('gm', 'admin'));

drop policy if exists messages_edit_own on public.campaign_messages;
create policy messages_edit_own on public.campaign_messages for update to authenticated
using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));

drop policy if exists campaigns_create on public.campaigns;
create policy campaigns_create on public.campaigns for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists campaigns_delete_owner on public.campaigns;
create policy campaigns_delete_owner on public.campaigns for delete to authenticated
using (owner_id = (select auth.uid()) or public.is_global_admin());

drop policy if exists media_read on public.media_assets;
create policy media_read on public.media_assets for select to authenticated using (
  owner_id = (select auth.uid())
  or (campaign_id is not null and public.campaign_role(campaign_id) is not null)
);

drop policy if exists media_write on public.media_assets;
create policy media_write on public.media_assets for all to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and (campaign_id is null or public.campaign_role(campaign_id) in ('gm', 'admin'))
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()) and global_role = public.current_global_role());

drop policy if exists trash_items_own on public.trash_items;
create policy trash_items_own on public.trash_items for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

