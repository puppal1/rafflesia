-- created: 2026-11-23T22:15:00-08:00
-- Play games: personal + club high scores

create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index if not exists game_scores_game_score_idx
  on public.game_scores (game_id, score desc);

create index if not exists game_scores_user_game_idx
  on public.game_scores (user_id, game_id, score desc);

alter table public.game_scores enable row level security;

drop policy if exists "game_scores_select" on public.game_scores;
create policy "game_scores_select" on public.game_scores
  for select to authenticated using (true);

drop policy if exists "game_scores_insert_own" on public.game_scores;
create policy "game_scores_insert_own" on public.game_scores
  for insert to authenticated with check (user_id = auth.uid());

create or replace function public.submit_game_score(p_game_id text, p_score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if p_score is null or p_score < 0 then raise exception 'Bad score'; end if;
  insert into public.game_scores (user_id, game_id, score)
  values (uid, lower(trim(p_game_id)), p_score);
end;
$$;

create or replace function public.my_best_game_score(p_game_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  best integer;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  select max(score) into best
  from public.game_scores
  where user_id = uid and game_id = lower(trim(p_game_id));
  return coalesce(best, 0);
end;
$$;

create or replace function public.club_top_game_scores(p_game_id text, p_limit integer default 10)
returns table (
  username text,
  display_name text,
  score integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  return query
  select p.username, p.display_name, s.score, s.created_at
  from (
    select distinct on (gs.user_id)
      gs.user_id, gs.score, gs.created_at
    from public.game_scores gs
    where gs.game_id = lower(trim(p_game_id))
    order by gs.user_id, gs.score desc, gs.created_at desc
  ) s
  join public.profiles p on p.id = s.user_id
  order by s.score desc, s.created_at asc
  limit greatest(coalesce(p_limit, 10), 1);
end;
$$;

revoke all on function public.submit_game_score(text, integer) from public;
revoke all on function public.my_best_game_score(text) from public;
revoke all on function public.club_top_game_scores(text, integer) from public;

grant execute on function public.submit_game_score(text, integer) to authenticated;
grant execute on function public.my_best_game_score(text) to authenticated;
grant execute on function public.club_top_game_scores(text, integer) to authenticated;
