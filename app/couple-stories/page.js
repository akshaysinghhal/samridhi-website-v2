import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import CoupleCard from "../../components/CoupleCard";
import { getCoupleStories } from "../../lib/db";
import { siteUrl, jsonLdScript } from "../../lib/seo";

export const revalidate = 60;

export const metadata = {
  title: "Couple Stories",
  description: "Real couples, real words — watch what they say about their celebrations planned by Samridhi Films & Television.",
};

function videoSchema(s) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: s.title,
    description: s.label || "Couple story by Samridhi Films & Television",
    thumbnailUrl: s.thumbnail_url || undefined,
    uploadDate: s.created_at ? new Date(s.created_at).toISOString() : undefined,
    contentUrl: s.video_source === "youtube" && s.video_ref
      ? `https://www.youtube.com/watch?v=${s.video_ref}`
      : s.video_source === "vimeo" && s.video_ref
        ? `https://vimeo.com/${s.video_ref}`
        : /^https?:/.test(s.video_ref || "") ? s.video_ref : undefined,
  };
}

export default async function CoupleStoriesPage() {
  const stories = await getCoupleStories();

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#c2185b,#ff6f00)" }}>
        <img className="hero-bg" src="/images/ig-couple-portrait.jpg" alt="Wedding couple" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Couple Stories</span>
          <h1>Hear It Straight From Our Couples</h1>
          <p className="sub">Real celebrations, in their own words. Stories are added only with the couple&apos;s written consent.</p>
        </div>
      </section>

      <section className="section couple-section">
        <div className="container">
          {stories.length === 0 ? (
            <p className="lead center">New couple stories are being filmed — check back soon.</p>
          ) : (
            <div className="couple-grid">
              {stories.map((s) => (
                <CoupleCard key={s.id} story={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(stories.map(videoSchema)) }}
      />
      <SiteFooter />
    </>
  );
}
