import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import WeddingGrid from "../../components/WeddingGrid";
import LeadForm from "../../components/LeadForm";
import CoupleStories from "../../components/CoupleStories";
import Reveal from "../../components/Reveal";
import { getContentMap, c, ci } from "../../lib/content";
import { getWeddings, getGalleryItems, getSettings, setting } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Weddings",
  description: "Wedding planning, décor and destination weddings by Samridhi Films & Television — real celebrations across Rajasthan and India.",
};

// Wedding services checklist (blueprint §11)
const WEDDING_SERVICES = [
  "Wedding planning & day-of coordination",
  "Destination weddings",
  "Pre-wedding shoots",
  "Wedding films & photography",
  "Décor & florals",
  "Mehendi, sangeet & choreography",
  "Hospitality & guest management",
  "Stage & artist management",
];

export default async function WeddingsPage() {
  const [map, weddings, gallery, s] = await Promise.all([
    getContentMap(), getWeddings(), getGalleryItems({ category: "Weddings" }), getSettings(),
  ]);
  const wa = setting(s, "whatsapp", "919602228846");

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={ci(map, "weddings", "hero", "image") || "/images/ig-haldi-decor-collage.jpg"} alt="Wedding décor" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">{c(map, "weddings", "hero", "eyebrow") || "Weddings"}</span></Reveal>
          <Reveal delay={1}><h1>{c(map, "weddings", "hero", "title") || "Your Moments. Beautifully Managed."}</h1></Reveal>
          <Reveal delay={2}><p className="sub">{c(map, "weddings", "hero", "subtitle") || "Wedding planning, décor and destination weddings — real celebrations across Rajasthan and India."}</p></Reveal>
          <Reveal delay={3}>
            <div className="hero-ctas" style={{ marginTop: 30 }}>
              <a className="btn btn-primary" href="#plan">Plan Your Wedding <span className="arr">→</span></a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="wed-feature">
            <Reveal className="wed-media">
              <span className="wed-frame" aria-hidden="true" />
              <img className="main" src="/images/fb-floral-mandap-stage.jpg" alt="Floral mandap stage" loading="lazy" />
              <img className="inset" src="/images/ig-sangeet-performer-turban.jpg" alt="Sangeet performer" loading="lazy" />
            </Reveal>
            <Reveal delay={1} className="wed-body">
              <span className="eyebrow">Weddings</span>
              <h2>Celebrations,<br /><em>Composed Beautifully.</em></h2>
              <hr className="gold-rule" />
              <p className="lead">From haldi to reception — décor, sangeet, artists and complete coordination, handled by one senior team.</p>
              <ul className="wed-list">
                {WEDDING_SERVICES.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)", paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="center">
              <span className="eyebrow">Real Weddings</span>
              <h2 className="h2">Celebrations We&apos;ve Planned</h2>
            </div>
          </Reveal>
          {weddings.filter((w) => !w.is_placeholder).length === 0 ? (
            <p className="lead center">Our wedding stories are being added — check back soon, or <Link href="/contact" style={{ color: "var(--terracotta)", fontWeight: 700 }}>talk to us</Link> about yours.</p>
          ) : (
            <WeddingGrid weddings={weddings.filter((w) => !w.is_placeholder)} />
          )}
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Gallery</span>
                <h2 className="h2">Wedding Moments</h2>
              </div>
            </Reveal>
            <div className="masonry">
              {gallery.slice(0, 9).map((g) => (
                <figure key={g.id}>
                  <img src={g.image_url} alt={g.title || "Wedding photo"} loading="lazy" />
                  {g.title && <figcaption>{g.title}</figcaption>}
                </figure>
              ))}
            </div>
            <Reveal>
              <div className="center" style={{ marginTop: 34 }}>
                <Link className="btn btn-dark" href="/gallery">View Full Gallery</Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <CoupleStories />

      <section className="section contact-band" id="plan">
        <div className="container" style={{ maxWidth: 760 }}>
          <Reveal>
            <div className="center">
              <span className="eyebrow">Plan Your Dream Wedding</span>
              <h2 className="h2">Tell Us About Your Celebration</h2>
              <p className="lead">From haldi to reception — décor, sangeet, artists and complete coordination.</p>
            </div>
          </Reveal>
          <Reveal delay={1} style={{ marginTop: 40 }}>
            <LeadForm type="wedding" presetEventType="Wedding / Destination Wedding" />
          </Reveal>
          <Reveal>
            <div className="center" style={{ marginTop: 36 }}>
              <p className="lead" style={{ margin: "0 auto 20px" }}>Prefer talking first? We&apos;re one call away.</p>
              <div className="hero-ctas" style={{ justifyContent: "center" }}>
                <a className="btn btn-luxury" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
                <Link className="btn btn-outline" href="/contact">Get a Free Quote</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
