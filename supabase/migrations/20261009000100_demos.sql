-- Demo / artifact HTML uploaded from /admin. Supabase Storage serves .html as text/plain (sandboxed),
-- so the HTML lives here and is served by src/app/demos/[slug]/route.ts with text/html + a sandbox CSP.
create table if not exists public.demos (
  slug text primary key,
  html text not null,
  updated_at timestamptz not null default now()
);
alter table public.demos enable row level security;
-- No anon policies: only the server (service role) reads and writes demos.
