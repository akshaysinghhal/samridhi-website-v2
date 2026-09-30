-- Migration 002 — gallery items, weddings, artists
-- Run this ONCE in Supabase SQL Editor (after schema.sql was already run).
-- For fresh installs, schema.sql already includes these tables.

-- 1. Gallery items (photos + videos shown in the homepage Gallery tabs) ------
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'photo' check (kind in ('photo','video')),
  title text default '',
  image_url text not null default '',   -- photo url, or video thumbnail
  video_url text,                        -- youtube url or uploaded video file
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table gallery_items enable row level security;
drop policy if exists "public read gallery" on gallery_items;
create policy "public read gallery" on gallery_items for select using (true);

-- 2. Weddings -------------------------------------------------------------------
create table if not exists weddings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text default '',
  event_date date,
  description text default '',
  cover_image text,
  gallery text[] default '{}',
  pinned boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table weddings enable row level security;
drop policy if exists "public read weddings" on weddings;
create policy "public read weddings" on weddings for select using (true);

-- 3. Artists ----------------------------------------------------------------------
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  image_url text,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table artists enable row level security;
drop policy if exists "public read artists" on artists;
create policy "public read artists" on artists for select using (true);

-- 4. New page-content blocks ---------------------------------------------------------
insert into page_content (page, section, key, label, value, sort) values
-- HOME / STEPS
('home','steps','eyebrow','Eyebrow','How It Works',1),
('home','steps','title','Headline','From First Call to Final Applause',2),
('home','steps','subtitle','Sub-headline','A simple, stress-free journey — you dream, we deliver.',3),
('home','steps','step1_title','Step 1 title','Share Your Vision',4),
('home','steps','step1_desc','Step 1 text','Tell us about your event — the date, the guests, the budget, the dream.',5),
('home','steps','step2_title','Step 2 title','We Design & Propose',6),
('home','steps','step2_desc','Step 2 text','Themes, venues, artists and décor — a complete plan with transparent pricing.',7),
('home','steps','step3_title','Step 3 title','You Relax, We Prepare',8),
('home','steps','step3_desc','Step 3 text','Bookings, vendors, rehearsals — every detail handled by our team.',9),
('home','steps','step4_title','Step 4 title','We Execute Flawlessly',10),
('home','steps','step4_desc','Step 4 text','On the day, our crew runs the show while you enjoy every moment.',11),
('home','steps','step5_title','Step 5 title','You Celebrate',12),
('home','steps','step5_desc','Step 5 text','Make memories. We pack up, settle vendors and share your photos.',13),
-- ARTISTS PAGE
('artists','hero','eyebrow','Eyebrow','Artist Management',1),
('artists','hero','title','Headline','Your Event. Your Artist. Our Responsibility.',2),
('artists','hero','subtitle','Sub-headline','From Bollywood singers to folk troupes — we curate, coordinate and stage-manage the perfect performer for your celebration.',3),
('artists','list','title','Section headline','Artists We Work With',4),
('artists','list','subtitle','Section sub-headline','A glimpse of the stars who have lit up our stages.',5),
('artists','process','title','Process headline','How Booking Works',6),
('artists','cta','title','CTA headline','Want a Star at Your Event?',7),
('artists','cta','subtitle','CTA sub-headline','Tell us your date and budget — we will line up the perfect artist.',8),
-- WEDDINGS PAGE
('weddings','hero','eyebrow','Eyebrow','Weddings',1),
('weddings','hero','title','Headline','Shaadi Moments, Up Close',2),
('weddings','hero','subtitle','Sub-headline','Real décor, real couples, real celebrations — from intimate functions to grand destination weddings.',3)
on conflict (page, section, key) do nothing;
