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
begin
  insert into public.profiles(id, display_name, terms_accepted_at, privacy_version)
  values(
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'jogador'), '@', 1)),
    case when accepted then now() else null end,
    case when accepted then current_version else null end
  );
  return new;
end;
$$;

create or replace function public.accept_current_terms(target_version text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_version constant text := '2026-09-01';
  accepted_at timestamptz := now();
begin
  if auth.uid() is null or target_version <> current_version then
    raise exception 'Versão de consentimento inválida.' using errcode = '22023';
  end if;
  update public.profiles
  set terms_accepted_at = accepted_at, privacy_version = current_version, updated_at = now()
  where id = auth.uid();
  if not found then raise exception 'Perfil não encontrado.' using errcode = 'P0002'; end if;
  return accepted_at;
end;
$$;

revoke update on public.profiles from authenticated;
grant update(display_name, avatar_url) on public.profiles to authenticated;
revoke all on function public.accept_current_terms(text) from public, anon;
grant execute on function public.accept_current_terms(text) to authenticated;
