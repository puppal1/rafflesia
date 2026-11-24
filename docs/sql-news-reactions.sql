-- created: 2026-11-24T14:20:00-08:00
-- Emoji likes on Siobhan news articles (keyed by article_key text)

create table if not exists public.news_reactions (
  id uuid primary key default gen_random_uuid(),
  article_key text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (article_key, user_id)
);

create index if not exists news_reactions_article_idx
  on public.news_reactions (article_key);

alter table public.news_reactions enable row level security;

drop policy if exists "news_reactions_select" on public.news_reactions;
create policy "news_reactions_select" on public.news_reactions
  for select to authenticated using (true);

drop policy if exists "news_reactions_insert_own" on public.news_reactions;
create policy "news_reactions_insert_own" on public.news_reactions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "news_reactions_update_own" on public.news_reactions;
create policy "news_reactions_update_own" on public.news_reactions
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "news_reactions_delete_own" on public.news_reactions;
create policy "news_reactions_delete_own" on public.news_reactions
  for delete to authenticated using (user_id = auth.uid());

create or replace function public.set_news_reaction(
  p_article_key text,
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
  akey text := left(trim(coalesce(p_article_key, '')), 500);
  existing text;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if akey = '' then raise exception 'Missing article'; end if;
  if em = '' or char_length(em) > 16 then raise exception 'Pick an emoji reaction.'; end if;

  select emoji into existing
  from public.news_reactions
  where article_key = akey and user_id = uid;

  if existing is not null and existing = em then
    delete from public.news_reactions
    where article_key = akey and user_id = uid;
  elsif existing is not null then
    update public.news_reactions
      set emoji = em, created_at = now()
    where article_key = akey and user_id = uid;
  else
    insert into public.news_reactions (article_key, user_id, emoji)
    values (akey, uid, em);
  end if;
end;
$$;

revoke all on function public.set_news_reaction(text, text) from public;
grant execute on function public.set_news_reaction(text, text) to authenticated;

-- updated: 2026-11-24T14:20:00-08:00 — blank URL clears avatar/banner
create or replace function public.set_my_profile_image(p_kind text, p_url text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.profiles;
  cleaned text := nullif(trim(coalesce(p_url, '')), '');
begin
  if uid is null then
    raise exception 'Not logged in (auth.uid is null)';
  end if;
  if p_kind not in ('avatar', 'banner') then
    raise exception 'kind must be avatar or banner';
  end if;

  perform public.ensure_my_profile('user' || substr(replace(uid::text, '-', ''), 1, 8), 'Friend');

  if p_kind = 'avatar' then
    update public.profiles
      set avatar_url = cleaned
      where id = uid
      returning * into rec;
  else
    update public.profiles
      set banner_url = cleaned
      where id = uid
      returning * into rec;
  end if;

  return rec;
end;
$$;

revoke all on function public.set_my_profile_image(text, text) from public;
grant execute on function public.set_my_profile_image(text, text) to authenticated;
