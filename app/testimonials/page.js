import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getContentMap, ci } from "../../lib/content";
import { getTestimonials } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Testimonials",
  description: "What clients, couples and partners say about working with Samridhi Films & Television.",
};

export default async function TestimonialsPage() {
  const [map, raw] = await Promise.all([getContentMap(), getTestimonials()]);
  // Only genuine testimonials are ever presented publicly.
  const testimonials = raw.filter((t) => !t.is_placeholder);

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={ci(map, "testimonials", "hero", "image") || "/images/ig-sparkler-celebration.jpg"} alt="Celebration" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Testimonials</span></Reveal>
          <Reveal delay={1}><h1>Words That Keep Us Going</h1></Reveal>
          <Reveal delay={2}><p className="sub">From government clients to wedding families — hear it from the people we celebrate with.</p></Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          {testimonials.length === 0 ? (
            <p className="lead center">Client testimonials are being added — check back soon.</p>
          ) : (
            <div className="testi-grid">
              {testimonials.map((t, i) => (
                <Reveal key={t.id} delay={i % 3} className={`testi-card${t.video_url ? " has-video" : ""}`}>
                  {t.video_url && (
                    <video className="tvideo" src={t.video_url} controls preload="metadata" playsInline aria-label={`Video testimonial by ${t.author_name || "client"}`} />
                  )}
                  <p className="tquote">&ldquo;{t.quote}&rdquo;</p>
                  <p className="tauthor">
                    {t.author_name}
                    {t.company ? `, ${t.company}` : ""}
                    {t.event_name ? <span style={{ display: "block", fontWeight: 400, fontSize: 13, color: "var(--text-muted)", letterSpacing: 0.4, textTransform: "none" }}>{t.event_name}</span> : null}
                  </p>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
