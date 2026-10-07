-- Profile, experience, skills, services and the rest of the site copy, edited from the dashboard.
-- One row per section; `value` holds that section's JSON (shape mirrors src/data/profile.ts).
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.site_content enable row level security;
-- Everything here is shown on the public site, so anyone may read; writes only via the service role.
drop policy if exists "public read site content" on public.site_content;
create policy "public read site content" on public.site_content for select to anon, authenticated using (true);
