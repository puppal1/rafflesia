-- created: 2026-11-24T22:50:00-08:00
-- Server-side blocked-word gate for posts/messages (client checkKidText is UX only)

create or replace function public.assert_kid_text_allowed(p_body text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  hay text := lower(coalesce(p_body, ''));
  hit text;
begin
  if nullif(trim(hay), '') is null then
    return;
  end if;
  if to_regclass('public.blocked_words') is null then
    return;
  end if;
  select bw.phrase into hit
  from public.blocked_words bw
  where length(trim(bw.phrase)) > 0
    and hay like '%' || lower(bw.phrase) || '%'
  limit 1;
  if hit is not null then
    raise exception 'That text is not allowed';
  end if;
end;
$$;

revoke all on function public.assert_kid_text_allowed(text) from public;
grant execute on function public.assert_kid_text_allowed(text) to authenticated;

-- updated: 2026-11-24T22:50:00-08:00 — create_post asserts kid text
create or replace function public.create_post(p_kind text, p_body text, p_media_url text default null)
returns public.posts
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.posts;
  restr public.user_restrictions;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  perform public.assert_kid_text_allowed(p_body);
  select * into restr from public.user_restrictions where user_id = uid;
  if coalesce(restr.block_post, false) then
    raise exception 'Posting is restricted by a teacher';
  end if;
  insert into public.posts (author_id, kind, body, media_url)
  values (uid, p_kind, p_body, p_media_url)
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.create_post(text, text, text) from public;
grant execute on function public.create_post(text, text, text) to authenticated;

-- updated: 2026-11-24T22:50:00-08:00 — send_chat_message asserts kid text
drop function if exists public.send_chat_message(uuid, text);
drop function if exists public.send_chat_message(uuid, text, text);

create or replace function public.send_chat_message(
  p_chat_id uuid,
  p_body text,
  p_video_url text default null
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  body text := trim(coalesce(p_body, ''));
  rec public.messages;
  restr public.user_restrictions;
  ch public.chats;
  uname text;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if body = '' and coalesce(trim(p_video_url), '') = '' then
    raise exception 'Message is empty';
  end if;
  perform public.assert_kid_text_allowed(body);
  select * into ch from public.chats where id = p_chat_id;
  if not found then raise exception 'Chat not found'; end if;
  if not exists(select 1 from public.chat_members where chat_id = p_chat_id and user_id = uid) then
    raise exception 'Not a member of this chat';
  end if;
  if ch.lounge_key = 'announcements' then
    select username into uname from public.profiles where id = uid;
    if lower(coalesce(uname, '')) is distinct from 'rafflesiaonline' then
      raise exception 'Only @rafflesiaonline can post in Announcements & Updates';
    end if;
  end if;
  select * into restr from public.user_restrictions where user_id = uid;
  if coalesce(restr.block_message, false) then
    raise exception 'Messaging is restricted by a teacher';
  end if;
  insert into public.messages (chat_id, sender_id, body, video_url)
  values (p_chat_id, uid, nullif(body, ''), p_video_url)
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.send_chat_message(uuid, text, text) from public;
grant execute on function public.send_chat_message(uuid, text, text) to authenticated;
