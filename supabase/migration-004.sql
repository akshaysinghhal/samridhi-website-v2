-- migration-004: SEO-friendly slugs for international_shows.
-- Run once in the Supabase SQL editor (after migration-003).

alter table international_shows
  add column if not exists slug text;

-- Backfill slugs from titles: lowercase, non-alphanumerics -> hyphens.
update international_shows
set slug = nullif(
  regexp_replace(
    regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'),
    '(^-+|-+$)', '', 'g'
  ), '')
where slug is null or slug = '';

-- Resolve duplicates by appending an 8-char id suffix (keeps URLs unique).
with ranked as (
  select id, slug,
         row_number() over (partition by slug order by created_at, id) as rn
  from international_shows
  where slug is not null
)
update international_shows s
set slug = r.slug || '-' || left(replace(s.id::text, '-', ''), 8)
from ranked r
where s.id = r.id and r.rn > 1;

create unique index if not exists international_shows_slug_key
  on international_shows (slug);
