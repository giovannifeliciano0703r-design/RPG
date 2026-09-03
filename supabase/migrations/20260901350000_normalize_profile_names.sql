create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_version constant text := '2026-09-01';
  accepted boolean := new.raw_user_meta_data ->> 'accepted_terms' = 'true'
    and new.raw_user_meta_data ->> 'privacy_version' = current_version;
  requested_name text := btrim(regexp_replace(coalesce(new.raw_user_meta_data ->> 'display_name', ''), '\s+', ' ', 'g'));
  fallback_name text := btrim(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '\s+', ' ', 'g'));
begin
  if char_length(requested_name) not between 2 and 80 then
    requested_name := fallback_name;
  end if;
  if char_length(requested_name) not between 2 and 80 then
    requested_name := 'Aventureiro';
  end if;

  insert into public.profiles(id, display_name, terms_accepted_at, privacy_version)
  values(
    new.id,
    left(requested_name, 80),
    case when accepted then now() else null end,
    case when accepted then current_version else null end
  );
  return new;
end;
$$;
