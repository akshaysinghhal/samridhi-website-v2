-- Migration 007: dynamic page hero banners.
-- Adds one "Banner image" block per public page hero so the top banner of
-- every section can be changed from Admin → Page Content (no code changes).
-- Run once in the Supabase SQL editor. Existing rows are left untouched.
insert into page_content (page, section, key, label, value, image_url, sort)
values
  ('about', 'hero', 'image', 'Banner image', '', '/images/diwali-stage-group.jpg', 0),
  ('artists', 'hero', 'image', 'Banner image', '', '/images/diwali-live-musical.jpg', 0),
  ('clients', 'hero', 'image', 'Banner image', '', '/images/fb-performer-big-audience.jpg', 0),
  ('contact', 'hero', 'image', 'Banner image', '', '/images/ig-guests-celebrating.jpg', 0),
  ('couple-stories', 'hero', 'image', 'Banner image', '', '/images/ig-couple-portrait.jpg', 0),
  ('gallery', 'hero', 'image', 'Banner image', '', '/images/ig-guests-celebrating.jpg', 0),
  ('international-shows', 'hero', 'image', 'Banner image', '', '/images/poster-china-diwali-2015.jpg', 0),
  ('portfolio', 'hero', 'image', 'Banner image', '', '/images/fb-performer-big-audience.jpg', 0),
  ('press', 'hero', 'image', 'Banner image', '', '/images/press-rajasthan-diwas.jpg', 0),
  ('services', 'hero', 'image', 'Banner image', '', '/images/ig-event-stage.jpg', 0),
  ('testimonials', 'hero', 'image', 'Banner image', '', '/images/ig-sparkler-celebration.jpg', 0),
  ('weddings', 'hero', 'image', 'Banner image', '', '/images/ig-haldi-decor-collage.jpg', 0)
on conflict (page, section, key) do nothing;
