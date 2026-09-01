create or replace function public.delete_my_account(confirmation text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;
  if confirmation <> 'EXCLUIR MINHA CONTA' then
    raise exception 'Confirmação inválida.' using errcode = '22023';
  end if;

  insert into public.audit_events(actor_id, action, metadata)
  values(current_user_id, 'account.deleted', jsonb_build_object('requestedAt', now()));
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_my_account(text) from public;
grant execute on function public.delete_my_account(text) to authenticated;
