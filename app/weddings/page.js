import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import WeddingGrid from "../../components/WeddingGrid";
import LeadForm from "../../components/LeadForm";
import CoupleStories from "../../components/CoupleStories";
import { getContentMap, c } from "../../lib/content";
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
      <section className="hero" style={{ background: "linear-gradient(120deg,#4c1d95,#d97706)" }}>
        <img className="hero-bg" src="/images/ig-haldi-decor-collage.jpg" alt="Wedding décor" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>{c(map, "weddings", "hero", "eyebrow")}</span>
          <h1>{c(map, "weddings", "hero", "title")}</h1>
          <p className="sub">{c(map, "weddings", "hero", "subtitle")}</p>
          <div className="hero-ctas">
            <a className="btn btn-white" href="#plan">Plan Your Wedding</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Real Weddings</span>
            <h2 className="h2">Celebrations We&apos;ve Planned</h2>
          </div>
          {weddings.length === 0 ? (
            <p className="lead center">Our wedding stories are being added — check back soon, or <Link href="/contact" style={{ color: "var(--brand)", fontWeight: 700 }}>talk to us</Link> about yours.</p>
          ) : (
            <WeddingGrid weddings={weddings} />
          )}
        </div>
      </section>

      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          <div className="center">
            <span className="eyebrow" style={{ color: "#6d28d9" }}>Wedding Services</span>
            <h2 className="h2">Everything for Your Big Day</h2>
          </div>
          <ul className="checklist" style={{ columns: 2, columnGap: 40, maxWidth: 900, margin: "0 auto" }}>
            {WEDDING_SERVICES.map((w) => <li key={w} style={{ breakInside: "avoid" }}>{w}</li>)}
          </ul>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="center">
              <span className="eyebrow">Gallery</span>
              <h2 className="h2">Wedding Moments</h2>
            </div>
            <div className="masonry">
              {gallery.slice(0, 9).map((g) => (
                <figure key={g.id}>
                  <img src={g.image_url} alt={g.title || "Wedding photo"} loading="lazy" />
                  {g.title && <figcaption>{g.title}</figcaption>}
                </figure>
              ))}
            </div>
            <div className="center" style={{ marginTop: 30 }}>
              <Link className="btn btn-dark" href="/gallery">View Full Gallery</Link>
            </div>
          </div>
        </section>
      )}

      <CoupleStories />

      <section className="section" id="plan" style={{ background: "linear-gradient(135deg,#fff5f8,#fff9f3)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="center">
            <span className="eyebrow" style={{ color: "#6d28d9" }}>Plan Your Dream Wedding</span>
            <h2 className="h2">Tell Us About Your Celebration</h2>
            <p className="lead">From haldi to reception — décor, sangeet, artists and complete coordination.</p>
          </div>
          <LeadForm type="wedding" presetEventType="Wedding / Destination Wedding" />
        </div>
      </section>

      <section className="section" style={{ background: "linear-gradient(120deg,#d97706,#6d28d9)", color: "#fff", textAlign: "center" }}>
        <div className="container">
          <h2 className="h2" style={{ color: "#fff" }}>Dreaming of Your Big Day?</h2>
          <p className="lead" style={{ color: "#ffe9f0", margin: "0 auto 30px" }}>Prefer talking first? We&apos;re one call away.</p>
          <div className="hero-ctas" style={{ justifyContent: "center" }}>
            <a className="btn btn-white" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a>
            <Link className="btn btn-outline" href="/contact">Get a Free Quote</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
