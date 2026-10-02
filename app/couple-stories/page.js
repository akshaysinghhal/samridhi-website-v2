import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import CoupleCard from "../../components/CoupleCard";
import Reveal from "../../components/Reveal";
import { getContentMap, ci } from "../../lib/content";
import { getCoupleStories } from "../../lib/db";
import { siteUrl, jsonLdScript } from "../../lib/seo";

export const revalidate = 60;

export const metadata = {
  title: "Client Stories",
  description: "Real clients, real words — stories from celebrations planned by Samridhi Films & Television.",
};

function videoSchema(s) {
  const base = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: s.title,
    description: s.label || "Client story by Samridhi Films & Television",
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
  const [map, raw] = await Promise.all([getContentMap(), getCoupleStories()]);
  const stories = raw.filter((s) => !s.is_placeholder);

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src={ci(map, "couple-stories", "hero", "image") || "/images/ig-couple-portrait.jpg"} alt="Wedding couple" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Client Stories</span></Reveal>
          <Reveal delay={1}><h1>Stories From Our Celebrations</h1></Reveal>
          <Reveal delay={2}><p className="sub">Real celebrations, in their own words. Stories are added only with the client&apos;s consent.</p></Reveal>
        </div>
      </section>

      <section className="section story-band">
        <div className="container">
          {stories.length === 0 ? (
            <p className="lead center">New client stories are being filmed — check back soon.</p>
          ) : (
            <div className="couple-grid">
              {stories.map((s, i) => (
                <Reveal key={s.id} delay={i % 3}>
                  <CoupleCard story={s} />
                </Reveal>
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
