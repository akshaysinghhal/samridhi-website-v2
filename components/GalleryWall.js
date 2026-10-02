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
  const [catOpen, setCatOpen] = useState(false); // mobile category popup

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

      {/* Category pills (desktop) / filter popup trigger (mobile) */}
      {categories.length > 0 && (
        <>
          <div className="gw-cats" role="tablist" aria-label="Gallery categories">
            <button
              role="tab"
              aria-selected={cat === "all"}
              className={`gw-cat-btn ${cat === "all" ? "active" : ""}`}
              onClick={() => setCat("all")}
            >
              All categories
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
          <button
            className="gw-cat-trigger"
            onClick={() => setCatOpen(true)}
            aria-haspopup="dialog"
          >
            <span className="gw-cat-trigger-label">Categories</span>
            <strong>{cat === "all" ? "All" : cat}</strong>
            <span aria-hidden="true" className="gw-cat-trigger-arrow">▾</span>
          </button>
          {catOpen && (
            <div className="gw-sheet-backdrop" onClick={() => setCatOpen(false)}>
              <div
                className="gw-sheet"
                role="dialog"
                aria-label="Filter gallery by category"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="gw-sheet-head">
                  <strong>Categories</strong>
                  <button className="gw-sheet-close" onClick={() => setCatOpen(false)} aria-label="Close">×</button>
                </div>
                <div className="gw-sheet-list">
                  {[["all", "All categories"], ...categories.map((c) => [c, c])].map(([key, label]) => (
                    <button
                      key={key}
                      className={`gw-sheet-item ${cat === key ? "active" : ""}`}
                      onClick={() => { setCat(key); setCatOpen(false); }}
                    >
                      {label}
                      {cat === key && <span aria-hidden="true" className="gw-sheet-tick">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
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
          {type === "video" ? "No videos here yet — check back soon." : "More in this category are being added."}
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
