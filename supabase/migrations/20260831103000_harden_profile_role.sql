create or replace function public.current_global_role()
returns public.app_role language sql stable security definer set search_path = '' as $$
  select coalesce((select global_role from public.profiles where id = auth.uid()), 'player'::public.app_role);
$$;

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and global_role = public.current_global_role());

revoke all on function public.is_global_admin() from public, anon;
revoke all on function public.campaign_role(uuid) from public, anon;
revoke all on function public.current_global_role() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.add_campaign_owner() from public, anon, authenticated;
grant execute on function public.is_global_admin() to authenticated;
grant execute on function public.campaign_role(uuid) to authenticated;
grant execute on function public.current_global_role() to authenticated;
