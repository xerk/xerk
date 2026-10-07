-- SEO tracking for the dashboard (/seo): the keyword map, rank and AI-citation checks, and on-page audits.
-- RLS is on with no policies, so only the service role (server code, scripts, cron) can read or write.

create table if not exists public.seo_keywords (
  keyword text primary key,
  intent text not null default 'informational' check (intent in ('navigational', 'commercial', 'transactional', 'informational')),
  target_path text not null default '/',
  priority int not null default 2 check (priority between 1 and 3),
  difficulty text check (difficulty in ('low', 'medium', 'high')),
  strategy text check (strategy in ('existing', 'improve', 'new')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per check. `keyword` is a keyword from seo_keywords for search engines, or the prompt text for AI assistants.
-- position: 1-based rank of the first xerk.io result, null when not found in the checked depth.
-- cited: AI assistants only; null means not tested.
create table if not exists public.seo_ranks (
  id bigint generated always as identity primary key,
  keyword text not null,
  engine text not null check (engine in ('google', 'bing', 'web', 'chatgpt', 'perplexity', 'claude', 'gemini', 'gsc')),
  position int check (position is null or position > 0),
  url text,
  cited boolean,
  depth int,
  source text,
  notes text,
  checked_at timestamptz not null default now()
);
create index if not exists seo_ranks_kw_engine_time on public.seo_ranks (keyword, engine, checked_at desc);
create index if not exists seo_ranks_time on public.seo_ranks (checked_at desc);

-- One row per audited page per run. issues: [{ id, severity: 'error'|'warn'|'info', message }]. meta: what was measured.
create table if not exists public.seo_audits (
  id bigint generated always as identity primary key,
  run_id uuid not null,
  path text not null,
  url text,
  score int not null check (score between 0 and 100),
  issues jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);
create index if not exists seo_audits_path_time on public.seo_audits (path, checked_at desc);
create index if not exists seo_audits_run on public.seo_audits (run_id);

alter table public.seo_keywords enable row level security;
alter table public.seo_ranks enable row level security;
alter table public.seo_audits enable row level security;
