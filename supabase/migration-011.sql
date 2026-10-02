-- Migration 011: editable homepage "Wedding feature" section.
-- The "Your Moments. Beautifully Managed." block on the homepage is currently
-- hardcoded. This seeds it as Page Content blocks so it can be edited from
-- Admin → Page Content → Home → wedding
-- (text fields, the 6 bullet points, button text, and both images —
-- choose from library, upload, or remove; each falls back to its default).
-- Run once in the Supabase SQL editor. Existing rows are left untouched.
insert into page_content (page, section, key, label, value, image_url, sort)
values
  ('home', 'wedding', 'eyebrow', 'Eyebrow', 'Weddings', '', 0),
  ('home', 'wedding', 'title1', 'Title line 1', 'Your Moments.', '', 1),
  ('home', 'wedding', 'title2', 'Title line 2 (italic)', 'Beautifully Managed.', '', 2),
  ('home', 'wedding', 'lead', 'Intro paragraph', 'From intimate family functions to grand destination weddings — décor, entertainment and complete coordination under one roof.', '', 3),
  ('home', 'wedding', 'point1', 'Bullet point 1', 'Wedding planning & coordination', '', 4),
  ('home', 'wedding', 'point2', 'Bullet point 2', 'Destination weddings', '', 5),
  ('home', 'wedding', 'point3', 'Bullet point 3', 'Sangeet, mehendi & choreography', '', 6),
  ('home', 'wedding', 'point4', 'Bullet point 4', 'Celebrity artists & entertainment', '', 7),
  ('home', 'wedding', 'point5', 'Bullet point 5', 'Décor & stage production', '', 8),
  ('home', 'wedding', 'point6', 'Bullet point 6', 'Hospitality & guest management', '', 9),
  ('home', 'wedding', 'cta_text', 'Button text', 'Plan Your Dream Wedding', '', 10),
  ('home', 'wedding', 'image', 'Main image', '', '/images/fb-floral-mandap-stage.jpg', 11),
  ('home', 'wedding', 'image_inset', 'Inset collage image', '', '/images/ig-haldi-decor-collage.jpg', 12)
on conflict (page, section, key) do nothing;
