import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PressGallery from "../../components/PressGallery";
import Reveal from "../../components/Reveal";
import { getPressClippings } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "Press & Media Coverage",
  description: "Newspaper and magazine coverage of Samridhi Films & Television events — Rajasthan Diwas, star nights and festivals.",
};

export default async function PressPage() {
  const raw = await getPressClippings();
  const items = raw.map((p) => ({
    ...p,
    year: p.published_on ? new Date(p.published_on).getFullYear() : null,
  }));
  const publications = [...new Set(items.map((p) => p.publication).filter(Boolean))].sort();
  const years = [...new Set(items.map((p) => p.year).filter(Boolean))].sort().reverse();

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/press-rajasthan-diwas.jpg" alt="Press coverage" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Press</span></Reveal>
          <Reveal delay={1}><h1>As Seen In</h1></Reveal>
          <Reveal delay={2}><p className="sub">Print coverage of our events — from Rajasthan Diwas to star-studded nights.</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {items.length === 0 ? (
            <p className="lead center">Press coverage is being digitised — check back soon.</p>
          ) : (
            <PressGallery items={items} publications={publications} years={years} />
          )}
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
