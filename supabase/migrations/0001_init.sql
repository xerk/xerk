-- xerk.io schema. Apply with: supabase db push   (or paste into the Supabase SQL editor)
-- Public (anon) can read published content only; leads/visits are written by the server with the service role.

create table if not exists public.projects (
  slug text primary key,
  code text not null,
  title text not null,
  data jsonb not null,               -- full Project object (see src/data/projects.ts)
  video_url text,
  embed_url text,
  published boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  slug text primary key,
  title text not null,
  summary text,
  tags text[] default '{}',
  body_md text not null default '',
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  source text default 'site',
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text not null,
  budget text,
  service text,
  message text,
  source text,
  path text,
  country text,
  status text not null default 'new' check (status in ('new', 'replied', 'won', 'lost', 'spam'))
);

create table if not exists public.visits (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  country text,
  city text,
  lang text,
  tz text,
  ua text
);
create index if not exists visits_created_at_idx on public.visits (created_at desc);

create table if not exists public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  url text not null,
  target text default 'both',
  status text not null default 'queued' check (status in ('queued', 'rendering', 'ready', 'scheduled', 'failed')),
  video_url text,
  postiz_ids text[],
  notes text
);

alter table public.projects enable row level security;
alter table public.posts enable row level security;
alter table public.leads enable row level security;
alter table public.visits enable row level security;
alter table public.video_jobs enable row level security;

drop policy if exists "public read published projects" on public.projects;
create policy "public read published projects" on public.projects for select to anon, authenticated using (published);
drop policy if exists "public read published posts" on public.posts;
create policy "public read published posts" on public.posts for select to anon, authenticated using (status = 'published');
-- No anon policies on leads / visits / video_jobs: only the service role (server) can read or write them.

-- Storage bucket for rendered videos (public read)
insert into storage.buckets (id, name, public) values ('videos', 'videos', true) on conflict (id) do nothing;
