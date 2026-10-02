import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import LeadForm from "../../../components/LeadForm";
import ArtistVideos from "../../../components/ArtistVideos";
import Reveal from "../../../components/Reveal";
import { getArtist, getArtists } from "../../../lib/db";
import { breadcrumbJsonLd, jsonLdScript } from "../../../lib/seo";

export const revalidate = 60;

const ARTIST_DISCLAIMER = [
  "The information provided on this website is for general informational purposes only. We would like to clarify that while we may not exclusively manage the artists mentioned, we have established close relationships with them and their official management teams. These relationships allow us to negotiate favorable deals on behalf of our clients due to our extensive experience and volume of business, including repeated engagements. However, it is important to note that the availability, rates, and services offered by the artists are subject to their official management's discretion and scheduling.",
  "While we strive to provide accurate and up-to-date information, we cannot guarantee the availability or terms of any specific booking or collaboration. We work diligently to maintain strong partnerships with the artists and their official management teams, enabling us to provide our clients with exceptional opportunities. Our aim is to facilitate successful bookings, appearances, and collaborations based on our established relationships and industry expertise.",
  "Please contact us directly for further information regarding specific artists, their availability, and any other inquiries you may have. Our dedicated team is here to assist you and provide the most accurate and current information possible.",
  "If you are the owner of any copyrighted image displayed on our website and would like it to be removed/amended or properly credited, please contact us, and we will promptly address your concerns. We are committed to respecting intellectual property rights and will take all the appropriate action as necessary for managing a reputed artist management website.",
  "By using this website, you agree to be bound by these terms and conditions of use. This disclaimer is subject to change without notice.",
];

export async function generateMetadata({ params }) {
  const a = await getArtist(params.slug);
  if (!a) return {};
  const canonical = `/artists/${a.slug}`;
  return {
    title: `${a.name} — Book for Your Event`,
    description: `${a.name} (${a.category || "Artist"}) is available for booking through Samridhi Films & Television. ${a.bio ? a.bio.slice(0, 140) : ""}`,
    alternates: { canonical },
    openGraph: {
      title: `${a.name} — Book for Your Event`,
      description: `${a.name} (${a.category || "Artist"}) is available for booking through Samridhi Films & Television.`,
      url: canonical,
      images: a.photo_url ? [{ url: a.photo_url }] : undefined,
    },
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

      <section className="section" style={{ paddingBottom: 40, background: "var(--ivory)" }}>
        <div className="container">
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 30 }}>
            <Link href="/" style={{ color: "var(--terracotta)", fontWeight: 700 }}>Home</Link> →{" "}
            <Link href="/artists" style={{ color: "var(--terracotta)", fontWeight: 700 }}>Artists</Link> → {a.name}
          </p>
          <div className="wed-feature">
            <div className="wed-media">
              {a.image_url ? (
                <img className="main" src={a.image_url} alt={a.name} />
              ) : (
                <div className="aimg main" aria-hidden="true" style={{ height: 520 }}>
                  <span style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>{a.category || "Artist"}</span>
                </div>
              )}
            </div>
            <div className="wed-body">
              <span className="eyebrow">Profile · {a.category || "Artist"}</span>
              <h1 className="h2">{a.name}</h1>
              <hr className="gold-rule" />
              {a.bio && <p className="lead">{a.bio}</p>}
              <p style={{ fontWeight: 700, color: "var(--terracotta)", marginTop: 18 }}>
                {a.display_status || "Available for booking through Samridhi Films & Television."}
              </p>
              {(a.languages?.length > 0 || a.genres?.length > 0) && (
                <div className="tags" style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[...(a.languages || []), ...(a.genres || [])].map((t) => (
                    <span key={t} style={{ color: "var(--muted-brown)", border: "1px solid var(--border-gold)", background: "var(--warm-white)", padding: "6px 14px", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 26, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="#book">Book This Artist <span className="arr">→</span></a>
                <Link className="btn btn-dark" href="/artists">All Artists</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section" style={{ paddingTop: 40 }}>
          <div className="container">
            <div className="center">
              <span className="eyebrow">Videos</span>
              <h2 className="h2">Watch {a.name}</h2>
            </div>
            <ArtistVideos videos={videos} />
          </div>
        </section>
      )}

      <section className="section contact-band" id="book">
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="center">
            <span className="eyebrow">Book This Artist</span>
            <h2 className="h2">Check Availability for {a.name}</h2>
            <p className="lead">Share your event date and city — we confirm availability and handle the rest.</p>
          </div>
          <div style={{ marginTop: 40 }}>
            <LeadForm type="artist_booking" artistId={a.id} presetEventType="Celebrity / Artist Booking" />
          </div>
          <div className="artist-disclaimer">
            <h3>Disclaimer</h3>
            {ARTIST_DISCLAIMER.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section" style={{ background: "var(--ivory)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Keep Exploring</span>
                <h2 className="h2">You May Also Like</h2>
              </div>
            </Reveal>
            <div className="artist-grid">
              {others.map((o) => (
                <Link key={o.id} href={`/artists/${o.slug}`} className="artist-lux" aria-label={o.name}>
                  {o.image_url ? (
                    <img src={o.image_url} alt={o.name} loading="lazy" />
                  ) : (
                    <div className="aimg" aria-hidden="true">
                      <span style={{ fontSize: 20, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>{o.category || "Artist"}</span>
                    </div>
                  )}
                  <span className="ashade">
                    <h4>{o.name}</h4>
                    {o.category && <span className="acat">{o.category}</span>}
                    <span className="aview">View Profile <span className="arr">→</span></span>
                  </span>
                </Link>
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
