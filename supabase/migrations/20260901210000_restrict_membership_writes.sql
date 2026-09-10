-- Membership changes must go through the audited SECURITY DEFINER functions.
-- RLS alone is not enough here because Co-GMs are stored with the database
-- role `gm`; the older broad policy would otherwise let them bypass the
-- granular permission matrix through the REST API.
revoke insert, update, delete on public.campaign_members from authenticated;

