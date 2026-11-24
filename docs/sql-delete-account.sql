-- created: 2026-11-24T12:35:00-08:00
-- PRD v2 B8: self-serve delete account (keepers protected)

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uname text;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  select username into uname from public.profiles where id = uid;
  if lower(coalesce(uname, '')) in ('diyaan', 'rafflesiaonline') then
    raise exception 'This club account cannot be deleted here.';
  end if;

  update public.posts
    set deleted_at = coalesce(deleted_at, now()), deleted_reason = coalesce(deleted_reason, 'account deleted')
  where author_id = uid and deleted_at is null;

  update public.post_comments
    set deleted_at = coalesce(deleted_at, now()), deleted_reason = coalesce(deleted_reason, 'account deleted')
  where author_id = uid and deleted_at is null;

  delete from public.follows where follower_id = uid or following_id = uid;
  delete from public.chat_members where user_id = uid;
  delete from public.message_likes where user_id = uid;

  delete from public.profiles where id = uid;

  -- Remove auth user when permitted on Free tier
  begin
    delete from auth.users where id = uid;
  exception when others then
    -- profile already gone; client should signOut
    null;
  end;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
