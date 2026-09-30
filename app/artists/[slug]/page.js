import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import LeadForm from "../../../components/LeadForm";
import ArtistVideos from "../../../components/ArtistVideos";
import { getArtist, getArtists } from "../../../lib/db";
import { breadcrumbJsonLd, jsonLdScript } from "../../../lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const a = await getArtist(params.slug);
  if (!a) return {};
  return {
    title: `${a.name} — Book for Your Event`,
    description: `${a.name} (${a.category || "Artist"}) is available for booking through Samridhi Films & Television. ${a.bio ? a.bio.slice(0, 140) : ""}`,
  };
}

export default async function ArtistDetailPage({ params }) {
  const a = await getArtist(params.slug);
  if (!a) notFound();

  const others = (await getArtists({ category: a.category, limit: 5 })).filter((x) => x.slug !== a.slug).slice(0, 4);
  const videos = Array.isArray(a.videos) ? a.videos : [];

  return (
    <>
      <SiteHeader />

      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="container">
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 22 }}>
            <Link href="/" style={{ color: "var(--pink)", fontWeight: 700 }}>Home</Link> →{" "}
            <Link href="/artists" style={{ color: "var(--pink)", fontWeight: 700 }}>Artists</Link> → {a.name}
          </p>
          <div className="about-grid">
            <div>
              {a.image_url ? (
                <img className="main" src={a.image_url} alt={a.name} />
              ) : (
                <div className="team-placeholder" style={{ borderRadius: 24 }}>
                  {a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
              )}
            </div>
            <div>
              {a.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
              <span className="eyebrow">{a.category || "Artist"}</span>
              <h1 className="h2">{a.name}</h1>
              {a.bio && <p className="lead">{a.bio}</p>}
              <p style={{ fontWeight: 700, color: "var(--pink-dark)", marginTop: 18 }}>
                {a.display_status || "Available for booking through Samridhi Films & Television."}
              </p>
              {(a.languages?.length > 0 || a.genres?.length > 0) && (
                <div className="artist-names" style={{ marginTop: 18 }}>
                  {[...(a.languages || []), ...(a.genres || [])].map((t) => <span key={t} style={{ color: "var(--plum)", borderColor: "#f0d7e2" }}>{t}</span>)}
                </div>
              )}
              <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="#book">Book This Artist</a>
                <Link className="btn btn-dark" href="/artists">All Artists</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section" style={{ background: "#fff", paddingTop: 40 }}>
          <div className="container">
            <div className="center">
              <span className="eyebrow">Videos</span>
              <h2 className="h2">Watch {a.name}</h2>
            </div>
            <ArtistVideos videos={videos} />
          </div>
        </section>
      )}

      <section className="section" id="book" style={{ background: "linear-gradient(135deg,#fff5f8,#fff9f3)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="center">
            <span className="eyebrow">Book This Artist</span>
            <h2 className="h2">Check Availability for {a.name}</h2>
            <p className="lead">Share your event date and city — we confirm availability and handle the rest.</p>
          </div>
          <LeadForm type="artist_booking" artistId={a.id} presetEventType="Celebrity / Artist Booking" />
        </div>
      </section>

      {others.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="center"><h2 className="h2">You May Also Like</h2></div>
            <div className="artist-names" style={{ justifyContent: "center" }}>
              {others.map((o) => (
                <Link key={o.id} href={`/artists/${o.slug}`} style={{ textDecoration: "none" }}><span>{o.name}</span></Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(
            breadcrumbJsonLd([
              { name: "Home", url: "/" },
              { name: "Artists", url: "/artists" },
              { name: a.name },
            ])
          ),
        }}
      />
      <SiteFooter />
    </>
  );
}
