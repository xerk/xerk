-- First-party analytics: pageviews and key events (written by the server with the service role).
create table if not exists public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null,
  path text,
  sid text,
  referrer text,
  utm_source text,
  country text,
  city text,
  props jsonb
);
create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_name_idx on public.events (name, created_at desc);
alter table public.events enable row level security;
alter table public.visits add column if not exists sid text;
