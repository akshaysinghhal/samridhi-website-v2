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
        {videos.map((v, i) => (
          <div className="video-card" key={i} onClick={() => setOpen(i)}>
            {v.thumb ? (
              <img src={v.thumb} alt={v.title || "Artist video"} loading="lazy" />
            ) : (
              <div style={{ height: 210, background: "linear-gradient(135deg,#7b1fa2,#e91e63)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 40 }}>▶</div>
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
