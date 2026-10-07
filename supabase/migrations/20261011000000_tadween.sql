-- Posts published from Tadween (post.xerk.io "Website" channel): upsert key + language/direction.
alter table public.posts add column if not exists external_id text;
alter table public.posts add column if not exists lang text;
alter table public.posts add column if not exists dir text check (dir in ('ltr', 'rtl'));
create unique index if not exists posts_external_id_key on public.posts (external_id) where external_id is not null;
