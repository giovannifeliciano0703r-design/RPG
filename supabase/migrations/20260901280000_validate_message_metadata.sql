create or replace function public.is_valid_campaign_message_metadata(value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  roll jsonb;
  item jsonb;
begin
  if jsonb_typeof(value) <> 'object'
    or value - array['senderName','senderAvatar','characterId','rollData','imageUrl'] <> '{}'::jsonb then
    return false;
  end if;

  if value ? 'senderName' and (jsonb_typeof(value -> 'senderName') <> 'string' or char_length(value ->> 'senderName') > 120) then return false; end if;
  if value ? 'senderAvatar' and (jsonb_typeof(value -> 'senderAvatar') <> 'string' or char_length(value ->> 'senderAvatar') > 500) then return false; end if;
  if value ? 'characterId' and (jsonb_typeof(value -> 'characterId') <> 'string' or char_length(value ->> 'characterId') > 120) then return false; end if;
  if value ? 'imageUrl' and (
    jsonb_typeof(value -> 'imageUrl') <> 'string'
    or char_length(value ->> 'imageUrl') > 2000
    or value ->> 'imageUrl' not like 'https://%'
  ) then return false; end if;

  if value ? 'rollData' then
    roll := value -> 'rollData';
    if jsonb_typeof(roll) <> 'object'
      or roll - array['formula','total','rolls','individualRolls','isCrit','isFumble'] <> '{}'::jsonb
      or jsonb_typeof(roll -> 'formula') <> 'string'
      or char_length(roll ->> 'formula') > 200
      or jsonb_typeof(roll -> 'total') <> 'number' then
      return false;
    end if;
    if roll ? 'isCrit' and jsonb_typeof(roll -> 'isCrit') <> 'boolean' then return false; end if;
    if roll ? 'isFumble' and jsonb_typeof(roll -> 'isFumble') <> 'boolean' then return false; end if;
    if roll ? 'rolls' then
      if jsonb_typeof(roll -> 'rolls') <> 'array' or jsonb_array_length(roll -> 'rolls') > 100 then return false; end if;
      for item in select elements.element from jsonb_array_elements(roll -> 'rolls') as elements(element) loop
        if jsonb_typeof(item) <> 'number' then return false; end if;
      end loop;
    end if;
    if roll ? 'individualRolls' then
      if jsonb_typeof(roll -> 'individualRolls') <> 'array' or jsonb_array_length(roll -> 'individualRolls') > 100 then return false; end if;
      for item in select elements.element from jsonb_array_elements(roll -> 'individualRolls') as elements(element) loop
        if jsonb_typeof(item) <> 'number' then return false; end if;
      end loop;
    end if;
  end if;
  return true;
exception when others then
  return false;
end;
$$;

alter table public.campaign_messages
  add constraint campaign_messages_metadata_shape
  check (public.is_valid_campaign_message_metadata(metadata));
