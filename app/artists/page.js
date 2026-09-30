import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ArtistTabs from "../../components/ArtistTabs";
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
      <section className="hero" style={{ background: "linear-gradient(120deg,#4a1d5e,#4c1d95)" }}>
        <img className="hero-bg" src="/images/diwali-live-musical.jpg" alt="Live musical night" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>{c(map, "artists", "hero", "eyebrow")}</span>
          <h1>{c(map, "artists", "hero", "title")}</h1>
          <p className="sub">{c(map, "artists", "hero", "subtitle")}</p>
          <div className="hero-ctas">
            <Link className="btn btn-white" href="/contact">Book an Artist</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Line-up</span>
            <h2 className="h2">{c(map, "artists", "list", "title")}</h2>
            <p className="lead">{c(map, "artists", "list", "subtitle")} All artists are available for booking through Samridhi Films &amp; Television.</p>
          </div>
          <ArtistTabs artists={artists} categories={categories} />
        </div>
      </section>

      <section className="section artist-band">
        <div className="container">
          <span className="eyebrow">From Booking to Spotlight</span>
          <h2 className="h2" style={{ color: "#fff" }}>We Manage Every Detail</h2>
          <div className="process">
            {PROCESS.map(([n, t, d]) => (
              <div className="step" key={n}><b>{n}</b><span>{t}</span><p style={{ fontSize: 13, opacity: 0.75, margin: "8px 0 0" }}>{d}</p></div>
            ))}
          </div>
          <p className="lead" style={{ marginTop: 26 }}>One team. Complete coordination. Star-studded experiences.</p>
        </div>
      </section>

      <section className="section" style={{ background: "linear-gradient(120deg,#7c3aed,#6d28d9)", color: "#fff", textAlign: "center" }}>
        <div className="container">
          <h2 className="h2" style={{ color: "#fff" }}>{c(map, "artists", "cta", "title")}</h2>
          <p className="lead" style={{ color: "#f3e3f7", margin: "0 auto 30px" }}>{c(map, "artists", "cta", "subtitle")}</p>
          <div className="hero-ctas" style={{ justifyContent: "center" }}>
            <Link className="btn btn-white" href="/contact">Book an Artist</Link>
            <a className="btn btn-outline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
