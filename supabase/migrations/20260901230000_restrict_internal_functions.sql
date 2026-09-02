-- Trigger and policy helpers are invoked by PostgreSQL itself or by trusted
-- SECURITY DEFINER RPCs. They must not be callable through the Data API.
revoke all on function public.archive_campaign_state_revision() from public, anon, authenticated;
revoke all on function public.archive_user_app_state_revision() from public, anon, authenticated;
revoke all on function public.can_edit_campaign_state(uuid, text) from public, anon, authenticated;
revoke all on function public.enforce_media_quota() from public, anon, authenticated;

