import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import TestimonialCard from "../../components/TestimonialCard";
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
  const hasVideo = (t) => !!(t.video_url && String(t.video_url).trim());
  const videoOnes = testimonials.filter(hasVideo);
  const written = testimonials.filter((t) => !hasVideo(t));

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

      {videoOnes.length > 0 && (
        <section className="section testi-band">
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Video Testimonials</span>
                <h2 className="h2">Watch Their Stories</h2>
                <p className="lead" style={{ color: "var(--gold-soft)", margin: "12px auto 0" }}>Tap a card to watch the full video.</p>
              </div>
            </Reveal>
            <div className="testi-video-grid">
              {videoOnes.map((t, i) => (
                <Reveal key={t.id} delay={i % 4}>
                  <TestimonialCard t={t} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {written.length > 0 && (
        <section className="section" style={{ background: "var(--ivory)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Testimonials</span>
                <h2 className="h2">In Their Words</h2>
              </div>
            </Reveal>
            <div className="testi-grid">
              {written.map((t, i) => (
                <Reveal key={t.id} delay={i % 3} className={`testi-card${t.photo_url ? " has-photo" : ""}`}>
                  {t.photo_url ? (
                    <img className="tphoto" src={t.photo_url} alt={t.author_name || "Client"} loading="lazy" />
                  ) : null}
                  <p className="tquote">&ldquo;{t.quote}&rdquo;</p>
                  <p className="tauthor">
                    {t.author_name}
                    {t.company ? `, ${t.company}` : ""}
                    {t.event_name ? <span style={{ display: "block", fontWeight: 400, fontSize: 13, color: "var(--text-muted)", letterSpacing: 0.4, textTransform: "none" }}>{t.event_name}</span> : null}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {testimonials.length === 0 && (
        <section className="section" style={{ background: "var(--ivory)" }}>
          <div className="container">
            <p className="lead center">Client testimonials are being added — check back soon.</p>
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  );
}
