create index if not exists campaign_messages_author_created_idx
  on public.campaign_messages(author_id, created_at desc);

create or replace function public.enforce_campaign_message_limits()
returns trigger
language plpgsql
security invoker
set search_path = '' as $$
declare recent_count integer;
begin
  if auth.uid() is null or new.author_id <> auth.uid() then
    raise exception 'Autor da mensagem inválido.' using errcode = '42501';
  end if;
  new.body := btrim(new.body);
  if char_length(new.body) = 0 then
    raise exception 'A mensagem não pode estar vazia.' using errcode = '22023';
  end if;
  new.created_at := now();
  select count(*) into recent_count
  from public.campaign_messages
  where author_id = auth.uid() and created_at >= now() - interval '1 minute';
  if recent_count >= 30 then
    raise exception 'Muitas mensagens em pouco tempo. Aguarde um minuto.' using errcode = '54000';
  end if;
  return new;
end;
$$;

drop trigger if exists campaign_messages_rate_limit_before_insert on public.campaign_messages;
create trigger campaign_messages_rate_limit_before_insert
before insert on public.campaign_messages
for each row execute function public.enforce_campaign_message_limits();

revoke all on function public.enforce_campaign_message_limits() from public, anon, authenticated;
