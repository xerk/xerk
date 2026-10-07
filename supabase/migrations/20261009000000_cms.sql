-- CMS: optional post video, public media bucket for uploads from /admin.
alter table public.posts add column if not exists video_url text;

-- Public-read bucket for images, videos and demo files uploaded from /admin (writes go through signed upload URLs).
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
