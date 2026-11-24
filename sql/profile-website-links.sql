-- created: 2026-11-24T00:05:00-08:00
-- Profile website links (kids edit own; shown on profiles)

alter table public.profiles
  add column if not exists website_links jsonb not null default '[]'::jsonb;

comment on column public.profiles.website_links is
  'JSON array of {title, url} links for the profile page';
