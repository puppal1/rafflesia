-- created: 2026-11-24T12:35:00-08:00
-- PRD v2 B1: ToS / Privacy consent ledger

create table if not exists public.consent_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  username text not null,
  agreed_at timestamptz not null default now(),
  tos_version text not null default '2026-11-24',
  privacy_version text not null default '2026-11-24',
  ip_address text,
  device_info text,
  raw_ack jsonb
);

create index if not exists consent_ledger_user_idx on public.consent_ledger (user_id);
alter table public.consent_ledger enable row level security;

drop policy if exists "consent_ledger_no_kid_select" on public.consent_ledger;
-- Kids do not read; inserts via security definer RPC only

create or replace function public.record_signup_consent(
  p_username text,
  p_tos_version text default '2026-11-24',
  p_privacy_version text default '2026-11-24',
  p_ip_address text default null,
  p_device_info text default null
)
returns public.consent_ledger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.consent_ledger;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  insert into public.consent_ledger (
    user_id, username, tos_version, privacy_version, ip_address, device_info, raw_ack
  ) values (
    uid,
    lower(trim(p_username)),
    p_tos_version,
    p_privacy_version,
    nullif(trim(coalesce(p_ip_address, '')), ''),
    nullif(trim(coalesce(p_device_info, '')), ''),
    jsonb_build_object('checkbox', true, 'tos', p_tos_version, 'privacy', p_privacy_version)
  )
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.record_signup_consent(text, text, text, text, text) from public;
grant execute on function public.record_signup_consent(text, text, text, text, text) to authenticated;
