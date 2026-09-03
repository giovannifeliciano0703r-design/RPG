create or replace function public.can_view_profile(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select target_user = auth.uid()
    or public.is_global_admin()
    or exists (
      select 1
      from public.campaign_members viewer_membership
      join public.campaign_members target_membership
        on target_membership.campaign_id = viewer_membership.campaign_id
      where viewer_membership.user_id = auth.uid()
        and target_membership.user_id = target_user
    );
$$;

revoke all on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read_relevant on public.profiles
for select to authenticated
using (public.can_view_profile(id));
