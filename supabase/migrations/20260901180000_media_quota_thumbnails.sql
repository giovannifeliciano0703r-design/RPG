alter table public.media_assets add column if not exists thumbnail_path text unique;

create or replace function public.enforce_media_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare used_bytes bigint;
begin
  select coalesce(sum(size_bytes),0) into used_bytes from public.media_assets
  where owner_id = new.owner_id and (tg_op = 'INSERT' or id <> new.id);
  if used_bytes + new.size_bytes > 104857600 then
    raise exception 'Sua biblioteca atingiu o limite de 100 MB.' using errcode = '54000';
  end if;
  return new;
end;
$$;
create trigger media_quota_before_write before insert or update of size_bytes, owner_id on public.media_assets
for each row execute function public.enforce_media_quota();
