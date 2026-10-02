import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getContentMap, ci } from "../../lib/content";
import { getServices } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Services",
  description: "Government events, corporate events, weddings, celebrity & artist management, live shows, stage production, brand promotions and exhibitions — all under one roof.",
};

export default async function ServicesPage() {
  const [map, services] = await Promise.all([getContentMap(), getServices()]);

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={ci(map, "services", "hero", "image") || "/images/ig-event-stage.jpg"} alt="Event stage production" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Services</span></Reveal>
          <Reveal delay={1}><h1>Everything Your Event Needs</h1></Reveal>
          <Reveal delay={2}><p className="sub">Eight specialised verticals, one accountable team — from the first concept note to the final applause.</p></Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          {services.map((sv) => (
            <Reveal key={sv.slug}>
              <Link
                href={`/services/${sv.slug}`}
                className="svc-row"
                aria-label={sv.title}
              >
                {sv.hero_image ? (
                  <img src={sv.hero_image} alt="" loading="lazy" className="svc-thumb" />
                ) : (
                  <span className="svc-thumb svc-thumb-fallback" aria-hidden="true">{sv.title.charAt(0)}</span>
                )}
                <span className="svc-row-body">
                  <span className="svc-row-title">{sv.title}</span>
                  <span className="svc-row-desc">{sv.summary}</span>
                </span>
                <span className="pf-link">Explore <span className="arr">→</span></span>
              </Link>
            </Reveal>
          ))}
          <Reveal>
            <div className="center" style={{ marginTop: 48 }}>
              <Link className="btn btn-primary" href="/contact">Discuss Your Requirement <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
