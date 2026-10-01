import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import PortfolioMedia from "../../../components/PortfolioMedia";
import { getEvent, getEvents } from "../../../lib/db";
import { eventJsonLd, breadcrumbJsonLd, jsonLdScript } from "../../../lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const e = await getEvent(params.slug);
  if (!e) return {};
  const seo = e.seo || {};
  return {
    title: seo.title || e.title,
    description: seo.description || e.description,
  };
}

export default async function PortfolioDetailPage({ params }) {
  const e = await getEvent(params.slug);
  if (!e) notFound();

  const related = (await getEvents({ category: e.category, limit: 4 })).filter((x) => x.slug !== e.slug).slice(0, 3);
  const services = Array.isArray(e.services) ? e.services : [];

  return (
    <>
      <SiteHeader />

      <section className="page-hero">
        {e.cover_image && <img className="hero-bg" src={e.cover_image} alt={e.title} />}
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <span className="eyebrow">{e.category || "Event"}</span>
          <h1>{e.title}</h1>
          {(e.location || e.event_date) && (
            <p className="sub">
              {[e.location, e.event_date ? new Date(e.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22 }}>
            <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>Home</Link> →{" "}
            <Link href="/portfolio" style={{ color: "var(--brand)", fontWeight: 700 }}>Portfolio</Link> → {e.title}
          </p>
          {e.description && <p className="lead" style={{ maxWidth: 800, marginBottom: 40 }}>{e.description}</p>}

          <PortfolioMedia gallery={e.gallery} videoSource={e.video_source} videoRef={e.video_ref} videoUrl={e.video_url} />

          {services.length > 0 && (
            <div style={{ marginTop: 44 }}>
              <span className="eyebrow">Services Delivered</span>
              <ul className="checklist" style={{ marginTop: 16 }}>
                {services.map((sv, i) => <li key={i}>{sv}</li>)}
              </ul>
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div className="center"><h2 className="h2">More Like This</h2></div>
            <div className="wedding-grid">
              {related.map((r) => (
                <Link key={r.id} href={`/portfolio/${r.slug}`} className="wedding-card" style={{ textDecoration: "none", color: "inherit" }}>
                  {r.cover_image && <img src={r.cover_image} alt={r.title} loading="lazy" />}
                  <div className="body">
                    <h3>{r.title}</h3>
                    {(r.location || r.category) && <div className="wmeta">{[r.category, r.location].filter(Boolean).join(" • ")}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section contact-band">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Your Turn</span>
            <h2 className="h2">Want an Event Like This?</h2>
            <p className="lead" style={{ margin: "0 auto 30px" }}>Tell us your idea — we&apos;ll make it happen.</p>
            <div className="hero-ctas" style={{ justifyContent: "center" }}>
              <Link className="btn btn-primary" href="/contact">Get a Free Quote <span className="arr">→</span></Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            eventJsonLd({
              name: e.title,
              description: e.description,
              image: e.cover_image,
              location: e.location,
              startDate: e.event_date,
              url: `/portfolio/${e.slug}`,
            }),
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Portfolio", url: "/portfolio" },
              { name: e.title },
            ]),
          ]),
        }}
      />
      <SiteFooter />
    </>
  );
}
