import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import GalleryWall from "../../components/GalleryWall";
import ArtistVideos from "../../components/ArtistVideos";
import Reveal from "../../components/Reveal";
import { getGalleryItems } from "../../lib/db";
import { youTubeId } from "../../lib/video";

export const revalidate = 60;

export const metadata = {
  title: "Gallery",
  description: "Photos and videos from government events, corporate nights, weddings, celebrity shows and behind-the-scenes moments by Samridhi Films & Television.",
};

// Detect the player source from the URL: YouTube links need the YouTube
// embed player — a <video> tag cannot play a youtube.com watch URL.
// Instagram reels cannot be embedded in a player at all — they open on Instagram.
const detectSource = (url) => {
  const u = String(url || "");
  if (youTubeId(u)) return "youtube";
  if (/vimeo\.com/.test(u)) return "vimeo";
  if (/instagram\.com/.test(u)) return "instagram";
  return "mp4_url";
};

export default async function GalleryPage() {
  const raw = await getGalleryItems();
  // Unified wall: photos and videos share the same category folders,
  // so e.g. "Venue Entry" shows its photos AND videos together.
  const items = raw.map((g) => {
    const isVideo = g.kind === "video";
    return {
      id: g.id,
      kind: isVideo ? "video" : "photo",
      title: g.title || "",
      image_url: g.image_url || "",
      category: g.category || "Other",
      // video fields
      source: isVideo && g.video_url ? detectSource(g.video_url) : null,
      ref: isVideo ? g.video_url || "" : "",
      thumb: isVideo ? g.image_url || "" : "",
    };
  }).filter((g) => (g.kind === "photo" ? g.image_url : g.ref));
  const categories = [...new Set(items.map((g) => g.category))].sort();

  // Celebrity feedback reels stay in their own section below.
  const feedback = items.filter((g) => g.kind === "video" && g.category === "Celebrity Feedback");

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/ig-guests-celebrating.jpg" alt="Celebration" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Gallery</span></Reveal>
          <Reveal delay={1}><h1>Moments &amp; Memories</h1></Reveal>
          <Reveal delay={2}><p className="sub">Photos and videos from our stages, weddings and celebrations — pick a folder, or filter by photos and videos.</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GalleryWall items={items} categories={categories} />
        </div>
      </section>

      {feedback.length > 0 && (
        <section className="section" style={{ paddingTop: 0, background: "var(--ivory)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow">Celebrity Feedback</span>
                <h2 className="h2">In Their Words — On Video</h2>
                <p className="lead">Artists and celebrities share their experience of working with Samridhi.</p>
              </div>
            </Reveal>
            <ArtistVideos videos={feedback} />
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  );
}
