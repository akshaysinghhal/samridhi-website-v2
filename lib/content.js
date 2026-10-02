import { supabasePublic } from "./supabaseServer";

// Default copy (matches supabase/seed in schema.sql). Used when Supabase
// isn't configured yet or a block is missing.
const DEFAULTS = {
  "home|hero|eyebrow": "Chittorgarh • Since 1999",
  "home|hero|title": "Creating Experiences. Delivering Excellence.",
  "home|hero|subtitle":
    "You Just Think & We Will Manage It! Weddings, celebrity shows, government & corporate events — planned and executed by one powerhouse team.",
  "home|hero|cta_primary": "Plan Your Event",
  "home|hero|cta_secondary": "Explore Our Work",
  "home|about|eyebrow": "About Us",
  "home|about|title": "A Complete Event Management Company",
  "home|about|body":
    "Founded in 1999 by Navratan Jain as Chittorgarh's first digital local news channel, Samridhi Films & Television was transformed into a full-service event management company by his younger brother Sunil Jain. Today we deliver government programs, corporate events, weddings, cultural festivals and celebrity shows across India — with our sister branch NR Events carrying the founder's name forward.",
  "home|stats|stat1_value": "1999",
  "home|stats|stat1_label": "Serving since",
  "home|stats|stat2_value": "1000+",
  "home|stats|stat2_label": "Events delivered",
  "home|stats|stat3_value": "500",
  "home|stats|stat3_label": "Devotional albums directed",
  "home|stats|stat4_value": "5.0",
  "home|stats|stat4_label": "Justdial rating",
  "home|cta|title": "Let's Plan Your Celebration",
  "home|cta|subtitle": "Call us or drop a message — we reply within one working day.",
  "contact|info|phone1": "+91 96022 28846",
  "contact|info|phone2": "+91 77372 89938",
  "contact|info|email": "samridhifilms@yahoo.co.in",
  "contact|info|address": "230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan",
  "contact|info|instagram": "https://www.instagram.com/samridhi_films_and_television/",
  "contact|info|facebook": "https://www.facebook.com/SamridhiFilmsAndTelevision",
  "contact|info|youtube": "https://www.youtube.com/@SONAMUSICLIVE",
  "home|steps|eyebrow": "How It Works",
  "home|steps|title": "From First Call to Final Applause",
  "home|steps|subtitle": "A simple, stress-free journey — you dream, we deliver.",
  "home|steps|step1_title": "Share Your Vision",
  "home|steps|step1_desc": "Tell us about your event — the date, the guests, the budget, the dream.",
  "home|steps|step2_title": "We Design & Propose",
  "home|steps|step2_desc": "Themes, venues, artists and décor — a complete plan with transparent pricing.",
  "home|steps|step3_title": "You Relax, We Prepare",
  "home|steps|step3_desc": "Bookings, vendors, rehearsals — every detail handled by our team.",
  "home|steps|step4_title": "We Execute Flawlessly",
  "home|steps|step4_desc": "On the day, our crew runs the show while you enjoy every moment.",
  "home|steps|step5_title": "You Celebrate",
  "home|steps|step5_desc": "Make memories. We pack up, settle vendors and share your photos.",
  "home|wedding|eyebrow": "Weddings",
  "home|wedding|title1": "Your Moments.",
  "home|wedding|title2": "Beautifully Managed.",
  "home|wedding|lead":
    "From intimate family functions to grand destination weddings — décor, entertainment and complete coordination under one roof.",
  "home|wedding|point1": "Wedding planning & coordination",
  "home|wedding|point2": "Destination weddings",
  "home|wedding|point3": "Sangeet, mehendi & choreography",
  "home|wedding|point4": "Celebrity artists & entertainment",
  "home|wedding|point5": "Décor & stage production",
  "home|wedding|point6": "Hospitality & guest management",
  "home|wedding|cta_text": "Plan Your Dream Wedding",
  "artists|hero|eyebrow": "Artist Management",
  "artists|hero|title": "Your Event. Your Artist. Our Responsibility.",
  "artists|hero|subtitle": "From Bollywood singers to folk troupes — we curate, coordinate and stage-manage the perfect performer for your celebration.",
  "artists|list|title": "Artists We Work With",
  "artists|list|subtitle": "A glimpse of the stars who have lit up our stages.",
  "artists|process|title": "How Booking Works",
  "artists|cta|title": "Want a Star at Your Event?",
  "artists|cta|subtitle": "Tell us your date and budget — we will line up the perfect artist.",
  "weddings|hero|eyebrow": "Weddings",
  "weddings|hero|title": "Shaadi Moments, Up Close",
  "weddings|hero|subtitle": "Real décor, real couples, real celebrations — from intimate functions to grand destination weddings.",
  "about|hero|eyebrow": "About Us",
  "about|hero|title": "Who We Are",
  "about|hero|subtitle":
    "A complete event management company — from Chittorgarh's first digital local news channel (1999) to 1000+ events across India.",
  "about|story|eyebrow": "Our Story",
  "about|story|title": "Since 1999",
  "about|story|body1":
    "Founded in 1999 by Navratan Jain, Samridhi began as the first digital local news channel in Chittorgarh. It was later taken over and transformed into a full-service event management company by his younger brother Sunil Jain.",
  "about|story|body2":
    "Today, Samridhi Films & Television delivers government programs, corporate events, weddings, cultural festivals and celebrity shows across India — with our sister branch NR Events, named in remembrance of Navratan Jain, carrying the founder's name forward in weddings, corporate events and government projects.",
  "about|story|timeline":
    "1999 — The Beginning | Navratan Jain founds Chittorgarh's first digital local news channel.\nThe Transformation | Sunil Jain takes over and builds an event management company.\nToday | 1000+ events • ISO 9001:2015 certified • offices in Chittorgarh & Mumbai.",
  "about|vision|vision":
    "To give fame and a stage to talented artists — and to create memorable, flawless events through expert planning and execution.",
  "about|vision|mission":
    "We actively promote the Swachh Bharat mission in every show with the help of our celebrity guests — and provide a platform for social campaigns like Yoga and Self-Reliance.",
  "about|team|eyebrow": "Our Team",
  "about|team|title": "The People Behind the Magic",
  "about|approach|eyebrow": "Our Approach",
  "about|approach|title": "How Every Event Comes Together",
  "about|approach|steps": "Concept\nPlanning\nArtists\nProduction\nExecution\nEvent Management",
  "about|why|eyebrow": "Why Samridhi",
  "about|why|title": "Why Clients Choose Us",
  "about|why|items":
    "1000+ events delivered across India\nPan-India execution capability\nEnd-to-end event management under one roof\nProfessional artist and celebrity network\nCreative concepts and choreography\nStage and production expertise\nGovernment and corporate event experience\nWedding and destination event expertise",
  "about|brands|eyebrow": "Group Brands",
  "about|brands|title": "One Family, Many Stages",
  "about|brands|body":
    "Our YouTube channels Sona Bollywood, Sona Music and Bhains Ki Aankh carry our entertainment to millions of screens — alongside our sister branch NR Events.",
};

export async function getContentMap() {
  const map = { ...DEFAULTS };
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")) return map;
    const sb = supabasePublic();
    const { data } = await sb.from("page_content").select("page,section,key,value,image_url");
    for (const row of data || []) {
      map[`${row.page}|${row.section}|${row.key}`] = row.value;
      if (row.image_url) map[`${row.page}|${row.section}|${row.key}|image`] = row.image_url;
    }
  } catch {
    /* fall back to defaults */
  }
  return map;
}

export function c(map, page, section, key) {
  return map[`${page}|${section}|${key}`] ?? "";
}

// Banner / section image for a content block, set from
// Admin → Page Content (blocks with key "image"). Falls back to "".
export function ci(map, page, section, key) {
  return map[`${page}|${section}|${key}|image`] || "";
}
