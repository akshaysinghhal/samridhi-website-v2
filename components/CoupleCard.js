"use client";
import { useState } from "react";
import VideoModal from "./VideoModal";

// One couple-story card: the whole card is a button that opens the video modal.
export default function CoupleCard({ story }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="couple-card"
        onClick={() => setOpen(true)}
        aria-label={`Play video: ${story.title}`}
      >
        {story.thumbnail_url ? (
          <img src={story.thumbnail_url} alt={story.title} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,var(--purple),var(--pink))" }} />
        )}
        {story.is_placeholder && (
          <span className="placeholder-badge" style={{ position: "absolute", top: 12, left: 12 }}>Placeholder</span>
        )}
        <span className="shade">
          <h3>{story.title}</h3>
          <span className="clabel">{story.label || "In Their Words"}</span>
        </span>
        <span className="couple-play" aria-hidden="true">▶</span>
      </button>
      {open && (
        <VideoModal
          source={story.video_source}
          videoRef={story.video_ref}
          title={story.title}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
