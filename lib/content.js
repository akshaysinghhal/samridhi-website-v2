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
};

export async function getContentMap() {
  const map = { ...DEFAULTS };
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("supabase.co")) return map;
    const sb = supabasePublic();
    const { data } = await sb.from("page_content").select("page,section,key,value");
    for (const row of data || []) {
      map[`${row.page}|${row.section}|${row.key}`] = row.value;
    }
  } catch {
    /* fall back to defaults */
  }
  return map;
}

export function c(map, page, section, key) {
  return map[`${page}|${section}|${key}`] ?? "";
}
