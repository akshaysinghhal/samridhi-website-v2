import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import { getServices } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Services",
  description: "Government events, corporate events, weddings, celebrity & artist management, live shows, stage production, brand promotions and exhibitions — all under one roof.",
};

const GRADS = [
  "linear-gradient(135deg,#7b1fa2,#e91e63)",
  "linear-gradient(135deg,#e91e63,#ff6f00)",
  "linear-gradient(135deg,#00acc1,#5e35b1)",
  "linear-gradient(135deg,#ff6f00,#ffc107)",
];

export default async function ServicesPage() {
  const services = await getServices();

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#0097a7,#7b1fa2)" }}>
        <img className="hero-bg" src="/images/ig-event-stage.jpg" alt="Event stage production" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Services</span>
          <h1>Everything Your Event Needs</h1>
          <p className="sub">Eight specialised verticals, one accountable team — from the first concept note to the final applause.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="services-grid">
            {services.map((sv, i) => (
              <Link key={sv.slug} href={`/services/${sv.slug}`} className="service-tile"
                style={{ background: GRADS[i % GRADS.length], textDecoration: "none", minHeight: 220 }}>
                <div className="icon">{sv.icon || "✨"}</div>
                <h3>{sv.title}</h3>
                <p>{sv.summary}</p>
                <p style={{ marginTop: 12, fontWeight: 800 }}>Explore →</p>
              </Link>
            ))}
          </div>
          <div className="center" style={{ marginTop: 40 }}>
            <Link className="btn btn-primary" href="/contact">Discuss Your Requirement</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
