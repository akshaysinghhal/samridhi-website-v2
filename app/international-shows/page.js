import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import ShowMedia from "../../components/ShowMedia";
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
      <section className="hero" style={{ background: "linear-gradient(120deg,#5e35b1,#00acc1)" }}>
        <img className="hero-bg" src="/images/poster-china-diwali-2015.jpg" alt="International show" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>International Shows</span>
          <h1>Taking Indian Entertainment Beyond Borders</h1>
          <p className="sub">From China&apos;s Diwali Festival to cultural showcases abroad — our stages travel the world.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {shows.length === 0 ? (
            <p className="lead center">International show stories are being added — check back soon.</p>
          ) : (
            shows.map((show, idx) => (
              <div key={show.id} className="about-grid" style={{ marginBottom: 80, alignItems: "start" }}>
                <div>
                  {show.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
                  <span className="eyebrow">{show.country || "International"}</span>
                  <h2 className="h2">{show.title}</h2>
                  {show.show_date && (
                    <p style={{ color: "var(--muted)", fontSize: 15 }}>
                      {new Date(show.show_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                  <p className="lead">{show.summary}</p>
                  {show.highlights && <p>{show.highlights}</p>}
                </div>
                <div>
                  {show.cover_image && (
                    <img className="main" src={show.cover_image} alt={show.title} loading={idx === 0 ? undefined : "lazy"} />
                  )}
                  <ShowMedia show={show} />
                </div>
              </div>
            ))
          )}
          <div className="center">
            <Link className="btn btn-primary" href="/contact">Take Our Shows to Your City</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
