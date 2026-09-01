begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'campaign_invites', 'campaign invites exist');
select has_table('public', 'campaign_state_history', 'campaign state history exists');
select has_table('public', 'audit_events', 'audit trail exists');
select has_table('public', 'user_app_state', 'per-account state exists');
select has_table('public', 'user_app_state_history', 'per-account state history exists');
select has_table('public', 'trash_items', 'recoverable user trash exists');
select has_function('public', 'create_campaign_invite', array['uuid','integer','integer'], 'invite creation RPC exists');
select has_function('public', 'join_campaign_by_invite', array['text'], 'invite join RPC exists');
select has_function('public', 'save_campaign_state_versioned', array['uuid','text','jsonb','bigint'], 'versioned state RPC exists');
select has_function('public', 'delete_my_account', array['text'], 'self-deletion RPC exists');
select has_function('public', 'save_my_app_state_batch', array['jsonb','uuid'], 'atomic per-account state RPC exists');
select policies_are('public', 'trash_items', array['trash_items_own'], 'trash is private to its owner');
select is((select count(*)::integer from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='campaign_members'), 1, 'campaign roster is realtime');
select is((select count(*)::integer from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='user_app_state'), 1, 'account state is realtime');

select policies_are('public', 'campaign_invites', array['campaign_invites_read_managers'], 'invites have a restrictive read policy');
select policies_are('public', 'campaign_state_history', array['state_history_read_managers'], 'history is restricted to managers');
select policies_are('public', 'audit_events', array['audit_events_read_managers'], 'audit events are access controlled');
select col_is_pk('public', 'campaign_members', array['campaign_id','user_id'], 'campaign membership cannot be duplicated');

select * from finish();
rollback;
