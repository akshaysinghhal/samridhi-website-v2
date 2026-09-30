import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ShowMedia from "../../components/ShowMedia";
import Reveal from "../../components/Reveal";
import { getInternationalShows } from "../../lib/db";

export const revalidate = 60;

export const metadata = {
  title: "International Shows",
  description: "Taking Indian entertainment beyond borders — Samridhi Films & Television's international festivals and shows.",
};

export default async function InternationalShowsPage() {
  const shows = await getInternationalShows();

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/poster-china-diwali-2015.jpg" alt="International show" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">International Shows</span></Reveal>
          <Reveal delay={1}><h1>Taking Indian Entertainment Beyond Borders</h1></Reveal>
          <Reveal delay={2}><p className="sub">From China&apos;s Diwali Festival to cultural showcases abroad — our stages travel the world.</p></Reveal>
        </div>
      </section>

      <section className="section" style={{ background: "var(--ivory)" }}>
        <div className="container">
          {shows.length === 0 ? (
            <p className="lead center">International show stories are being added — check back soon.</p>
          ) : (
            shows.map((show, idx) => (
              <Reveal key={show.id}>
                <div className="intl-split" style={{ marginTop: idx === 0 ? 0 : 54 }}>
                  <div className="intl-media">
                    {show.cover_image && (
                      <img src={show.cover_image} alt={show.title} loading={idx === 0 ? undefined : "lazy"} />
                    )}
                  </div>
                  <div className="intl-panel">
                    <span className="eyebrow">{show.country || "International"}</span>
                    <h3>{show.title}</h3>
                    <div className="intl-loc">
                      {[show.city, show.country].filter(Boolean).join(", ")}
                      {show.show_date ? ` · ${new Date(show.show_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                    </div>
                    {show.summary && <p>{show.summary}</p>}
                    {show.highlights && <p>{show.highlights}</p>}
                    <ShowMedia show={show} />
                  </div>
                </div>
              </Reveal>
            ))
          )}
          <Reveal>
            <div className="center" style={{ marginTop: 54 }}>
              <Link className="btn btn-primary" href="/contact">Take Our Shows to Your City <span className="arr">→</span></Link>
            </div>
          </Reveal>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
