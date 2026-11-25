-- created: 2026-11-25T00:30:00-08:00
-- In-app notifications for Rafflesia. Run once in Supabase SQL Editor.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  body text,
  target_type text,
  target_id text,
  chat_id uuid,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.emit_notification(
  p_recipient uuid,
  p_actor uuid,
  p_type text,
  p_title text,
  p_body text default null,
  p_target_type text default null,
  p_target_id text default null,
  p_chat_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_recipient is null then return; end if;
  if p_actor is not null and p_recipient = p_actor then return; end if;
  insert into public.notifications (
    recipient_id, actor_id, type, title, body, target_type, target_id, chat_id
  ) values (
    p_recipient, p_actor, p_type, left(coalesce(p_title, 'Update'), 120),
    left(nullif(trim(coalesce(p_body, '')), ''), 280),
    p_target_type, p_target_id, p_chat_id
  );
end;
$$;

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.list_my_notifications(p_limit integer default 50)
returns table (
  id uuid,
  actor_id uuid,
  actor_username text,
  actor_display_name text,
  actor_avatar_url text,
  actor_icon_pack text,
  actor_icon_id text,
  type text,
  title text,
  body text,
  target_type text,
  target_id text,
  chat_id uuid,
  created_at timestamptz,
  read_at timestamptz,
  pinned boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  lim int := greatest(1, least(coalesce(p_limit, 50), 80));
begin
  if uid is null then raise exception 'Not logged in'; end if;
  return query
  select
    n.id,
    n.actor_id,
    coalesce(p.username, 'someone')::text,
    coalesce(p.display_name, '')::text,
    p.avatar_url,
    p.icon_pack,
    p.icon_id,
    n.type,
    n.title,
    n.body,
    n.target_type,
    n.target_id,
    n.chat_id,
    n.created_at,
    n.read_at,
    (n.type in ('teacher_restrict', 'teacher_verify')) as pinned
  from public.notifications n
  left join public.profiles p on p.id = n.actor_id
  where n.recipient_id = uid
  order by
    case when n.type in ('teacher_restrict', 'teacher_verify') and n.read_at is null then 0 else 1 end,
    n.created_at desc
  limit lim;
end;
$$;

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.mark_notifications_read(p_all boolean default true)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  update public.notifications
    set read_at = now()
  where recipient_id = uid
    and read_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.count_my_unread_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n int;
begin
  if uid is null then return 0; end if;
  select count(*)::int into n
  from public.notifications
  where recipient_id = uid and read_at is null;
  return coalesce(n, 0);
end;
$$;

revoke all on function public.emit_notification(uuid, uuid, text, text, text, text, text, uuid) from public;
revoke all on function public.list_my_notifications(integer) from public;
revoke all on function public.mark_notifications_read(boolean) from public;
revoke all on function public.count_my_unread_notifications() from public;

grant execute on function public.list_my_notifications(integer) to authenticated;
grant execute on function public.mark_notifications_read(boolean) to authenticated;
grant execute on function public.count_my_unread_notifications() to authenticated;

-- ---- triggers ----

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.trg_notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ch public.chats;
  actor_name text;
  snippet text;
  m record;
  mention text;
  mentioned uuid;
begin
  select * into ch from public.chats where id = new.chat_id;
  if not found then return new; end if;
  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.sender_id;
  snippet := left(coalesce(new.body, '📷'), 80);

  if ch.lounge_key = 'announcements' then
    for m in
      select cm.user_id from public.chat_members cm
      where cm.chat_id = new.chat_id and cm.user_id is distinct from new.sender_id
    loop
      perform public.emit_notification(
        m.user_id, new.sender_id, 'announcement',
        'Club announcement', snippet, 'chat', new.chat_id::text, new.chat_id
      );
    end loop;
    return new;
  end if;

  if ch.lounge_key = 'everyone' then
    for mention in
      select distinct lower((regexp_matches(coalesce(new.body, ''), '@([a-z0-9_]{1,32})', 'gi'))[1])
    loop
      select id into mentioned from public.profiles where lower(username) = mention limit 1;
      if mentioned is not null and mentioned is distinct from new.sender_id then
        if exists (
          select 1 from public.chat_members
          where chat_id = new.chat_id and user_id = mentioned
        ) then
          perform public.emit_notification(
            mentioned, new.sender_id, 'chat_mention',
            actor_name || ' mentioned you', snippet, 'chat', new.chat_id::text, new.chat_id
          );
        end if;
      end if;
    end loop;
    return new;
  end if;

  for m in
    select cm.user_id from public.chat_members cm
    where cm.chat_id = new.chat_id and cm.user_id is distinct from new.sender_id
  loop
    perform public.emit_notification(
      m.user_id, new.sender_id, 'chat_message',
      actor_name || ' sent a message', snippet, 'chat', new.chat_id::text, new.chat_id
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message
  after insert on public.messages
  for each row execute function public.trg_notify_on_message();

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.trg_notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.follower_id;
  perform public.emit_notification(
    new.following_id, new.follower_id, 'follow',
    actor_name || ' followed you', null, 'profile', new.follower_id::text, null
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_on_follow on public.follows;
create trigger trg_notify_on_follow
  after insert on public.follows
  for each row execute function public.trg_notify_on_follow();

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.trg_notify_on_post_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  actor_name text;
  snippet text;
  prior record;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.author_id;
  snippet := left(coalesce(new.body, '📷'), 80);

  if post_author is not null then
    perform public.emit_notification(
      post_author, new.author_id, 'post_comment',
      actor_name || ' commented on your post', snippet, 'post', new.post_id::text, null
    );
  end if;

  for prior in
    select distinct c.author_id
    from public.post_comments c
    where c.post_id = new.post_id
      and c.deleted_at is null
      and c.author_id is distinct from new.author_id
      and c.author_id is distinct from post_author
      and c.id is distinct from new.id
  loop
    perform public.emit_notification(
      prior.author_id, new.author_id, 'post_comment_followup',
      actor_name || ' also commented', snippet, 'post', new.post_id::text, null
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_post_comment on public.post_comments;
create trigger trg_notify_on_post_comment
  after insert on public.post_comments
  for each row execute function public.trg_notify_on_post_comment();

-- created: 2026-11-25T00:30:00-08:00
create or replace function public.trg_notify_on_content_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  actor_name text;
begin
  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.user_id;

  if new.target_type = 'post' then
    select author_id into owner from public.posts where id = new.target_id;
    perform public.emit_notification(
      owner, new.user_id, 'post_reaction',
      actor_name || ' liked your post', new.emoji, 'post', new.target_id::text, null
    );
  elsif new.target_type = 'comment' then
    select author_id into owner from public.post_comments where id = new.target_id;
    perform public.emit_notification(
      owner, new.user_id, 'post_reaction',
      actor_name || ' liked your comment', new.emoji, 'comment', new.target_id::text, null
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_content_reaction on public.content_reactions;
create trigger trg_notify_on_content_reaction
  after insert on public.content_reactions
  for each row execute function public.trg_notify_on_content_reaction();

-- created: 2026-11-25T00:30:00-08:00 — Siobhan story reaction → prior commenters
create or replace function public.trg_notify_on_news_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  prior record;
begin
  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.user_id;
  for prior in
    select distinct c.author_id
    from public.news_comments c
    where c.article_key = new.article_key
      and c.deleted_at is null
      and c.author_id is distinct from new.user_id
  loop
    perform public.emit_notification(
      prior.author_id, new.user_id, 'news_story_reaction',
      actor_name || ' reacted to a story you commented on',
      new.emoji, 'news', new.article_key, null
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_notify_on_news_reaction on public.news_reactions;
create trigger trg_notify_on_news_reaction
  after insert on public.news_reactions
  for each row execute function public.trg_notify_on_news_reaction();

-- Teacher RPCs emit pins
-- created: 2026-11-25T00:30:00-08:00
create or replace function public.teacher_set_restriction(
  p_password text,
  p_user_id uuid,
  p_block_post boolean,
  p_block_message boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bp boolean := coalesce(p_block_post, false);
  bm boolean := coalesce(p_block_message, false);
  detail text;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  insert into public.user_restrictions (user_id, block_post, block_message, updated_at)
  values (p_user_id, bp, bm, now())
  on conflict (user_id) do update
    set block_post = excluded.block_post,
        block_message = excluded.block_message,
        updated_at = now();

  if bp or bm then
    detail := trim(both ' · ' from concat_ws(' · ',
      case when bp then 'posting blocked' else null end,
      case when bm then 'messaging blocked' else null end
    ));
    perform public.emit_notification(
      p_user_id, null, 'teacher_restrict',
      'Teacher update', detail, 'restriction', p_user_id::text, null
    );
  end if;
end;
$$;

create or replace function public.teacher_set_verify(
  p_password text,
  p_user_id uuid,
  p_tier text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  tier text := nullif(lower(trim(coalesce(p_tier, ''))), '');
  rec public.profiles;
  label text;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  if tier is not null and tier not in ('pink', 'gold', 'blue') then
    raise exception 'Tier must be pink, gold, blue, or blank to remove';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  perform set_config('app.allow_verify_change', 'on', true);

  update public.profiles
    set verify_tier = tier
  where id = p_user_id
  returning * into rec;

  label := case
    when tier is null then 'Verification removed'
    else 'You earned a ' || tier || ' check'
  end;
  perform public.emit_notification(
    p_user_id, null, 'teacher_verify',
    'Teacher update', label, 'profile', p_user_id::text, null
  );

  return rec;
end;
$$;

revoke all on function public.teacher_set_restriction(text, uuid, boolean, boolean) from public;
revoke all on function public.teacher_set_verify(text, uuid, text) from public;
grant execute on function public.teacher_set_restriction(text, uuid, boolean, boolean) to authenticated, anon;
grant execute on function public.teacher_set_verify(text, uuid, text) to authenticated, anon;

-- Realtime (ignore if already added)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
  when undefined_object then null;
  when others then null;
end $$;
