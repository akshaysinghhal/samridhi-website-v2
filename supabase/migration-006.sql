-- migration-006: seed About Us page content blocks (editable in Admin → Page Content).
-- Safe to re-run: conflicts on (page, section, key) are skipped.
insert into page_content (page, section, key, label, value, sort) values
-- ABOUT / HERO
('about','hero','eyebrow','Eyebrow','About Us',1),
('about','hero','title','Headline','Who We Are',2),
('about','hero','subtitle','Sub-headline','A complete event management company — from Chittorgarh''s first digital local news channel (1999) to 1000+ events across India.',3),
-- ABOUT / STORY
('about','story','eyebrow','Eyebrow','Our Story',1),
('about','story','title','Headline','Since 1999',2),
('about','story','body1','Story paragraph 1','Founded in 1999 by Navratan Jain, Samridhi began as the first digital local news channel in Chittorgarh. It was later taken over and transformed into a full-service event management company by his younger brother Sunil Jain.',3),
('about','story','body2','Story paragraph 2','Today, Samridhi Films & Television delivers government programs, corporate events, weddings, cultural festivals and celebrity shows across India — with our sister branch NR Events, named in remembrance of Navratan Jain, carrying the founder''s name forward in weddings, corporate events and government projects.',4),
('about','story','timeline','Timeline (one per line: Title | description)','1999 — The Beginning | Navratan Jain founds Chittorgarh''s first digital local news channel.
The Transformation | Sunil Jain takes over and builds an event management company.
Today | 1000+ events • ISO 9001:2015 certified • offices in Chittorgarh & Mumbai.',5),
-- ABOUT / VISION
('about','vision','vision','Vision statement','To give fame and a stage to talented artists — and to create memorable, flawless events through expert planning and execution.',1),
('about','vision','mission','Mission statement','We actively promote the Swachh Bharat mission in every show with the help of our celebrity guests — and provide a platform for social campaigns like Yoga and Self-Reliance.',2),
-- ABOUT / TEAM
('about','team','eyebrow','Eyebrow','Our Team',1),
('about','team','title','Headline','The People Behind the Magic',2),
-- ABOUT / APPROACH
('about','approach','eyebrow','Eyebrow','Our Approach',1),
('about','approach','title','Headline','How Every Event Comes Together',2),
('about','approach','steps','Process steps (one per line)','Concept
Planning
Artists
Production
Execution
Event Management',3),
-- ABOUT / WHY
('about','why','eyebrow','Eyebrow','Why Samridhi',1),
('about','why','title','Headline','Why Clients Choose Us',2),
('about','why','items','Points (one per line)','1000+ events delivered across India
Pan-India execution capability
End-to-end event management under one roof
Professional artist and celebrity network
Creative concepts and choreography
Stage and production expertise
Government and corporate event experience
Wedding and destination event expertise',3),
-- ABOUT / BRANDS
('about','brands','eyebrow','Eyebrow','Group Brands',1),
('about','brands','title','Headline','One Family, Many Stages',2),
('about','brands','body','Body text','Our YouTube channels Sona Bollywood, Sona Music and Bhains Ki Aankh carry our entertainment to millions of screens — alongside our sister branch NR Events.',3)
on conflict (page, section, key) do nothing;
