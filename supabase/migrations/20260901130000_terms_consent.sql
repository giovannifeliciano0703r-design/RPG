alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_version text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, terms_accepted_at, privacy_version)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'jogador'), '@', 1)),
    case when new.raw_user_meta_data ->> 'accepted_terms' = 'true' then now() else null end,
    nullif(new.raw_user_meta_data ->> 'privacy_version', '')
  );
  return new;
end;
$$;
