"use client";
import { useState } from "react";
import VideoModal from "./VideoModal";

// Artist video gallery: thumbnails open the modal player.
export default function ArtistVideos({ videos }) {
  const [open, setOpen] = useState(-1);
  if (!videos || !videos.length) return null;

  return (
    <>
      <div className="video-grid">
        {videos.map((v, i) => v.source === "instagram" ? (
          <a className="video-card" key={i} href={v.ref || v.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
            {v.thumb ? (
              <img src={v.thumb} alt={v.title || "Artist video"} loading="lazy" />
            ) : (
              <div style={{ height: 210, background: "linear-gradient(135deg,#3B241C,#2A1B16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40 }}>▶</div>
            )}
            <div className="play-btn"><span>↗</span></div>
            {v.title && <div className="vtitle">{v.title}</div>}
            <div className="seo-hint" style={{ padding: "0 14px 12px" }}>Watch on Instagram</div>
          </a>
        ) : (
          <div className="video-card" key={i} onClick={() => setOpen(i)}>
            {v.thumb ? (
              <img src={v.thumb} alt={v.title || "Artist video"} loading="lazy" />
            ) : (
              <div style={{ height: 210, background: "linear-gradient(135deg,#3B241C,#2A1B16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40 }}>▶</div>
            )}
            <div className="play-btn"><span>▶</span></div>
            {v.title && <div className="vtitle">{v.title}</div>}
          </div>
        ))}
      </div>
      {open >= 0 && (
        <VideoModal
          source={videos[open].source || "youtube"}
          videoRef={videos[open].ref || videos[open].url}
          title={videos[open].title}
          onClose={() => setOpen(-1)}
        />
      )}
    </>
  );
}
