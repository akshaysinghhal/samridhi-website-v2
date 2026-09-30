import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PortfolioFilter from "../../components/PortfolioFilter";
import { getEvents } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Portfolio",
  description: "Government programs, corporate events, weddings, celebrity shows and international productions by Samridhi Films & Television.",
};

const CATEGORIES = [
  "Government", "Corporate", "Weddings", "Destination Weddings",
  "Celebrity Shows", "Cultural Programs", "Brand Promotions", "International",
];

export default async function PortfolioPage() {
  const events = await getEvents({ limit: 200 });
  const cats = CATEGORIES.filter((c) => events.some((e) => e.category === c));

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#0097a7,#5e35b1)" }}>
        <img className="hero-bg" src="/images/fb-performer-big-audience.jpg" alt="Large event audience" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Portfolio</span>
          <h1>Events That Speak for Themselves</h1>
          <p className="sub">Government programs, corporate nights, weddings and star-studded shows — planned, produced and hosted end-to-end.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <PortfolioFilter events={events} categories={cats} />
          <div className="center" style={{ marginTop: 40 }}>
            <Link className="btn btn-primary" href="/contact">Plan Your Event With Us</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
