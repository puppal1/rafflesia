-- created: 2026-11-23T12:25:00-08:00
-- fix RLS recursion that broke chats/people loading

create or replace function public.is_chat_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_members
    where chat_id = cid
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_chat_member(uuid) from public;
grant execute on function public.is_chat_member(uuid) to authenticated;

drop policy if exists "chats_select_member" on public.chats;
drop policy if exists "chat_members_select_member" on public.chat_members;
drop policy if exists "chat_members_insert_self_or_creator" on public.chat_members;
drop policy if exists "messages_select_member" on public.messages;
drop policy if exists "messages_insert_member" on public.messages;
drop policy if exists "message_likes_select_member" on public.message_likes;
drop policy if exists "message_likes_insert_own" on public.message_likes;

create policy "chats_select_member"
  on public.chats for select
  to authenticated
  using (public.is_chat_member(id));

create policy "chat_members_select_member"
  on public.chat_members for select
  to authenticated
  using (public.is_chat_member(chat_id));

create policy "chat_members_insert_self_or_creator"
  on public.chat_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.chats c
      where c.id = chat_id and c.created_by = auth.uid()
    )
  );

create policy "messages_select_member"
  on public.messages for select
  to authenticated
  using (public.is_chat_member(chat_id));

create policy "messages_insert_member"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and public.is_chat_member(chat_id)
  );

create policy "message_likes_select_member"
  on public.message_likes for select
  to authenticated
  using (
    exists (
      select 1 from public.messages msg
      where msg.id = message_likes.message_id
        and public.is_chat_member(msg.chat_id)
    )
  );

create policy "message_likes_insert_own"
  on public.message_likes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.messages msg
      where msg.id = message_id
        and public.is_chat_member(msg.chat_id)
    )
  );
