import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { getTeam, getSettings, setting } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "About Us",
  description: "Samridhi Films & Television — founded 1999 in Chittorgarh by Navratan Jain, transformed into a full-service event management company by Sunil Jain. 1000+ events across India.",
};

const WHY = [
  "1000+ events delivered across India",
  "Pan-India execution capability",
  "End-to-end event management under one roof",
  "Professional artist and celebrity network",
  "Creative concepts and choreography",
  "Stage and production expertise",
  "Government and corporate event experience",
  "Wedding and destination event expertise",
];

const PROCESS = ["Concept", "Planning", "Artists", "Production", "Execution", "Event Management"];

export default async function AboutPage() {
  const [team, s] = await Promise.all([getTeam(), getSettings()]);

  return (
    <>
      <SiteHeader />

      <section className="hero" style={{ background: "linear-gradient(120deg,#7c3aed,#4c1d95)" }}>
        <img className="hero-bg" src="/images/diwali-stage-group.jpg" alt="Samridhi Films team on stage" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>About Us</span>
          <h1>Who We Are</h1>
          <p className="sub">A complete event management company — from Chittorgarh&apos;s first digital local news channel (1999) to 1000+ events across India.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div>
              <span className="eyebrow">Our Story</span>
              <h2 className="h2">Since 1999</h2>
              <p className="lead">
                Founded in 1999 by <strong>Navratan Jain</strong>, Samridhi began as the first digital
                local news channel in Chittorgarh. It was later taken over and transformed into a
                full-service event management company by his younger brother <strong>Sunil Jain</strong>.
              </p>
              <p className="lead">
                Today, Samridhi Films &amp; Television delivers government programs, corporate events,
                weddings, cultural festivals and celebrity shows across India — with our sister branch{" "}
                <strong>NR Events</strong>, named in remembrance of Navratan Jain, carrying the
                founder&apos;s name forward in weddings, corporate events and government projects.
              </p>
              <ul className="timeline">
                <li><strong>1999 — The Beginning</strong><span>Navratan Jain founds Chittorgarh&apos;s first digital local news channel.</span></li>
                <li><strong>The Transformation</strong><span>Sunil Jain takes over and builds an event management company.</span></li>
                <li><strong>Today</strong><span>1000+ events • ISO 9001:2015 certified • offices in Chittorgarh &amp; Mumbai.</span></li>
              </ul>
            </div>
            <div>
              <img className="main" src="/images/fb-performer-big-audience.jpg" alt="Performer before a large audience" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          <div className="about-grid">
            <div>
              <span className="eyebrow" style={{ color: "#0e7490" }}>Vision</span>
              <p className="lead">To give fame and a stage to talented artists — and to create memorable, flawless events through expert planning and execution.</p>
            </div>
            <div>
              <span className="eyebrow" style={{ color: "#d97706" }}>Mission</span>
              <p className="lead">We actively promote the <strong>Swachh Bharat</strong> mission in every show with the help of our celebrity guests — and provide a platform for social campaigns like Yoga and Self-Reliance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Our Team</span>
            <h2 className="h2">The People Behind the Magic</h2>
          </div>
          <div className="team-grid">
            {team.map((m) => (
              <div className="team-card" key={m.id}>
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} loading="lazy" />
                ) : (
                  <div className="team-placeholder">
                    {m.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </div>
                )}
                <div className="body">
                  {m.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
                  <div className="role">{m.role}</div>
                  <h3>{m.name}</h3>
                  <p>{m.bio}</p>
                  {m.instagram && (
                    <p><a href={m.instagram} target="_blank" rel="noreferrer" style={{ color: "var(--brand)", fontWeight: 700 }}>Instagram →</a></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section steps-band">
        <div className="container">
          <div className="center">
            <span className="eyebrow" style={{ color: "#0e7490" }}>Our Approach</span>
            <h2 className="h2">How Every Event Comes Together</h2>
          </div>
          <div className="process" style={{ marginTop: 36 }}>
            {PROCESS.map((p, i) => (
              <div className="step" key={p} style={{ background: "#fff", border: "1.5px solid #f0d7e2" }}>
                <b style={{ color: "var(--brand)" }}>0{i + 1}</b>
                <span style={{ color: "var(--ink)" }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Why Samridhi</span>
            <h2 className="h2">Why Clients Choose Us</h2>
          </div>
          <div className="services-grid">
            {WHY.map((w, i) => (
              <div className="service-tile solid" key={w} style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                <div className="bento-body" style={{ padding: 0 }}>
                  <h3 style={{ fontSize: 18 }}>{w}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="container center">
          <span className="eyebrow">Group Brands</span>
          <h2 className="h2">One Family, Many Stages</h2>
          <p className="lead" style={{ margin: "0 auto" }}>
            Our YouTube channels <strong>Sona Bollywood</strong>, <strong>Sona Music</strong> and{" "}
            <strong>Bhains Ki Aankh</strong> carry our entertainment to millions of screens —
            alongside our sister branch <strong>NR Events</strong>.
          </p>
          <div style={{ marginTop: 26, display: "inline-flex", alignItems: "center", gap: 14, background: "#fff", border: "1.5px solid #f0d7e2", borderRadius: 16, padding: "14px 26px" }}>
            <img src="/images/iso-badge.png" alt="ISO 9001:2015 certified company" style={{ height: 64, width: "auto" }} />
            <span style={{ fontWeight: 800, color: "var(--plum)" }}>ISO 9001:2015<br />Certified Company</span>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
