-- The table is outside exposed schemas and has no client schema/table grants.
-- The SECURITY DEFINER invite RPC is its only access path, so RLS would add no
-- enforcement and would misleadingly appear as an unconfigured policy set.
alter table private.campaign_invite_attempts disable row level security;
