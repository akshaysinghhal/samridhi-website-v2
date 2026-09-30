"use client";
import { useState } from "react";
import Lightbox from "./Lightbox";

// photos: [{src, title}], videos: [{thumb, title, videoUrl}]
export default function GalleryTabs({ photos, videos }) {
  const [tab, setTab] = useState("photos");
  const [lb, setLb] = useState(-1); // lightbox index within active tab

  const hasVideos = videos && videos.length > 0;
  const activeItems =
    tab === "photos"
      ? photos.map((p) => ({ src: p.src, title: p.title }))
      : videos.map((v) => ({ src: v.thumb, title: v.title, videoUrl: v.videoUrl }));

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === "photos" ? "active" : ""}`} onClick={() => setTab("photos")}>
          📷 Photos
        </button>
        {hasVideos && (
          <button className={`tab-btn ${tab === "videos" ? "active" : ""}`} onClick={() => setTab("videos")}>
            🎬 Videos
          </button>
        )}
      </div>

      {tab === "photos" && (
        <div className="masonry">
          {photos.map((p, i) => (
            <figure key={p.src + i} onClick={() => setLb(i)} style={{ cursor: "zoom-in" }}>
              <img src={p.src} alt={p.title || "Gallery photo"} loading="lazy" />
              {p.title && <figcaption>{p.title}</figcaption>}
            </figure>
          ))}
        </div>
      )}

      {tab === "videos" && hasVideos && (
        <div className="video-grid">
          {videos.map((v, i) => (
            <div className="video-card" key={v.videoUrl + i} onClick={() => setLb(i)}>
              {v.thumb ? (
                <img src={v.thumb} alt={v.title || "Video"} loading="lazy" />
              ) : (
                <video src={v.videoUrl} preload="metadata" muted />
              )}
              <div className="play-btn"><span>▶</span></div>
              {v.title && <div className="vtitle">{v.title}</div>}
            </div>
          ))}
        </div>
      )}

      {lb >= 0 && (
        <Lightbox items={activeItems} index={lb} onClose={() => setLb(-1)} onNav={setLb} />
      )}
    </>
  );
}
