import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PortfolioFilter from "../../components/PortfolioFilter";
import Reveal from "../../components/Reveal";
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
  const all = await getEvents({ limit: 200 });
  // Upcoming (future-dated) events live on /events — portfolio shows completed work.
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const events = all.filter((e) => !e.event_date || e.event_date < today);
  const cats = CATEGORIES.filter((c) => events.some((e) => e.category === c));

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/fb-performer-big-audience.jpg" alt="Large event audience" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Portfolio</span></Reveal>
          <Reveal delay={1}><h1>Events That Speak for Themselves</h1></Reveal>
          <Reveal delay={2}><p className="sub">Government programs, corporate nights, weddings and star-studded shows — planned, produced and hosted end-to-end.</p></Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          <PortfolioFilter events={events} categories={cats} />
          <Reveal>
            <div className="center" style={{ marginTop: 48 }}>
              <Link className="btn btn-primary" href="/contact">Plan Your Event With Us <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
