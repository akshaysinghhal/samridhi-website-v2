-- Migration 009: editable About-page story image.
-- Adds a "Story image" block to the About page so the photo beside the
-- "Our Story" text can be changed from Admin → Page Content → About
-- (choose from library, upload, or remove — falls back to the default).
-- Run once in the Supabase SQL editor. Existing rows are left untouched.
insert into page_content (page, section, key, label, value, image_url, sort)
values
  ('about', 'story', 'image', 'Story image', '', '/images/fb-performer-big-audience.jpg', 0)
on conflict (page, section, key) do nothing;
