import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { getTestimonials } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Testimonials",
  description: "What clients, couples and partners say about working with Samridhi Films & Television.",
};

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#0097a7,#e91e63)" }}>
        <img className="hero-bg" src="/images/ig-sparkler-celebration.jpg" alt="Celebration" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Testimonials</span>
          <h1>Words That Keep Us Going</h1>
          <p className="sub">From government clients to wedding families — hear it from the people we celebrate with.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {testimonials.length === 0 ? (
            <p className="lead center">Client testimonials are being added — check back soon.</p>
          ) : (
            <div className="testi-grid">
              {testimonials.map((t) => (
                <div className="testi-card" key={t.id}>
                  {t.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
                  <p className="tquote">“{t.quote}”</p>
                  <p className="tauthor">
                    {t.author_name}
                    {t.company ? `, ${t.company}` : ""}
                    {t.event_name ? <span style={{ display: "block", fontWeight: 400, fontSize: 13, color: "var(--muted)" }}>{t.event_name}</span> : null}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
