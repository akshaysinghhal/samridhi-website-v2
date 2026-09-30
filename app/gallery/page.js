import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import GalleryExplorer from "../../components/GalleryExplorer";
import ArtistVideos from "../../components/ArtistVideos";
import { getGalleryItems } from "../../lib/db";

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
  const videos = items
    .filter((g) => g.kind === "video" && g.video_url)
    .map((g) => ({ source: "cloudinary", ref: g.video_url, thumb: g.image_url || "", title: g.title || "" }));
  const cats = CATEGORIES.filter((c) => photos.some((g) => g.category === c));

  return (
    <>
      <SiteHeader />
      <section className="hero" style={{ background: "linear-gradient(120deg,#e91e63,#7b1fa2)" }}>
        <img className="hero-bg" src="/images/ig-guests-celebrating.jpg" alt="Celebration" />
        <div className="container hero-inner" style={{ padding: "80px 0 70px" }}>
          <span className="eyebrow" style={{ color: "#ffe082" }}>Gallery</span>
          <h1>Moments &amp; Memories</h1>
          <p className="sub">Photos from our stages, weddings and celebrations — select any photo to view it up close.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <GalleryExplorer items={photos} categories={cats} />
        </div>
      </section>

      {videos.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <span className="eyebrow">Celebrity Feedback</span>
            <h2 style={{ marginTop: 8 }}>In Their Words — On Video</h2>
            <p className="lead">Artists and celebrities share their experience of working with Samridhi.</p>
            <ArtistVideos videos={videos} />
          </div>
        </section>
      )}
      <SiteFooter />
    </>
  );
}
