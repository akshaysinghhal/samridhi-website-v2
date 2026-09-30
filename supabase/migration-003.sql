-- Migration 003 — v3 content modules (Couple Stories, Leads CRM, Legal, SEO, Portfolio, Press, Clients, Team, International, Landing Pages, Settings)
-- Run ONCE in Supabase SQL Editor, after schema.sql and migration-002.sql.
-- For fresh installs, run schema.sql, then migration-002.sql, then this file.

-- ============================================================================
-- A. SITE SETTINGS (key -> jsonb value). Public-readable (all values are public info).
-- ============================================================================
create table if not exists site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
drop policy if exists "public read settings" on site_settings;
create policy "public read settings" on site_settings for select using (true);

-- ============================================================================
-- B. EXTEND EXISTING TABLES (backwards compatible: new cols have defaults)
-- ============================================================================
-- media: placeholder/source tracking
alter table media add column if not exists is_placeholder boolean not null default false;
alter table media add column if not exists source text not null default 'upload'
  check (source in ('upload','instagram','facebook','stock','pdf_extract','seed'));
alter table media add column if not exists source_url text;
alter table media add column if not exists width int;
alter table media add column if not exists height int;
alter table media add column if not exists format text;
alter table media add column if not exists focal_point text;
alter table media add column if not exists folder text;
alter table media add column if not exists tags text[] default '{}';

-- gallery_items: categories, captions, publish status, placeholders
alter table gallery_items add column if not exists category text not null default 'Events';
alter table gallery_items add column if not exists caption text default '';
alter table gallery_items add column if not exists status text not null default 'published'
  check (status in ('draft','published','scheduled'));
alter table gallery_items add column if not exists is_placeholder boolean not null default false;

-- artists: richer profiles for the Artist Management pages
alter table artists add column if not exists slug text;
alter table artists add column if not exists bio text default '';
alter table artists add column if not exists videos jsonb default '[]'::jsonb;
alter table artists add column if not exists featured boolean not null default false;
alter table artists add column if not exists display_status text not null default 'Available for booking through Samridhi Films & Television';
alter table artists add column if not exists price_note text;
alter table artists add column if not exists booking_notes text;
alter table artists add column if not exists languages text[] default '{}';
alter table artists add column if not exists genres text[] default '{}';
alter table artists add column if not exists status text not null default 'published'
  check (status in ('draft','published','scheduled'));
alter table artists add column if not exists is_placeholder boolean not null default false;
create unique index if not exists artists_slug_uidx on artists (slug) where slug is not null;

-- weddings: publish status + placeholders
alter table weddings add column if not exists status text not null default 'published'
  check (status in ('draft','published','scheduled'));
alter table weddings add column if not exists is_placeholder boolean not null default false;

-- ============================================================================
-- C. NEW TABLES
-- ============================================================================

-- artist categories (tabs on the Artists page)
create table if not exists artist_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table artist_categories enable row level security;
drop policy if exists "public read artist categories" on artist_categories;
create policy "public read artist categories" on artist_categories for select using (true);

-- services (one row per service page)
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text default '',
  icon text default '',
  hero_image text,
  items jsonb default '[]'::jsonb,          -- list of sub-service strings
  faq jsonb default '[]'::jsonb,            -- [{q,a}]
  sort int not null default 0,
  status text not null default 'published' check (status in ('draft','published','scheduled')),
  seo jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table services enable row level security;
drop policy if exists "public read services" on services;
create policy "public read services" on services for select using (status = 'published');

-- couple_stories (video testimonials)
create table if not exists couple_stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  label text not null default 'In Their Words',
  couple_names text default '',
  thumbnail_url text,
  video_source text not null default 'youtube' check (video_source in ('cloudinary','youtube','vimeo','mp4_url')),
  video_ref text default '',
  event_id uuid,
  consent_granted boolean not null default false,
  featured_on_home boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  publish_at timestamptz,
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table couple_stories enable row level security;
drop policy if exists "public read couple stories" on couple_stories;
create policy "public read couple stories" on couple_stories
  for select using (
    consent_granted = true and (
      status = 'published'
      or (status = 'scheduled' and publish_at is not null and publish_at <= now())
    )
  );

-- events (portfolio entries)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  client text default '',
  location text default '',
  event_date date,
  category text not null default 'Corporate',
  services text[] default '{}',
  description text default '',
  cover_image text,
  gallery text[] default '{}',
  video_url text,
  featured boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  is_placeholder boolean not null default false,
  seo jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table events enable row level security;
drop policy if exists "public read events" on events;
create policy "public read events" on events for select using (status = 'published');

-- event <-> artist links
create table if not exists event_artists (
  event_id uuid not null references events(id) on delete cascade,
  artist_id uuid not null references artists(id) on delete cascade,
  primary key (event_id, artist_id)
);
alter table event_artists enable row level security;
drop policy if exists "public read event artists" on event_artists;
create policy "public read event artists" on event_artists for select using (true);

-- clients (logo wall)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sector text default '',
  permission_to_display boolean not null default false,
  is_placeholder boolean not null default false,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table clients enable row level security;
drop policy if exists "public read clients" on clients;
create policy "public read clients" on clients
  for select using (permission_to_display = true);

-- testimonials (written; permission required)
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text default '',
  company text default '',
  photo_url text,
  event_id uuid,
  permission_granted boolean not null default false,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  created_at timestamptz not null default now()
);
alter table testimonials enable row level security;
drop policy if exists "public read testimonials" on testimonials;
create policy "public read testimonials" on testimonials
  for select using (status = 'published' and permission_granted = true);

-- press clippings
create table if not exists press_clippings (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  type text not null default 'single_clipping' check (type in ('page_collage','single_clipping')),
  publication text default '',
  city text default '',
  published_on date,
  headline text default '',
  event_id uuid,
  sort int not null default 0,
  status text not null default 'published' check (status in ('draft','published','scheduled')),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now()
);
alter table press_clippings enable row level security;
drop policy if exists "public read press" on press_clippings;
create policy "public read press" on press_clippings for select using (status = 'published');

-- team members
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text default '',
  bio text default '',
  photo_url text,
  instagram text default '',
  sort int not null default 0,
  status text not null default 'published' check (status in ('draft','published','scheduled')),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now()
);
alter table team_members enable row level security;
drop policy if exists "public read team" on team_members;
create policy "public read team" on team_members for select using (status = 'published');

-- international shows
create table if not exists international_shows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  country text default '',
  city text default '',
  show_date date,
  summary text default '',
  cover_image text,
  gallery text[] default '{}',
  video_url text,
  sort int not null default 0,
  status text not null default 'published' check (status in ('draft','published','scheduled')),
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now()
);
alter table international_shows enable row level security;
drop policy if exists "public read intl shows" on international_shows;
create policy "public read intl shows" on international_shows for select using (status = 'published');

-- legal pages (markdown body, edited in admin)
create table if not exists legal_pages (
  slug text primary key,
  title text not null,
  body text not null default '',
  last_updated_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('draft','published')),
  created_at timestamptz not null default now()
);
alter table legal_pages enable row level security;
drop policy if exists "public read legal" on legal_pages;
create policy "public read legal" on legal_pages for select using (status = 'published');

-- SEO landing pages
create table if not exists landing_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  service_ref text default '',
  location text default '',
  title text not null,
  h1 text default '',
  intro text default '',
  faq jsonb default '[]'::jsonb,
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft','published','scheduled')),
  seo jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table landing_pages enable row level security;
drop policy if exists "public read landing" on landing_pages;
create policy "public read landing" on landing_pages for select using (status = 'published');

-- navigation items
create table if not exists nav_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  parent_id uuid references nav_items(id) on delete cascade,
  sort int not null default 0,
  visible boolean not null default true,
  location text not null default 'header' check (location in ('header','footer')),
  created_at timestamptz not null default now()
);
alter table nav_items enable row level security;
drop policy if exists "public read nav" on nav_items;
create policy "public read nav" on nav_items for select using (visible = true);

-- redirects
create table if not exists redirects (
  id uuid primary key default gen_random_uuid(),
  from_path text not null unique,
  to_path text not null,
  code int not null default 301,
  created_at timestamptz not null default now()
);
alter table redirects enable row level security;

-- leads (mini-CRM). No anon access at all: the /api/leads route uses the service role.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'quote' check (type in ('quote','artist_booking','wedding','contact')),
  name text not null,
  company text default '',
  phone text not null,
  email text default '',
  event_type text default '',
  event_date date,
  location text default '',
  guests text default '',
  budget text default '',
  message text default '',
  artist_id uuid references artists(id) on delete set null,
  source_page text default '',
  utm jsonb default '{}'::jsonb,
  status text not null default 'New' check (status in ('New','Contacted','Quote Sent','Negotiation','Won','Lost')),
  assigned_to text default '',
  spam boolean not null default false,
  ip_hash text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table leads enable row level security;
create index if not exists leads_status_created_idx on leads (status, created_at desc);
create index if not exists leads_phone_idx on leads (phone);

-- lead notes / follow-ups
create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  author text default '',
  body text not null,
  follow_up_at timestamptz,
  created_at timestamptz not null default now()
);
alter table lead_notes enable row level security;
create index if not exists lead_notes_lead_idx on lead_notes (lead_id);

-- revision history (last 20 kept per entity by the API)
create table if not exists revisions (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id text not null,
  snapshot jsonb not null,
  author text default '',
  created_at timestamptz not null default now()
);
alter table revisions enable row level security;
create index if not exists revisions_entity_idx on revisions (entity, entity_id, created_at desc);

-- audit log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text default '',
  action text not null,
  entity text default '',
  entity_id text default '',
  diff jsonb,
  created_at timestamptz not null default now()
);
alter table audit_log enable row level security;
create index if not exists audit_log_created_idx on audit_log (created_at desc);

-- useful indexes
create index if not exists services_slug_idx on services (slug);
create index if not exists services_status_idx on services (status);
create index if not exists events_slug_idx on events (slug);
create index if not exists events_status_idx on events (status);
create index if not exists couple_stories_status_idx on couple_stories (status);
create index if not exists landing_pages_slug_idx on landing_pages (slug);

-- ============================================================================
-- E. SEED CONTENT (all editable from the admin portal afterwards)
-- ============================================================================

-- site settings ---------------------------------------------------------------
insert into site_settings (key, value) values
('company_name', '"Samridhi Films & Television"'),
('tagline1', '"You Just Think & We Will Manage It."'),
('tagline2', '"Creating Experiences. Delivering Excellence."'),
('since', '"1999"'),
('phone1', '"+91 96022 28846"'),
('phone2', '"+91 77372 89938"'),
('whatsapp', '"919602228846"'),
('whatsapp_msg', '"Hi Samridhi Films! I want to plan an event."'),
('email', '"samridhifilms@yahoo.co.in"'),
('address_chittorgarh', '"230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan"'),
('address_mumbai', '"Mumbai, Maharashtra"'),
('instagram', '"https://www.instagram.com/samridhi_films_and_television/"'),
('facebook', '"https://www.facebook.com/SamridhiFilmsAndTelevision"'),
('youtube', '"https://www.youtube.com/@SONAMUSICLIVE"'),
('seo_indexing_enabled', 'false'),
('disclaimer', '"Artists and celebrities shown on this website are available for booking through Samridhi Films & Television. Their appearance here does not imply endorsement of the company."'),
('hero_video', '""'),
('hero_poster', '"/images/hero-concert.jpg"'),
('hero_video_mobile', '""'),
('ga4_id', '""'),
('meta_pixel_id', '""'),
('lead_notify_email', '""'),
('cookie_banner_text', '"We use cookies to improve your experience and analyse site traffic. You can accept or decline."'),
('legal_entity', '{"legal_name":"","trade_name":"Samridhi Films & Television","gstin":"","pan":"","address":"","state":"Rajasthan","email":"samridhifilms@yahoo.co.in","phone":"+91 96022 28846","grievance_officer":{"name":"","email":"","phone":""}}'),
('stats', '[{"value":"1999","label":"Serving Since"},{"value":"1000+","label":"Events Delivered"},{"value":"20+","label":"Years in Event Planning"}]')
on conflict (key) do nothing;

-- artist categories ------------------------------------------------------------
insert into artist_categories (slug, name, sort) values
('actors-actresses','Actors & Actresses',1),
('icons-personalities','Icons & Personalities',2),
('singers-musical-artists','Singers & Musical Artists',3),
('anchors','Anchors',4),
('djs','DJs',5),
('bands','Bands',6),
('dance-groups','Dance Groups',7),
('rajasthani-folk','Rajasthani Folk',8),
('international','International',9)
on conflict (slug) do nothing;

-- navigation --------------------------------------------------------------------
insert into nav_items (label, href, sort, location) values
('Home','/',1,'header'),
('About Us','/about',2,'header'),
('Services','/services',3,'header'),
('Weddings','/weddings',4,'header'),
('Artist Management','/artists',5,'header'),
('Portfolio','/portfolio',6,'header'),
('Clients','/clients',7,'header'),
('Gallery','/gallery',8,'header'),
('Testimonials','/testimonials',9,'header'),
('Contact','/contact',10,'header'),
('About Us','/about',1,'footer'),
('Services','/services',2,'footer'),
('Weddings','/weddings',3,'footer'),
('Artist Management','/artists',4,'footer'),
('Portfolio','/portfolio',5,'footer'),
('Press','/press',6,'footer'),
('International Shows','/international-shows',7,'footer'),
('Couple Stories','/couple-stories',8,'footer'),
('Privacy Policy','/privacy-policy',20,'footer'),
('Terms & Conditions','/terms-and-conditions',21,'footer'),
('Cookie Policy','/cookie-policy',22,'footer'),
('Booking & Cancellation Policy','/booking-and-cancellation-policy',23,'footer')
on conflict do nothing;

-- services -----------------------------------------------------------------------
insert into services (slug, title, summary, icon, items, faq, sort, status) values
('government-events','Government Events','Official programs, public celebrations and large-scale government initiatives — planned, staged and executed end-to-end.','🏛️',
 '["Government Programs","Public Events","Cultural Festivals","Inaugurations & Ceremonies","Awareness Campaigns","Foundation Day Programs","Public Shows","Stage & Technical Production","Melas","Dussehra / Teej / Ganagaur Mahotsav Nights"]'::jsonb,
 '[{"q":"Do you handle permissions and liaison for government events?","a":"Yes — we coordinate with the concerned departments for permissions, staging and public-safety requirements so the program runs smoothly."},{"q":"Have you managed Nagar Palika / Nagar Parishad programs before?","a":"Yes — our portfolio includes programs for Nagar Palika Nohar, Nagar Palika Fatehnagar-Sanwar and other civic bodies across Rajasthan."}]'::jsonb,
 1,'published'),
('corporate-events','Corporate Events','Annual functions, launches and dealer meets with professional staging, entertainment and flawless logistics.','💼',
 '["Annual Functions","Award Nights","Dealer Meets","Conferences & Seminars","Product Launches","Corporate Parties","Employee Engagement","Brand Activations","Corporate Entertainment"]'::jsonb,'[]'::jsonb,2,'published'),
('weddings','Wedding & Destination Wedding','From intimate celebrations to grand destination weddings — concepts, décor, entertainment and coordination under one roof.','💒',
 '["Complete Wedding Planning & Coordination","Destination Wedding Planning","Wedding Concept & Theme Planning","Venue & Event Coordination","Wedding Décor & Theme Décor","Bride & Groom Entry Concepts","Sangeet & Mehendi Planning","Wedding Choreography","Family & Couple Dance Choreography","Celebrity & Artist Entertainment","Live Singers & Bands","DJ & Music Entertainment","Anchors & Emcees","Rajasthani Folk & Cultural Performances","Stage, LED, Sound & Lighting","VFX & Special Effects","Wedding Hospitality & Event Coordination","Cocktail Parties & Theme Celebrations"]'::jsonb,'[]'::jsonb,3,'published'),
('artist-management','Celebrity & Artist Management','Your Event. Your Artist. Our Responsibility. Professional booking and on-ground management of celebrities and performers.','🎤',
 '["Celebrity Appearances","Live Performances","Artist Booking & Coordination","Corporate & Brand Events","Government & Public Events","Special Appearances"]'::jsonb,
 '[{"q":"How does artist booking work?","a":"Share your event date, city and budget. We curate options, confirm availability, handle contracts, travel, hospitality and technical requirements, and manage the artist on-ground on event day."},{"q":"Do you manage the artist on the event day?","a":"Yes — our team coordinates everything from airport pickup to stage time, so you can focus on your guests."}]'::jsonb,4,'published'),
('entertainment-live-shows','Entertainment & Live Shows','Celebrity nights, concerts, cultural programs and theme entertainment that keep audiences cheering.','🎶',
 '["Celebrity Nights","Musical Nights","Live Concerts","Cultural Programs","Folk Shows","Dance Performances","Comedy Shows","Magic Shows","Theme Entertainment","New Year Celebrations","Festival Events","Kavi Sammelan","Bhajan Sandhya"]'::jsonb,'[]'::jsonb,5,'published'),
('event-production','Stage & Event Production','Stages, LED walls, sound, lighting, VFX and fabrication — the technical backbone of spectacular events.','🎛️',
 '["Stage Setup","LED Walls","Professional Sound Systems","Hi-Fi Lighting","DJ Systems","Projectors","Backdrops","Trussing","VFX","Special Effects","Technical Production","Event Fabrication","Media Management"]'::jsonb,'[]'::jsonb,6,'published'),
('brand-promotions-road-shows','Brand Promotions & Road Shows','Activations, road shows and mall promotions that put your brand in front of the right crowd.','📣',
 '["Brand Activation","Product Promotion","Road Shows","Mall Activations","Corporate Branding","Promotional Events","Audience Engagement Activities"]'::jsonb,'[]'::jsonb,7,'published'),
('exhibitions-special-events','Exhibitions & Special Events','Exhibition planning, stall design and fabrication plus birthdays and theme parties.','🎪',
 '["Exhibition Planning","Stall Design","Fabrication","Branding","Corporate Displays","Event Infrastructure","Launch & Promotional Events","Birthday & Theme Parties"]'::jsonb,'[]'::jsonb,8,'published')
on conflict (slug) do nothing;

-- artists (from the Celebrity Portfolio PDF; spellings corrected) ----------------
-- status: published for confirmed roster, draft for poster-only names awaiting client confirmation
insert into artists (slug, name, category, status, sort) values
-- Actors & Actresses
('tejasswi-prakash','Tejasswi Prakash','Actors & Actresses','published',1),
('mehak-chahal','Mehak Chahal','Actors & Actresses','published',2),
('hiba-nawab','Hiba Nawab','Actors & Actresses','published',3),
('sunil-grover','Sunil Grover','Actors & Actresses','published',4),
('kush-shah','Kush Shah','Actors & Actresses','published',5),
('ankit-gupta','Ankit Gupta','Actors & Actresses','published',6),
-- Icons & Personalities
('rajpal-yadav','Rajpal Yadav','Icons & Personalities','published',7),
('govinda','Govinda','Icons & Personalities','published',8),
('suniel-shetty','Suniel Shetty','Icons & Personalities','published',9),
('preity-zinta','Preity Zinta','Icons & Personalities','published',10),
('ameesha-patel','Ameesha Patel','Icons & Personalities','published',11),
('amrita-prakash','Amrita Prakash','Icons & Personalities','published',12),
('shamita-shetty','Shamita Shetty','Icons & Personalities','published',13),
('shilpa-shetty','Shilpa Shetty','Icons & Personalities','published',14),
('jacqueline-fernandez','Jacqueline Fernandez','Icons & Personalities','published',15),
('chunky-panday','Chunky Panday','Icons & Personalities','published',16),
('aroon-bakshi','Aroon Bakshi','Icons & Personalities','published',17),
('saurabh-sachdeva','Saurabh Sachdeva','Icons & Personalities','published',18),
-- Singers & Musical Artists (PDF prints "B. Parekh"; seeded as B Praak — client to confirm)
('anup-jalota','Anup Jalota','Singers & Musical Artists','published',19),
('darshan-raval','Darshan Raval','Singers & Musical Artists','published',20),
('sonu-nigam','Sonu Nigam','Singers & Musical Artists','published',21),
('udit-narayan','Udit Narayan','Singers & Musical Artists','published',22),
('amit-jadhav','Amit Jadhav','Singers & Musical Artists','published',23),
('kapil-thapa','Kapil Thapa','Singers & Musical Artists','published',24),
('sumit-saini','Sumit Saini','Singers & Musical Artists','published',25),
('b-praak','B Praak','Singers & Musical Artists','published',26),
('kailash-kher','Kailash Kher','Singers & Musical Artists','published',27),
('shreya-ghoshal','Shreya Ghoshal','Singers & Musical Artists','published',28),
('alka-yagnik','Alka Yagnik','Singers & Musical Artists','published',29),
('dhvani-bhanushali','Dhvani Bhanushali','Singers & Musical Artists','published',30),
('altaf-raja','Altaf Raja','Singers & Musical Artists','published',31),
('sashi-suman','Sashi Suman','Singers & Musical Artists','published',32),
('sawroop-khan','Sawroop Khan','Singers & Musical Artists','published',33),
('monali-thakur','Monali Thakur','Singers & Musical Artists','published',34),
('prajakta-shukre','Prajakta Shukre','Singers & Musical Artists','published',35),
('antra-mitra','Antra Mitra','Singers & Musical Artists','published',36),
-- Seen on event posters: unpublished drafts, client decides
('shailesh-lodha','Shailesh Lodha','Actors & Actresses','draft',37),
('geeta-rabari','Geeta Rabari','Singers & Musical Artists','draft',38),
('helly-shah','Helly Shah','Actors & Actresses','draft',39),
('pranjal-dahiya','Pranjal Dahiya','Singers & Musical Artists','draft',40),
('shivangi-sharma','Shivangi Sharma','Actors & Actresses','draft',41),
('sonia-sharma','Sonia Sharma','Singers & Musical Artists','draft',42),
('pawni-pandey','Pawni Pandey','Singers & Musical Artists','draft',43),
('nikita-rawal','Nikita Rawal','Actors & Actresses','draft',44),
('sneha-gupta','Sneha Gupta','Singers & Musical Artists','draft',45),
('vinti-singh','Vinti Singh','Actors & Actresses','draft',46),
('puja-singh','Puja Singh','Singers & Musical Artists','draft',47)
on conflict (slug) do nothing;

-- clients (key clients named in the brochure) --------------------------------------
insert into clients (name, sector, permission_to_display, is_placeholder, sort) values
('Hindustan Zinc','Mining & Metals',true,true,1),
('Vedanta Group','Mining & Metals',true,true,2),
('JK Cement','Cement',true,true,3),
('Royal Enfield','Automobile',true,true,4),
('Honda','Automobile',true,true,5),
('Maruti Suzuki','Automobile',true,true,6),
('UltraTech Cement','Cement',true,true,7),
('Wonder Cement','Cement',true,true,8),
('JK White Cement','Cement',true,true,9),
('Lafarge Cement','Cement',true,true,10);

-- portfolio events (drafts — verify details against posters before publishing) -----
insert into events (slug, title, client, location, event_date, category, services, description, status, sort) values
('china-diwali-festival-2024','China Diwali Festival 2024','Indian Community Keqiao','Keqiao, China','2024-10-26','International',
 array['Live Concert','Artist Management','Stage Production'],
 'A live musical concert with the Super Psychos rock band, organised for the Indian community in Keqiao — taking Indian entertainment beyond borders.','draft',1),
('diwali-festival-keqiao-2015','Diwali Festival Keqiao 2015','','Keqiao, China','2015-11-01','International',
 array['Live Concert','Event Management'],'Diwali celebrations for the Indian community in Keqiao, China.','draft',2),
('anup-jalota-night-nohar','Anup Jalota Night','Nagar Palika Nohar','Nohar, Rajasthan',null,'Celebrity Shows',
 array['Celebrity Night','Stage Production'],'A soulful bhajan evening with Anup Jalota at the Nagar Palika Nohar Diwali festival.','draft',3),
('dussehra-mahotsav-2022-fatehnagar','Dussehra Mahotsav 2022','Nagar Palika Fatehnagar-Sanwar','Fatehnagar-Sanwar, Rajasthan','2022-10-01','Government',
 array['Cultural Festival','Stage Production'],'Dussehra Mahotsav celebrations with cultural programs and star nights.','draft',4),
('kavi-sammelan-fatehnagar-2024','Kavi Sammelan','Nagar Palika Fatehnagar-Sanwar','Fatehnagar-Sanwar, Rajasthan','2024-10-01','Cultural Programs',
 array['Kavi Sammelan','Event Management'],'A grand poets'' gathering as part of the Dussehra festivities.','draft',5),
('bhavya-bhajan-sandhya-amet-2023','Bhavya Bhajan Sandhya','Amet Mela Committee','Amet, Rajasthan','2023-10-01','Cultural Programs',
 array['Bhajan Sandhya','Stage Production'],'A devotional musical evening at the Amet mela.','draft',6),
('nimbahera-dussehra-mela-2024','Nimbahera Dussehra Mela','','Nimbahera, Rajasthan','2024-10-01','Government',
 array['Mela Management','Cultural Programs'],'Dussehra mela celebrations with cultural nights.','draft',7),
('dussehra-mela-kishangarh-2024','Dussehra Mela Kishangarh','','Kishangarh, Rajasthan','2024-10-01','Government',
 array['Mela Management','Cultural Programs'],'Dussehra mela celebrations with star performances.','draft',8),
('ganagaur-mahotsav-kankroli-2024','Ganagaur Mahotsav','','Kankroli, Rajasthan','2024-04-01','Cultural Programs',
 array['Cultural Festival','Folk Performances'],'Traditional Ganagaur celebrations with Rajasthani folk artists.','draft',9),
('vedanta-hindustan-zinc-corporate','Vedanta / Hindustan Zinc Corporate Events','Vedanta Group','Rajasthan',null,'Corporate',
 array['Corporate Events','Entertainment'],'Diwali Milan, Deshbhakti night and New Year celebrations for Vedanta / Hindustan Zinc teams.','draft',10)
on conflict (slug) do nothing;

-- team ------------------------------------------------------------------------------
insert into team_members (name, role, bio, instagram, sort, is_placeholder) values
('Sunil Jain','Driving Force',
 'Sunil Jain is the driving force behind Samridhi Films & Television. An experienced anchor with 20 years of expertise, he has acted in YouTube videos and successfully managed government, wedding and other events. He represented India at the China Diwali Festival, served as Executive Producer for Zee Rajasthani shows (Nach Le Bindi, Antakshari) and Mahuaa TV (Sajana Hamar, Sindoor Tohar), judged Zoom Zoom Ke Naach on ETV Rajasthan, and has directed around 500 devotional music albums.',
 'https://www.instagram.com/kumar_neel1/',1,true),
('Rajkumari Chouhan','Head of Finance',
 'Rajkumari Chouhan leads the finance department at Samridhi Films & Television. A highly skilled Bhawai dancer honoured by the State of Gujarat, she is also a choreographer and has acted in films and YouTube videos, bringing her artistic vision and cultural heritage to the forefront of every performance.',
 'https://www.instagram.com/rajkumariofficial_/',2,true);

-- international shows ------------------------------------------------------------------
insert into international_shows (title, country, city, show_date, summary, status, sort) values
('China Diwali Festival 2024','China','Keqiao','2024-10-26',
 'A live musical concert with the Super Psychos rock band, organised for the Indian community in Keqiao on 26 October 2024 — with Sunil Jain representing India on the international stage.','published',1),
('Diwali Festival Keqiao 2015','China','Keqiao','2015-11-01',
 'Diwali celebrations for the Indian community in Keqiao, China — an early milestone in taking Indian entertainment beyond borders.','published',2);

-- couple stories (4 placeholder seeds; client replaces videos/thumbnails from admin) ----
insert into couple_stories (title, label, thumbnail_url, video_source, video_ref, consent_granted, featured_on_home, status, is_placeholder, sort) values
('A Wedding Well Planned','In Their Words','/images/ig-couple-portrait.jpg','youtube','',true,true,'published',true,1),
('Every Detail, Handled','In Their Words','/images/fb-floral-mandap-stage.jpg','youtube','',true,true,'published',true,2),
('Our Dream Celebration','In Their Words','/images/ig-haldi-decor-collage.jpg','youtube','',true,true,'published',true,3),
('Behind The Scene Magic','In Their Words','/images/fb-sunflower-wedding-stage.jpg','youtube','',true,true,'published',true,4);

-- legal pages (first drafts — a qualified lawyer should review before launch) ------
insert into legal_pages (slug, title, body, status) values
('privacy-policy','Privacy Policy',$$# Privacy Policy

**Last updated:** 30 September 2026

Samridhi Films & Television ("we", "us", "our") respects your privacy. This policy explains what personal information we collect through our website, why we collect it, and the choices you have.

## 1. Information we collect

**Information you give us directly** — when you fill in an enquiry, quote or booking form, or contact us on call/WhatsApp/email, we collect:
- Name, company/organisation name
- Mobile number, email address
- Event details: event type, event date, event location, expected guests, estimated budget, and your requirement/message

**Information collected automatically** — when you browse the website we may collect:
- Device and browser information, pages visited, time spent (through analytics cookies, only if you accept them)
- Approximate location derived from your IP address (used for analytics, never stored with your name)

**Cookies** — we use essential cookies (required for the site to work), and, only with your consent, analytics cookies. See our Cookie Policy for details.

## 2. How we use your information

We use your information to:
- Respond to your enquiry and prepare quotations
- Plan, coordinate and deliver your event
- Send booking confirmations and event-related updates
- Improve our website and services
- Comply with legal obligations (e.g. tax invoices)

We do **not** sell your personal information to anyone.

## 3. Legal basis and consent (India)

We process your information on the basis of your consent and/or because it is necessary to respond to your request and perform our services, in line with the **Digital Personal Data Protection Act, 2023** and the **Information Technology Act, 2000**. By submitting a form on this website, you consent to us contacting you about your enquiry on call, WhatsApp, SMS or email. You may withdraw consent at any time (see Section 7).

## 4. Sharing with service providers

To run this website we share limited data with trusted providers: our hosting provider (Vercel), database provider (Supabase), media storage (Cloudinary), email service (Resend) and analytics (Google Analytics, only with consent). These providers process data only on our instructions.

## 5. Data retention

We retain enquiry records for **36 months** from your last interaction (configurable by us in our admin settings), after which they are deleted or anonymised — unless a longer retention is required by law (e.g. tax records).

## 6. Children's data

Our services are directed at adults planning events. We do not knowingly collect personal data of children under 18. If you believe a child has shared data with us, contact us and we will delete it.

## 7. Your rights

You may ask us to **access, correct, update or delete** your personal information, or to stop contacting you, by writing to our grievance officer below. We will respond within a reasonable time.

## 8. Security

We use industry-standard safeguards — encrypted connections (HTTPS), access-controlled admin systems, and role-based access — to protect your information. No method is 100% secure, but we take reasonable steps to keep your data safe.

## 9. Grievance officer

For privacy questions or complaints:
- **Name:** [to be filled in admin — Site Settings → Legal entity]
- **Email:** [to be filled in admin]
- **Phone:** [to be filled in admin]

## 10. Changes to this policy

We may update this policy from time to time. The "Last updated" date at the top shows the latest version. Continued use of the website after changes means you accept the updated policy.
$$,'published'),
('terms-and-conditions','Terms & Conditions',$$# Terms & Conditions

**Last updated:** 30 September 2026

Welcome to the website of Samridhi Films & Television ("we", "us", "our"). By using this website you agree to these terms.

## 1. Our services

We provide event management, wedding planning, celebrity/artist management, entertainment programming and event production services across India. Descriptions on this website are indicative; the exact scope of every engagement is defined in a written quotation and agreement.

## 2. Quotations and confirmations

- A quotation shared on call, WhatsApp or email is an **estimate**, not a booking, unless it expressly states otherwise.
- A booking is confirmed only when you accept our written quotation **and** pay the advance specified in it.
- Artist and celebrity availability is always **subject to final confirmation and a signed artist contract**. In the rare case a confirmed artist becomes unavailable, we will offer a suitable replacement or a refund as per the agreement.

## 3. Payments

Payments, advances and balance schedules are as stated in your written agreement with us. All prices are in Indian Rupees (INR) and exclusive of GST unless stated otherwise.

## 4. Client responsibilities

You agree to provide accurate event details (date, venue, guest count, requirements), obtain necessary venue permissions where applicable, and make payments on time. Delays caused by incomplete information may affect timelines.

## 5. Intellectual property and portfolio use

All content on this website — text, photos, videos, designs — belongs to us or our licensors and may not be copied without permission. By engaging us, you grant us permission to use photographs and videos taken at your event in our portfolio, website and social media, unless you tell us in writing that you prefer otherwise.

## 6. Force majeure

We are not liable for failure to perform due to events beyond our reasonable control — including natural disasters, government restrictions, strikes, pandemics or artist emergencies. In such cases we will work with you in good faith to reschedule or settle fairly.

## 7. Limitation of liability

To the maximum extent permitted by law, our total liability for any claim arising from our services is limited to the amount you paid us for that event. We are not liable for indirect or consequential losses.

## 8. Governing law and jurisdiction

These terms are governed by the laws of India. Any disputes are subject to the exclusive jurisdiction of the courts at **[city — to be filled in admin]**.

## 9. Contact

For questions about these terms, reach us at +91 96022 28846 or samridhifilms@yahoo.co.in.
$$,'published'),
('cookie-policy','Cookie Policy',$$# Cookie Policy

**Last updated:** 30 September 2026

This policy explains how Samridhi Films & Television uses cookies on this website.

## 1. What are cookies?

Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and understand how visitors use it.

## 2. Cookies we use

- **Essential cookies** — required for the website to function (e.g. remembering your cookie choice, keeping admin sessions secure). These cannot be switched off.
- **Analytics cookies** — help us understand which pages visitors like (Google Analytics). These load **only if you accept** in the cookie banner.
- **Marketing cookies** — used for measuring ad campaigns (Meta Pixel). These load **only if you accept** in the cookie banner.

We do not use cookies to collect names, phone numbers or other personal details directly.

## 3. Managing your choices

- When you first visit, a banner lets you **Accept** or **Decline** non-essential cookies.
- You can change your mind anytime by clearing this site's cookies in your browser settings and reloading — the banner will appear again.
- You can also block cookies entirely in your browser settings, though some parts of the site may not work properly.

## 4. Third-party cookies

If you accept analytics/marketing cookies, third parties (Google, Meta) may set their own cookies subject to their privacy policies.

## 5. Contact

Questions about cookies: samridhifilms@yahoo.co.in.
$$,'published'),
('booking-and-cancellation-policy','Booking & Cancellation Policy',$$# Booking & Cancellation Policy

**Last updated:** 30 September 2026

This policy describes how bookings, advances, rescheduling and cancellations work with Samridhi Films & Television. Your signed quotation/agreement always takes precedence over this page.

## 1. How booking works

1. **Enquiry** — you share your event details through our website form, call or WhatsApp.
2. **Quotation** — we send a written quotation with scope, inclusions and payment schedule.
3. **Confirmation** — your booking is confirmed when you accept the quotation in writing and pay the advance.
4. **Planning** — we lock artists, venues and vendors, and share a detailed execution plan.
5. **Event day** — our team manages everything on-ground.

## 2. Advance payment

A booking advance of **[advance percentage — to be set by management]** of the total quotation is required to confirm your date. Dates are held only after the advance is received.

## 3. Rescheduling

- Requests made **[rescheduling notice period — to be set by management]** or more before the event date can usually be accommodated once, subject to artist/vendor availability.
- Artist contracts may have their own rescheduling terms, which we will share transparently.

## 4. Cancellation and refunds

- Cancellation **[cancellation timeline and refund percentages — to be set by management]**.
- Amounts already paid to third parties (artists, venues, vendors) on your behalf are refunded only to the extent those parties refund us.
- No refunds are due for services already delivered.

## 5. Cancellation by us

In the unlikely event we must cancel (e.g. force majeure), we will refund the advance after deducting only non-recoverable third-party costs, or offer to reschedule at no planning fee.

## 6. Artist-specific terms

Celebrity/artist engagements follow the artist's own contract terms for advances, cancellations and postponements. We share these with you before you confirm.

## 7. Questions

Call +91 96022 28846 or email samridhifilms@yahoo.co.in before you book — we are happy to walk you through everything.
$$,'published')
on conflict (slug) do nothing;

-- ============================================================================
-- Z. RLS HARDENING (replaces migration-002's permissive public-read policies)
-- ============================================================================

-- gallery_items / weddings / artists: public may read published rows only.
drop policy if exists "public read gallery" on gallery_items;
create policy "public read gallery" on gallery_items
  for select using (status = 'published');

drop policy if exists "public read weddings" on weddings;
create policy "public read weddings" on weddings
  for select using (status = 'published');

drop policy if exists "public read artists" on artists;
create policy "public read artists" on artists
  for select using (status = 'published');

-- redirects: path mappings are not sensitive; the [slug] page resolves them publicly.
drop policy if exists "public read redirects" on redirects;
create policy "public read redirects" on redirects
  for select using (true);
