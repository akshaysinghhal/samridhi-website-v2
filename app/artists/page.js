import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ArtistTabs from "../../components/ArtistTabs";
import Reveal from "../../components/Reveal";
import { getContentMap, c } from "../../lib/content";
import { getArtists, getArtistCategories, getSettings, setting } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Artist Management",
  description: "Your Event. Your Artist. Our Responsibility. Book Bollywood singers, actors, folk artists, bands, DJs and anchors — curated and stage-managed by Samridhi Films & Television.",
};

// From Booking to Spotlight — the 6-step artist process (Celebrity Portfolio PDF)
const PROCESS = [
  ["01", "Understand", "We understand your event, audience, occasion and entertainment requirements."],
  ["02", "Curate", "We help identify the right celebrity or artist for your event."],
  ["03", "Coordinate", "We manage artist communication, requirements and event-related coordination."],
  ["04", "Plan", "Travel, hospitality, technical requirements and event schedules are coordinated."],
  ["05", "Execute", "Our team manages the artist engagement on-ground for a smooth event experience."],
  ["06", "Deliver", "A professionally managed celebrity or artist experience that leaves an impact."],
];

export default async function ArtistsPage() {
  const [map, artists, cats, s] = await Promise.all([
    getContentMap(), getArtists({ limit: 200 }), getArtistCategories(), getSettings(),
  ]);
  const categories = cats.length ? cats.map((x) => x.name) : [...new Set(artists.map((a) => a.category).filter(Boolean))];
  const wa = setting(s, "whatsapp", "919602228846");

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/diwali-live-musical.jpg" alt="Live musical night" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">{c(map, "artists", "hero", "eyebrow") || "Artist Management"}</span></Reveal>
          <Reveal delay={1}><h1>{c(map, "artists", "hero", "title") || "Your Event. Your Artist. Our Responsibility."}</h1></Reveal>
          <Reveal delay={2}><p className="sub">{c(map, "artists", "hero", "subtitle") || "Bollywood singers, actors, folk artists, bands, DJs and anchors — curated and stage-managed end to end."}</p></Reveal>
          <Reveal delay={3}>
            <div className="hero-ctas" style={{ marginTop: 30 }}>
              <Link className="btn btn-primary" href="/contact">Book an Artist <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section artist-band">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">01</span> Line-up</span>
              <h2 className="h2">{c(map, "artists", "list", "title") || "The Artists"}</h2>
              <p className="lead">{c(map, "artists", "list", "subtitle") || "A curated roster across every genre and stage."} All artists are available for booking through Samridhi Films &amp; Television.</p>
            </div>
          </Reveal>
          <ArtistTabs artists={artists} categories={categories} />
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">02</span> From Booking to Spotlight</span>
              <h2 className="h2">We Manage Every Detail</h2>
            </div>
          </Reveal>
          <div className="process" style={{ marginTop: 44 }}>
            {PROCESS.map(([n, t, d], i) => (
              <Reveal key={n} delay={i} className="step" style={{ background: "var(--warm-white)", border: "1px solid var(--border-gold)" }}>
                <b style={{ color: "var(--gold)", fontFamily: "var(--font-display)", fontSize: 22 }}>{n}</b>
                <span style={{ color: "var(--brown)", display: "block", fontWeight: 700, margin: "6px 0" }}>{t}</span>
                <p style={{ fontSize: 13.5, color: "var(--text-muted)", margin: 0 }}>{d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="lead center" style={{ marginTop: 30 }}>One team. Complete coordination. Star-studded experiences.</p>
          </Reveal>
        </div>
      </section>

      <section className="section contact-band">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">Book an Artist</span>
              <h2 className="h2">{c(map, "artists", "cta", "title") || "Tell Us Who You Dream Of"}</h2>
              <p className="lead">{c(map, "artists", "cta", "subtitle") || "Share your event date and budget — we will come back with confirmed options."}</p>
              <div className="hero-ctas" style={{ justifyContent: "center", marginTop: 30 }}>
                <Link className="btn btn-primary" href="/contact">Book an Artist <span className="arr">→</span></Link>
                <a className="btn btn-outline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
