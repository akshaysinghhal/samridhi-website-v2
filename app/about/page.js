import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import AboutSteps from "../../components/AboutSteps";
import { getContentMap, c } from "../../lib/content";
import { getTeam } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "About Us",
  description: "Samridhi Films & Television — founded 1999 in Chittorgarh by Navratan Jain, transformed into a full-service event management company by Sunil Jain. 1000+ events across India.",
};

// One item per line. Admin → Page Content → about.
const lines = (v) => String(v || "").split("\n").map((l) => l.trim()).filter(Boolean);
// Timeline lines look like: "Title | description"
const parseTimeline = (v) =>
  lines(v).map((l) => {
    const i = l.indexOf("|");
    return i === -1 ? { title: l, text: "" } : { title: l.slice(0, i).trim(), text: l.slice(i + 1).trim() };
  });

export default async function AboutPage() {
  const [map, team] = await Promise.all([getContentMap(), getTeam()]);
  const steps = parseTimeline(c(map, "about", "approach", "steps"));
  const why = lines(c(map, "about", "why", "items"));
  const timeline = parseTimeline(c(map, "about", "story", "timeline"));

  return (
    <>
      <SiteHeader />

      <section className="page-hero">
        <img className="hero-bg" src="/images/diwali-stage-group.jpg" alt="Samridhi Films team on stage" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">{c(map, "about", "hero", "eyebrow")}</span></Reveal>
          <Reveal delay={1}><h1>{c(map, "about", "hero", "title")}</h1></Reveal>
          <Reveal delay={2}><p className="sub">{c(map, "about", "hero", "subtitle")}</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <Reveal>
              <div>
                <span className="eyebrow">{c(map, "about", "story", "eyebrow")}</span>
                <h2 className="h2">{c(map, "about", "story", "title")}</h2>
                <hr className="gold-rule" />
                <p className="lead">{c(map, "about", "story", "body1")}</p>
                <p className="lead" style={{ marginTop: 18 }}>{c(map, "about", "story", "body2")}</p>
                <ul className="timeline">
                  {timeline.map((t, i) => (
                    <li key={i}><strong>{t.title}</strong>{t.text ? <span>{t.text}</span> : null}</li>
                  ))}
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
          <div className="vm-grid">
            <Reveal className="vm-card">
              <span className="vm-icon" aria-hidden="true">✦</span>
              <span className="eyebrow">Vision</span>
              <p>{c(map, "about", "vision", "vision")}</p>
            </Reveal>
            <Reveal delay={1} className="vm-card">
              <span className="vm-icon" aria-hidden="true">◉</span>
              <span className="eyebrow">Mission</span>
              <p>{c(map, "about", "vision", "mission")}</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">{c(map, "about", "team", "eyebrow")}</span>
              <h2 className="h2">{c(map, "about", "team", "title")}</h2>
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
              <span className="eyebrow">{c(map, "about", "approach", "eyebrow")}</span>
              <h2 className="h2">{c(map, "about", "approach", "title")}</h2>
              <p className="lead" style={{ color: "rgba(247,242,232,0.65)", marginTop: 12 }}>Tap each step to see how it works.</p>
            </div>
          </Reveal>
          <AboutSteps steps={steps} />
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">{c(map, "about", "why", "eyebrow")}</span>
              <h2 className="h2">{c(map, "about", "why", "title")}</h2>
            </div>
          </Reveal>
          <div className="why-grid">
            {why.map((w, i) => (
              <Reveal key={w + i} delay={i % 4} className="why-card">
                <span className="why-check" aria-hidden="true">✓</span>
                <p>{w}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">{c(map, "about", "brands", "eyebrow")}</span>
              <h2 className="h2">{c(map, "about", "brands", "title")}</h2>
              <p className="lead" style={{ margin: "0 auto" }}>{c(map, "about", "brands", "body")}</p>
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
