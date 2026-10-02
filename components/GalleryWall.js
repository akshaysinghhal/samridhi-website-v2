"use client";
import { useState } from "react";
import Lightbox from "./Lightbox";
import VideoModal from "./VideoModal";

// Unified gallery wall: photos + videos in one masonry, filterable by
// media type (All / Photos / Videos) and by category (folders like "Venue Entry").
export default function GalleryWall({ items, categories }) {
  const [type, setType] = useState("all"); // all | photo | video
  const [cat, setCat] = useState("all");
  const [lb, setLb] = useState(-1);
  const [videoIdx, setVideoIdx] = useState(-1);

  const list = items.filter((g) => {
    if (type === "photo" && g.kind !== "photo") return false;
    if (type === "video" && g.kind !== "video") return false;
    if (cat !== "all" && (g.category || "Other") !== cat) return false;
    return true;
  });
  const photos = list.filter((g) => g.kind === "photo");
  const lbItems = photos.map((g) => ({ src: g.image_url, title: g.title }));
  const videos = list.filter((g) => g.kind === "video");

  const openPhoto = (g) => setLb(photos.findIndex((p) => p.id === g.id));
  const openVideo = (g) => setVideoIdx(videos.findIndex((v) => v.id === g.id));

  const counts = {
    all: items.length,
    photo: items.filter((g) => g.kind === "photo").length,
    video: items.filter((g) => g.kind === "video").length,
  };

  return (
    <>
      {/* Type filter: All / Photos / Videos */}
      <div className="gw-types" role="tablist" aria-label="Media type">
        {[
          ["all", "All"],
          ["photo", "Photos"],
          ["video", "Videos"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={type === key}
            className={`gw-type-btn ${type === key ? "active" : ""}`}
            onClick={() => { setType(key); setLb(-1); setVideoIdx(-1); }}
          >
            {label} <span className="gw-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Category folders */}
      {categories.length > 0 && (
        <div className="gw-cats" role="tablist" aria-label="Gallery categories">
          <button
            role="tab"
            aria-selected={cat === "all"}
            className={`gw-cat-btn ${cat === "all" ? "active" : ""}`}
            onClick={() => setCat("all")}
          >
            All folders
          </button>
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              className={`gw-cat-btn ${cat === c ? "active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="gw-wall">
        {list.map((g) => g.kind === "video" ? (
          g.source === "instagram" ? (
            <a
              key={g.id}
              className="gw-video"
              href={g.ref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Watch on Instagram: ${g.title || "Gallery video"}`}
            >
              {g.thumb ? (
                <img src={g.thumb} alt={g.title || "Gallery video"} loading="lazy" />
              ) : (
                <div className="gw-video-noimg" aria-hidden="true">▶</div>
              )}
              <div className="gw-play"><span>↗</span></div>
              <span className="gw-vbadge">Instagram</span>
              {g.title && <figcaption>{g.title}</figcaption>}
            </a>
          ) : (
            <figure
              key={g.id}
              className="gw-video"
              onClick={() => openVideo(g)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openVideo(g); } }}
              tabIndex={0}
              role="button"
              aria-label={`Play video: ${g.title || "Gallery video"}`}
            >
              {g.thumb ? (
                <img src={g.thumb} alt={g.title || "Gallery video"} loading="lazy" />
              ) : (
                <div className="gw-video-noimg" aria-hidden="true">▶</div>
              )}
              <div className="gw-play"><span>▶</span></div>
              <span className="gw-vbadge">Video</span>
              {g.title && <figcaption>{g.title}</figcaption>}
            </figure>
          )
        ) : (
          <figure
            key={g.id}
            className="gw-photo"
            onClick={() => openPhoto(g)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPhoto(g); } }}
            tabIndex={0}
            role="button"
            aria-label={`View photo: ${g.title || "Gallery photo"}`}
          >
            <img src={g.image_url} alt={g.title || "Gallery photo"} loading="lazy" />
            {g.title && <figcaption>{g.title}</figcaption>}
          </figure>
        ))}
      </div>
      {list.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>
          {type === "video" ? "No videos here yet — check back soon." : "More in this folder are being added."}
        </p>
      )}

      {lb >= 0 && (
        <Lightbox items={lbItems} index={lb} onClose={() => setLb(-1)} onNav={setLb} />
      )}
      {videoIdx >= 0 && videos[videoIdx] && (
        <VideoModal
          source={videos[videoIdx].source || "youtube"}
          videoRef={videos[videoIdx].ref}
          title={videos[videoIdx].title}
          onClose={() => setVideoIdx(-1)}
        />
      )}
    </>
  );
}
