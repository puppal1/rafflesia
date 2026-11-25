-- created: 2026-11-25T01:25:00-08:00
-- PRD v4: DM unread, teacher kid password reset, reports, edit TTL, lounge polls
-- RUN in Supabase SQL Editor (after prior phase SQL).

-- ========== J1: DM unread (private 1:1 only) ==========
-- created: 2026-11-25T01:25:00-08:00

create table if not exists public.dm_read_state (
  user_id uuid not null references public.profiles(id) on delete cascade,
  chat_id uuid not null references public.chats(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (user_id, chat_id)
);

alter table public.dm_read_state enable row level security;

drop policy if exists "dm_read_select_own" on public.dm_read_state;
create policy "dm_read_select_own" on public.dm_read_state for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "dm_read_upsert_own" on public.dm_read_state;
create policy "dm_read_upsert_own" on public.dm_read_state for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.mark_dm_read(p_chat_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  is_dm boolean;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  select exists(
    select 1 from public.chats c
    join public.chat_members m on m.chat_id = c.id and m.user_id = uid
    where c.id = p_chat_id and c.is_group = false
  ) into is_dm;
  if not is_dm then
    return; -- ignore lounge/group; never track as DM unread
  end if;
  insert into public.dm_read_state (user_id, chat_id, last_read_at)
  values (uid, p_chat_id, now())
  on conflict (user_id, chat_id) do update set last_read_at = excluded.last_read_at;
end;
$$;

create or replace function public.count_my_unread_dms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n integer := 0;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then return 0; end if;
  select count(*)::integer into n
  from public.messages msg
  join public.chats c on c.id = msg.chat_id and c.is_group = false
  join public.chat_members m on m.chat_id = c.id and m.user_id = uid
  left join public.dm_read_state r on r.chat_id = c.id and r.user_id = uid
  where msg.sender_id <> uid
    and msg.created_at > coalesce(r.last_read_at, '1970-01-01'::timestamptz);
  return coalesce(n, 0);
end;
$$;

create or replace function public.list_my_dm_unread_counts()
returns table(chat_id uuid, unread_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then return; end if;
  return query
  select c.id,
    count(msg.id)::integer as unread_count
  from public.chats c
  join public.chat_members m on m.chat_id = c.id and m.user_id = uid
  left join public.dm_read_state r on r.chat_id = c.id and r.user_id = uid
  left join public.messages msg
    on msg.chat_id = c.id
    and msg.sender_id <> uid
    and msg.created_at > coalesce(r.last_read_at, '1970-01-01'::timestamptz)
  where c.is_group = false
  group by c.id
  having count(msg.id) > 0;
end;
$$;

revoke all on function public.mark_dm_read(uuid) from public;
revoke all on function public.count_my_unread_dms() from public;
revoke all on function public.list_my_dm_unread_counts() from public;
grant execute on function public.mark_dm_read(uuid) to authenticated;
grant execute on function public.count_my_unread_dms() to authenticated;
grant execute on function public.list_my_dm_unread_counts() to authenticated;

-- ========== J2: Teacher reset kid password ==========
-- created: 2026-11-25T01:25:00-08:00

create table if not exists public.teacher_password_resets (
  id uuid primary key default gen_random_uuid(),
  target_user_id uuid not null references public.profiles(id) on delete cascade,
  target_username text not null,
  created_at timestamptz not null default now()
);

create or replace function public.teacher_reset_kid_password(
  p_password text,
  p_username text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  uname text := lower(trim(both from coalesce(p_username, '')));
  new_pw text := coalesce(p_new_password, '');
  target uuid;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  uname := regexp_replace(uname, '^@', '');
  if uname = '' then raise exception 'Pick a username'; end if;
  if uname in ('diyaan', 'rafflesiaonline') then
    raise exception 'This club account cannot be reset here.';
  end if;
  if length(new_pw) < 6 then
    raise exception 'New password must be at least 6 characters';
  end if;
  select id into target from public.profiles where lower(username) = uname limit 1;
  if target is null then raise exception 'User not found'; end if;

  update auth.users
    set encrypted_password = crypt(new_pw, gen_salt('bf')),
        updated_at = now()
  where id = target;

  if not found then
    raise exception 'Auth user missing for that profile';
  end if;

  insert into public.teacher_password_resets (target_user_id, target_username)
  values (target, uname);
  return true;
end;
$$;

revoke all on function public.teacher_reset_kid_password(text, text, text) from public;
grant execute on function public.teacher_reset_kid_password(text, text, text) to authenticated, anon;

-- ========== J3: Kid reports ==========
-- created: 2026-11-25T01:25:00-08:00

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);

alter table public.content_reports enable row level security;

-- Kids insert via RPC only; no direct select of others' reports
drop policy if exists "reports_no_direct" on public.content_reports;
create policy "reports_no_direct" on public.content_reports for select to authenticated
  using (false);

create or replace function public.create_content_report(
  p_target_type text,
  p_target_id uuid,
  p_reason text
)
returns public.content_reports
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  body text := trim(coalesce(p_reason, ''));
  recent int;
  rec public.content_reports;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  if p_target_type not in ('post', 'comment', 'user') then
    raise exception 'Invalid report type';
  end if;
  if length(body) < 3 then raise exception 'Please write a short reason.'; end if;
  if length(body) > 400 then raise exception 'Reason is too long.'; end if;

  select count(*)::int into recent
  from public.content_reports
  where reporter_id = uid and created_at > now() - interval '10 minutes';
  if recent >= 8 then
    raise exception 'Slow down — too many reports. Try again later.';
  end if;

  if p_target_type = 'user' and p_target_id = uid then
    raise exception 'You cannot report yourself.';
  end if;

  insert into public.content_reports (reporter_id, target_type, target_id, reason)
  values (uid, p_target_type, p_target_id, body)
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.teacher_list_reports(p_password text, p_limit int default 80)
returns table (
  id uuid,
  reporter_username text,
  target_type text,
  target_id uuid,
  reason text,
  status text,
  created_at timestamptz,
  target_preview text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- created: 2026-11-25T01:25:00-08:00
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  return query
  select r.id,
    coalesce(p.username, '?')::text,
    r.target_type,
    r.target_id,
    r.reason,
    r.status,
    r.created_at,
    case
      when r.target_type = 'user' then coalesce((select '@' || u.username from public.profiles u where u.id = r.target_id), 'user')
      when r.target_type = 'post' then left(coalesce((select po.body from public.posts po where po.id = r.target_id), '(post)'), 120)
      when r.target_type = 'comment' then left(coalesce((select c.body from public.post_comments c where c.id = r.target_id), '(comment)'), 120)
      else ''
    end::text
  from public.content_reports r
  left join public.profiles p on p.id = r.reporter_id
  order by case when r.status = 'open' then 0 else 1 end, r.created_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 200));
end;
$$;

create or replace function public.teacher_mark_report_done(p_password text, p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- created: 2026-11-25T01:25:00-08:00
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  update public.content_reports set status = 'done' where id = p_report_id;
end;
$$;

revoke all on function public.create_content_report(text, uuid, text) from public;
revoke all on function public.teacher_list_reports(text, int) from public;
revoke all on function public.teacher_mark_report_done(text, uuid) from public;
grant execute on function public.create_content_report(text, uuid, text) to authenticated;
grant execute on function public.teacher_list_reports(text, int) to authenticated, anon;
grant execute on function public.teacher_mark_report_done(text, uuid) to authenticated, anon;

-- ========== J4: Edit own post/comment — 15 minute TTL ==========
-- created: 2026-11-25T01:25:00-08:00

alter table public.posts add column if not exists edited_at timestamptz;
alter table public.post_comments add column if not exists edited_at timestamptz;

create or replace function public.update_my_post(p_post_id uuid, p_body text)
returns public.posts
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.posts;
  body text := trim(coalesce(p_body, ''));
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  if length(body) > 2000 then raise exception 'Post is too long.'; end if;
  if to_regprocedure('public.assert_kid_text_allowed(text)') is not null then
    perform public.assert_kid_text_allowed(body);
  end if;
  update public.posts
    set body = nullif(body, ''),
        edited_at = now()
  where id = p_post_id
    and author_id = uid
    and deleted_at is null
    and created_at > now() - interval '15 minutes'
  returning * into rec;
  if rec.id is null then
    raise exception 'Edit window closed (15 minutes) or post not found.';
  end if;
  return rec;
end;
$$;

create or replace function public.update_my_comment(p_comment_id uuid, p_body text)
returns public.post_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.post_comments;
  body text := trim(coalesce(p_body, ''));
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  if length(body) = 0 then raise exception 'Write a comment.'; end if;
  if length(body) > 500 then raise exception 'Comment is too long.'; end if;
  if to_regprocedure('public.assert_kid_text_allowed(text)') is not null then
    perform public.assert_kid_text_allowed(body);
  end if;
  update public.post_comments
    set body = body,
        edited_at = now()
  where id = p_comment_id
    and author_id = uid
    and deleted_at is null
    and created_at > now() - interval '15 minutes'
  returning * into rec;
  if rec.id is null then
    raise exception 'Edit window closed (15 minutes) or comment not found.';
  end if;
  return rec;
end;
$$;

revoke all on function public.update_my_post(uuid, text) from public;
revoke all on function public.update_my_comment(uuid, text) from public;
grant execute on function public.update_my_post(uuid, text) to authenticated;
grant execute on function public.update_my_comment(uuid, text) to authenticated;

-- ========== J5: Lounge polls ==========
-- created: 2026-11-25T01:25:00-08:00

create table if not exists public.chat_polls (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.chat_polls(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table if not exists public.chat_poll_votes (
  poll_id uuid not null references public.chat_polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_id uuid not null references public.chat_poll_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create index if not exists chat_polls_chat_idx on public.chat_polls (chat_id, created_at desc);

alter table public.chat_polls enable row level security;
alter table public.chat_poll_options enable row level security;
alter table public.chat_poll_votes enable row level security;

drop policy if exists "polls_select_member" on public.chat_polls;
create policy "polls_select_member" on public.chat_polls for select to authenticated
  using (exists (
    select 1 from public.chat_members m where m.chat_id = chat_polls.chat_id and m.user_id = auth.uid()
  ));

drop policy if exists "poll_opts_select" on public.chat_poll_options;
create policy "poll_opts_select" on public.chat_poll_options for select to authenticated
  using (exists (
    select 1 from public.chat_polls p
    join public.chat_members m on m.chat_id = p.chat_id and m.user_id = auth.uid()
    where p.id = chat_poll_options.poll_id
  ));

drop policy if exists "poll_votes_select" on public.chat_poll_votes;
create policy "poll_votes_select" on public.chat_poll_votes for select to authenticated
  using (exists (
    select 1 from public.chat_polls p
    join public.chat_members m on m.chat_id = p.chat_id and m.user_id = auth.uid()
    where p.id = chat_poll_votes.poll_id
  ));

create or replace function public.create_chat_poll(
  p_chat_id uuid,
  p_question text,
  p_options text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  q text := trim(coalesce(p_question, ''));
  opts text[] := coalesce(p_options, array[]::text[]);
  lounge text;
  is_grp boolean;
  poll_id uuid;
  i int;
  lab text;
  block_msg boolean := false;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  if length(q) < 3 then raise exception 'Write a poll question.'; end if;
  if length(q) > 200 then raise exception 'Question is too long.'; end if;
  if array_length(opts, 1) is null or array_length(opts, 1) < 2 or array_length(opts, 1) > 4 then
    raise exception 'Polls need 2 to 4 choices.';
  end if;

  if to_regclass('public.user_restrictions') is not null then
    select coalesce(block_message, false) into block_msg
    from public.user_restrictions where user_id = uid;
  end if;
  if coalesce(block_msg, false) then raise exception 'Messaging is restricted by a teacher'; end if;

  if not exists (
    select 1 from public.chat_members where chat_id = p_chat_id and user_id = uid
  ) then raise exception 'Not in this chat'; end if;

  select c.is_group, c.lounge_key into is_grp, lounge
  from public.chats c where c.id = p_chat_id;
  if not coalesce(is_grp, false) then
    raise exception 'Polls are for Lounge / groups only.';
  end if;
  if lounge = 'announcements' then
    if not exists (
      select 1 from public.profiles where id = uid and lower(username) = 'rafflesiaonline'
    ) then
      raise exception 'Only @rafflesiaonline can poll in Announcements.';
    end if;
  end if;

  if to_regprocedure('public.assert_kid_text_allowed(text)') is not null then
    perform public.assert_kid_text_allowed(q);
  end if;

  insert into public.chat_polls (chat_id, created_by, question)
  values (p_chat_id, uid, q)
  returning id into poll_id;

  for i in 1..array_length(opts, 1) loop
    lab := trim(opts[i]);
    if length(lab) < 1 then raise exception 'Empty poll choice.'; end if;
    if length(lab) > 80 then raise exception 'Choice is too long.'; end if;
    if to_regprocedure('public.assert_kid_text_allowed(text)') is not null then
      perform public.assert_kid_text_allowed(lab);
    end if;
    insert into public.chat_poll_options (poll_id, label, sort_order)
    values (poll_id, lab, i);
  end loop;

  -- system message marker for stream
  insert into public.messages (chat_id, sender_id, body, video_url)
  values (p_chat_id, uid, '@@poll:' || poll_id::text || '@@', null);

  return poll_id;
end;
$$;

create or replace function public.vote_chat_poll(p_poll_id uuid, p_option_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  chat uuid;
  closed timestamptz;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  select chat_id, closed_at into chat, closed from public.chat_polls where id = p_poll_id;
  if chat is null then raise exception 'Poll not found'; end if;
  if closed is not null then raise exception 'This poll is closed.'; end if;
  if not exists (
    select 1 from public.chat_members where chat_id = chat and user_id = uid
  ) then raise exception 'Not in this chat'; end if;
  if not exists (
    select 1 from public.chat_poll_options where id = p_option_id and poll_id = p_poll_id
  ) then raise exception 'Bad choice'; end if;

  insert into public.chat_poll_votes (poll_id, user_id, option_id)
  values (p_poll_id, uid, p_option_id)
  on conflict (poll_id, user_id) do update set option_id = excluded.option_id, created_at = now();
end;
$$;

create or replace function public.close_chat_poll(p_poll_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  creator uuid;
  lounge text;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  select p.created_by, c.lounge_key into creator, lounge
  from public.chat_polls p
  join public.chats c on c.id = p.chat_id
  where p.id = p_poll_id;
  if creator is null then raise exception 'Poll not found'; end if;
  if creator <> uid and not (
    lounge = 'announcements' and exists (
      select 1 from public.profiles where id = uid and lower(username) = 'rafflesiaonline'
    )
  ) then
    raise exception 'Only the poll creator can close this.';
  end if;
  update public.chat_polls set closed_at = now() where id = p_poll_id and closed_at is null;
end;
$$;

create or replace function public.get_chat_poll(p_poll_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  p public.chat_polls;
  result jsonb;
begin
  -- created: 2026-11-25T01:25:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  select * into p from public.chat_polls where id = p_poll_id;
  if p.id is null then raise exception 'Poll not found'; end if;
  if not exists (
    select 1 from public.chat_members where chat_id = p.chat_id and user_id = uid
  ) then raise exception 'Not in this chat'; end if;

  select jsonb_build_object(
    'id', p.id,
    'chat_id', p.chat_id,
    'created_by', p.created_by,
    'question', p.question,
    'closed_at', p.closed_at,
    'created_at', p.created_at,
    'my_option_id', (select v.option_id from public.chat_poll_votes v where v.poll_id = p.id and v.user_id = uid),
    'options', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', o.id,
        'label', o.label,
        'sort_order', o.sort_order,
        'votes', (select count(*) from public.chat_poll_votes vv where vv.option_id = o.id)
      ) order by o.sort_order)
      from public.chat_poll_options o where o.poll_id = p.id
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.create_chat_poll(uuid, text, text[]) from public;
revoke all on function public.vote_chat_poll(uuid, uuid) from public;
revoke all on function public.close_chat_poll(uuid) from public;
revoke all on function public.get_chat_poll(uuid) from public;
grant execute on function public.create_chat_poll(uuid, text, text[]) to authenticated;
grant execute on function public.vote_chat_poll(uuid, uuid) to authenticated;
grant execute on function public.close_chat_poll(uuid) to authenticated;
grant execute on function public.get_chat_poll(uuid) to authenticated;
