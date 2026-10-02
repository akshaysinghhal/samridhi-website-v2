-- Migration 008: video testimonials.
-- Adds an optional video_url to testimonials so a video testimonial can be
-- uploaded/chosen in Admin → Testimonials. Run once in the Supabase SQL editor.
-- Public visibility still requires status='published' AND permission_granted=true
-- (existing RLS policy), so no consent rules change.
alter table testimonials add column if not exists video_url text;
