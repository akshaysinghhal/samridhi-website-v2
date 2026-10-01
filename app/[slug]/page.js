import Link from "next/link";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import LeadForm from "../../components/LeadForm";
import { getLandingPage, getRedirect } from "../../lib/db";
import { faqJsonLd, breadcrumbJsonLd, jsonLdScript } from "../../lib/seo";

export const revalidate = 60;

// SEO landing pages: /event-management-company-chittorgarh etc.
// Static routes always take precedence over this dynamic route.
export async function generateMetadata({ params }) {
  const page = await getLandingPage(params.slug);
  if (!page) return {};
  const seo = page.seo || {};
  const canonical = `/${page.slug}`;
  return {
    title: seo.title || page.h1,
    description: seo.description || page.intro,
    alternates: { canonical },
    openGraph: {
      title: seo.title || page.h1,
      description: seo.description || page.intro || "",
      url: canonical,
    },
  };
}

export default async function LandingPage({ params }) {
  const page = await getLandingPage(params.slug);
  if (!page) {
    // Honor admin-managed redirects before giving up with a 404.
    const r = await getRedirect("/" + params.slug);
    if (r && r.to_path) {
      if (r.code === 301 || r.code === 308) permanentRedirect(r.to_path);
      redirect(r.to_path);
    }
    notFound();
  }

  const faqs = Array.isArray(page.faq) ? page.faq.filter((f) => f.q && f.a) : [];
  const faqLd = faqJsonLd(faqs);

  return (
    <>
      <SiteHeader />

      <section className="page-hero">
        <div className="hero-veil" aria-hidden="true" />
        {page.hero_image && <img className="hero-bg" src={page.hero_image} alt={page.h1} />}
        <div className="container hero-inner">
          <span className="eyebrow">Samridhi Films &amp; Television</span>
          <h1>{page.h1}</h1>
          {page.intro && <p className="sub">{page.intro}</p>}
          <div className="hero-ctas">
            <Link className="btn btn-white" href="/contact">Get a Free Quote</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-grid">
            <div>
              {page.body_html && <div className="legal-body" dangerouslySetInnerHTML={{ __html: page.body_html }} />}
            </div>
            <div>
              <LeadForm type="quote" compact />
            </div>
          </div>
        </div>
      </section>

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

      <section className="section contact-band">
        <div className="container">
          <div className="center">
            <span className="eyebrow">Your Turn</span>
            <h2 className="h2">Ready to Plan?</h2>
            <p className="lead" style={{ margin: "0 auto 30px" }}>One team, every celebration.</p>
            <div className="hero-ctas" style={{ justifyContent: "center" }}>
              <Link className="btn btn-white" href="/contact">Get a Free Quote</Link>
            </div>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript([
            breadcrumbJsonLd([{ name: "Home", url: "/" }, { name: page.h1 }]),
            ...(faqLd ? [faqLd] : []),
          ]),
        }}
      />
      <SiteFooter />
    </>
  );
}
