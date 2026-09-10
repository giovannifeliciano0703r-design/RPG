create or replace function public.delete_owned_campaign(target_campaign uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare campaign_owner uuid;
begin
  select owner_id into campaign_owner from public.campaigns where id = target_campaign;
  if campaign_owner is null then
    raise exception 'Campanha não encontrada.' using errcode = 'P0002';
  end if;
  if campaign_owner <> auth.uid() and not public.is_global_admin() then
    raise exception 'Somente o Mestre criador pode excluir a campanha.' using errcode = '42501';
  end if;

  insert into public.audit_events(actor_id, campaign_id, action)
  values(auth.uid(), target_campaign, 'campaign.deleted');
  delete from public.campaigns where id = target_campaign;
end;
$$;

revoke delete on public.campaigns from authenticated;
revoke all on function public.delete_owned_campaign(uuid) from public, anon;
grant execute on function public.delete_owned_campaign(uuid) to authenticated;

