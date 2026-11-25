-- created: 2026-11-24T23:55:00-08:00
-- Teacher can rotate the shared console password (stored in app_settings). Run in Supabase.

create or replace function public.teacher_change_password(p_current text, p_new text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  new_pw text := trim(coalesce(p_new, ''));
begin
  -- created: 2026-11-24T23:55:00-08:00
  if not public.verify_teacher_password(p_current) then
    raise exception 'Wrong teacher password';
  end if;
  if length(new_pw) < 8 then
    raise exception 'New teacher password must be at least 8 characters';
  end if;
  if new_pw = coalesce(p_current, '') then
    raise exception 'New password must be different';
  end if;
  insert into public.app_settings (key, value)
  values ('teacher_password', new_pw)
  on conflict (key) do update set value = excluded.value;
  return true;
end;
$$;

revoke all on function public.teacher_change_password(text, text) from public;
grant execute on function public.teacher_change_password(text, text) to authenticated, anon;
