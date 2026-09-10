-- Cache auth.uid() once per statement for private per-account state policies.
drop policy if exists user_app_state_read_own on public.user_app_state;
create policy user_app_state_read_own on public.user_app_state
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists user_app_state_insert_own on public.user_app_state;
create policy user_app_state_insert_own on public.user_app_state
for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists user_app_state_update_own on public.user_app_state;
create policy user_app_state_update_own on public.user_app_state
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists user_app_state_delete_own on public.user_app_state;
create policy user_app_state_delete_own on public.user_app_state
for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists user_state_history_read_own on public.user_app_state_history;
create policy user_state_history_read_own on public.user_app_state_history
for select to authenticated using (user_id = (select auth.uid()));
