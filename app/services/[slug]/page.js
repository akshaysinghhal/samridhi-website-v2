import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import LeadForm from "../../../components/LeadForm";
import { getService, getServices, getEvents, getArtists } from "../../../lib/db";
import { faqJsonLd, serviceJsonLd, breadcrumbJsonLd, jsonLdScript } from "../../../lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const sv = await getService(params.slug);
  if (!sv) return {};
  const seo = sv.seo || {};
  return {
    title: seo.title || sv.title,
    description: seo.description || sv.summary,
  };
}

export default async function ServiceDetailPage({ params }) {
  const sv = await getService(params.slug);
  if (!sv) notFound();

  const faqs = Array.isArray(sv.faq) ? sv.faq.filter((f) => f.q && f.a) : [];
  const items = Array.isArray(sv.items) ? sv.items : [];
  const [allEvents, artists] = await Promise.all([getEvents({ limit: 30 }), getArtists({ limit: 6 })]);
  const relatedEvents = allEvents.slice(0, 3);

  const faqLd = faqJsonLd(faqs);
  const schemas = [
    serviceJsonLd({ name: sv.title, description: sv.summary, url: `/services/${sv.slug}` }),
    breadcrumbJsonLd([
      { name: "Home", url: "/" },
      { name: "Services", url: "/services" },
      { name: sv.title },
    ]),
  ];
  if (faqLd) schemas.push(faqLd);

  return (
    <>
      <SiteHeader />

      <section className="hero" style={{ background: "linear-gradient(120deg,#c2185b,#ff6f00)" }}>
        {sv.hero_image && <img className="hero-bg" src={sv.hero_image} alt={sv.title} />}
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Services</span>
          <h1>{sv.title}</h1>
          <p className="sub">{sv.summary}</p>
          <div className="hero-ctas">
            <Link className="btn btn-white" href="/contact">Get a Quote</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div>
              <span className="eyebrow">What We Deliver</span>
              <h2 className="h2">Included in {sv.title}</h2>
              <ul className="checklist">
                {items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            </div>
            <div>
              <LeadForm type="quote" compact presetEventType={sv.title} />
            </div>
          </div>
        </div>
      </section>

      {relatedEvents.length > 0 && (
        <section className="section" style={{ background: "#fff" }}>
          <div className="container">
            <div className="center">
              <span className="eyebrow">Portfolio</span>
              <h2 className="h2">Recent Work</h2>
            </div>
            <div className="wedding-grid">
              {relatedEvents.map((e) => (
                <Link key={e.id} href={`/portfolio/${e.slug}`} className="wedding-card" style={{ textDecoration: "none", color: "inherit" }}>
                  {e.cover_image && <img src={e.cover_image} alt={e.title} loading="lazy" />}
                  <div className="body">
                    <h3>{e.title}</h3>
                    {(e.location || e.category) && <div className="wmeta">{[e.category, e.location].filter(Boolean).join(" • ")}</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="center">
              <span className="eyebrow">Artists</span>
              <h2 className="h2">Artists for {sv.title}</h2>
              <p className="lead">Available for booking through Samridhi Films &amp; Television.</p>
            </div>
            <div className="artist-names" style={{ justifyContent: "center" }}>
              {artists.map((a) => (
                <Link key={a.id} href={a.slug ? `/artists/${a.slug}` : "/artists"} style={{ textDecoration: "none" }}>
                  <span>{a.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="section" style={{ background: "#fff" }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <div className="center">
              <span className="eyebrow">FAQ</span>
              <h2 className="h2">Common Questions</h2>
            </div>
            <div className="faq-list">
              {faqs.map((f, i) => (
                <details className="faq-item" key={i}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section" style={{ background: "linear-gradient(120deg,#ff6f00,#e91e63)", color: "#fff", textAlign: "center" }}>
        <div className="container">
          <h2 className="h2" style={{ color: "#fff" }}>Planning {sv.title}?</h2>
          <p className="lead" style={{ color: "#ffe9f0", margin: "0 auto 30px" }}>Tell us your date and city — we&apos;ll take it from there.</p>
          <div className="hero-ctas" style={{ justifyContent: "center" }}>
            <Link className="btn btn-white" href="/contact">Get a Free Quote</Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(schemas) }} />
      <SiteFooter />
    </>
  );
}
