import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
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

      <section className="page-hero">
        <img className="hero-bg" src="/images/diwali-stage-group.jpg" alt="Samridhi Films team on stage" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">About Us</span></Reveal>
          <Reveal delay={1}><h1>Who We Are</h1></Reveal>
          <Reveal delay={2}><p className="sub">A complete event management company — from Chittorgarh&apos;s first digital local news channel (1999) to 1000+ events across India.</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <Reveal>
              <div>
                <span className="eyebrow"><span className="sec-num">01</span> Our Story</span>
                <h2 className="h2">Since 1999</h2>
                <hr className="gold-rule" />
                <p className="lead">
                  Founded in 1999 by <strong>Navratan Jain</strong>, Samridhi began as the first digital
                  local news channel in Chittorgarh. It was later taken over and transformed into a
                  full-service event management company by his younger brother <strong>Sunil Jain</strong>.
                </p>
                <p className="lead" style={{ marginTop: 18 }}>
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
            </Reveal>
            <Reveal delay={1} className="frame-wrap">
              <img className="main" src="/images/fb-performer-big-audience.jpg" alt="Performer before a large audience" loading="lazy" />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)", padding: "90px 0" }}>
        <div className="container">
          <div className="about-grid">
            <Reveal>
              <div>
                <span className="eyebrow">Vision</span>
                <p className="lead" style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--brown)", fontStyle: "italic" }}>To give fame and a stage to talented artists — and to create memorable, flawless events through expert planning and execution.</p>
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div>
                <span className="eyebrow">Mission</span>
                <p className="lead" style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--brown)", fontStyle: "italic" }}>We actively promote the <strong>Swachh Bharat</strong> mission in every show with the help of our celebrity guests — and provide a platform for social campaigns like Yoga and Self-Reliance.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">02</span> Our Team</span>
              <h2 className="h2">The People Behind the Magic</h2>
            </div>
          </Reveal>
          <div className="team-grid">
            {team.filter((m) => !m.is_placeholder).map((m, i) => (
              <Reveal key={m.id} delay={i % 3} className="team-card">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.name} loading="lazy" />
                ) : (
                  <div className="team-placeholder">{m.name.charAt(0)}</div>
                )}
                <div className="body">
                  <div className="role">{m.role}</div>
                  <h3>{m.name}</h3>
                  <p>{m.bio}</p>
                  {m.instagram && (
                    <p><a href={m.instagram} target="_blank" rel="noreferrer" style={{ color: "var(--terracotta)", fontWeight: 700, textDecoration: "none" }}>Instagram →</a></p>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section steps-band">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">03</span> Our Approach</span>
              <h2 className="h2">How Every Event Comes Together</h2>
            </div>
          </Reveal>
          <div className="process" style={{ marginTop: 44 }}>
            {PROCESS.map((p, i) => (
              <Reveal key={p} delay={i} className="step">
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{p}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">04</span> Why Samridhi</span>
              <h2 className="h2">Why Clients Choose Us</h2>
            </div>
          </Reveal>
          <div className="services-grid">
            {WHY.map((w, i) => (
              <Reveal key={w} delay={i % 4} className="service-tile solid">
                <div className="bento-body" style={{ padding: 0 }}>
                  <div className="svc-num" style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: 15, letterSpacing: 2, marginBottom: 12 }}>{String(i + 1).padStart(2, "0")}</div>
                  <h3 style={{ fontSize: 19 }}>{w}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow"><span className="sec-num">05</span> Group Brands</span>
              <h2 className="h2">One Family, Many Stages</h2>
              <p className="lead" style={{ margin: "0 auto" }}>
                Our YouTube channels <strong>Sona Bollywood</strong>, <strong>Sona Music</strong> and{" "}
                <strong>Bhains Ki Aankh</strong> carry our entertainment to millions of screens —
                alongside our sister branch <strong>NR Events</strong>.
              </p>
              <div style={{ marginTop: 30, display: "inline-flex", alignItems: "center", gap: 16, background: "var(--warm-white)", border: "1px solid var(--border-gold)", borderRadius: 6, padding: "16px 28px" }}>
                <img src="/images/iso-badge.png" alt="ISO 9001:2015 certified company" style={{ height: 60, width: "auto" }} />
                <span style={{ fontWeight: 800, color: "var(--brown)", fontSize: 15, letterSpacing: 1 }}>ISO 9001:2015<br />Certified Company</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
