import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import GalleryExplorer from "../../components/GalleryExplorer";
import ArtistVideos from "../../components/ArtistVideos";
import Reveal from "../../components/Reveal";
import { getGalleryItems } from "../../lib/db";
import { youTubeId } from "../../lib/video";

export const revalidate = 60;

export const metadata = {
  title: "Gallery",
  description: "Photos from government events, corporate nights, weddings, celebrity shows and behind-the-scenes moments by Samridhi Films & Television.",
};

const CATEGORIES = [
  "Government", "Corporate", "Weddings", "Celebrity Shows",
  "Cultural", "Stage Productions", "Behind the Scenes", "Event Posters",
];

export default async function GalleryPage() {
  const items = await getGalleryItems();
  const photos = items.filter((g) => g.kind === "photo" || !g.kind);
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
  const videos = items
    .filter((g) => g.kind === "video" && g.video_url)
    .map((g) => ({ source: detectSource(g.video_url), ref: g.video_url, thumb: g.image_url || "", title: g.title || "" }));
  const cats = CATEGORIES.filter((c) => photos.some((g) => g.category === c));

  return (
    <>
      <SiteHeader />
      <section className="page-hero">
        <img className="hero-bg" src="/images/ig-guests-celebrating.jpg" alt="Celebration" />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal><span className="eyebrow">Gallery</span></Reveal>
          <Reveal delay={1}><h1>Moments &amp; Memories</h1></Reveal>
          <Reveal delay={2}><p className="sub">Photos from our stages, weddings and celebrations — select any photo to view it up close.</p></Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GalleryExplorer items={photos} categories={cats} />
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section" style={{ paddingTop: 0, background: "var(--ivory)" }}>
          <div className="container">
            <Reveal>
              <div className="center">
                <span className="eyebrow"><span className="sec-num">01</span> Celebrity Feedback</span>
                <h2 className="h2">In Their Words — On Video</h2>
                <p className="lead">Artists and celebrities share their experience of working with Samridhi.</p>
              </div>
            </Reveal>
            <ArtistVideos videos={videos} />
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  );
}
