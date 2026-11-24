-- created: 2026-11-24T13:35:00-08:00
-- Emoji reactions on posts and comments (For You)

create table if not exists public.content_reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (target_type, target_id, user_id)
);

create index if not exists content_reactions_target_idx
  on public.content_reactions (target_type, target_id);

alter table public.content_reactions enable row level security;

drop policy if exists "content_reactions_select" on public.content_reactions;
create policy "content_reactions_select" on public.content_reactions
  for select to authenticated using (true);

drop policy if exists "content_reactions_insert_own" on public.content_reactions;
create policy "content_reactions_insert_own" on public.content_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "content_reactions_update_own" on public.content_reactions;
create policy "content_reactions_update_own" on public.content_reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "content_reactions_delete_own" on public.content_reactions;
create policy "content_reactions_delete_own" on public.content_reactions
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.set_content_reaction(
  p_target_type text,
  p_target_id uuid,
  p_emoji text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  em text := trim(coalesce(p_emoji, ''));
  existing text;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if p_target_type not in ('post', 'comment') then raise exception 'Bad target'; end if;
  if em = '' or char_length(em) > 16 then raise exception 'Pick an emoji reaction.'; end if;

  select emoji into existing
  from public.content_reactions
  where target_type = p_target_type and target_id = p_target_id and user_id = uid;

  if existing is not null and existing = em then
    delete from public.content_reactions
    where target_type = p_target_type and target_id = p_target_id and user_id = uid;
  elsif existing is not null then
    update public.content_reactions
      set emoji = em, created_at = now()
    where target_type = p_target_type and target_id = p_target_id and user_id = uid;
  else
    insert into public.content_reactions (target_type, target_id, user_id, emoji)
    values (p_target_type, p_target_id, uid, em);
  end if;
end;
$$;

revoke all on function public.set_content_reaction(text, uuid, text) from public;
grant execute on function public.set_content_reaction(text, uuid, text) to authenticated;
