import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Reveal from "../../components/Reveal";
import { getServices } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Services",
  description: "Government events, corporate events, weddings, celebrity & artist management, live shows, stage production, brand promotions and exhibitions — all under one roof.",
};

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/ig-event-stage.jpg" alt="Event stage production" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Services</span></Reveal>
          <Reveal delay={1}><h1>Everything Your Event Needs</h1></Reveal>
          <Reveal delay={2}><p className="sub">Eight specialised verticals, one accountable team — from the first concept note to the final applause.</p></Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          {services.map((sv, i) => (
            <Reveal key={sv.slug}>
              <Link
                href={`/services/${sv.slug}`}
                style={{ textDecoration: "none", display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 30, alignItems: "center", padding: "38px 10px", borderBottom: "1px solid var(--border-gold)" }}
                className="svc-row"
                aria-label={sv.title}
              >
                <span style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--gold)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 30, color: "var(--brown)", marginBottom: 6 }}>{sv.title}</span>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: 15.5, maxWidth: 640 }}>{sv.summary}</span>
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
