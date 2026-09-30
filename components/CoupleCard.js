"use client";
import { useState } from "react";
import VideoModal from "./VideoModal";

// One couple-story card. If the story has no playable video reference yet,
// the card is not clickable and shows no play button (instead of opening a
// broken "Video unavailable" player).
export default function CoupleCard({ story }) {
  const [open, setOpen] = useState(false);
  const hasVideo = !!(story.video_ref && String(story.video_ref).trim());

  const inner = (
    <>
      {story.thumbnail_url ? (
        <img src={story.thumbnail_url} alt={story.title} loading="lazy" />
      ) : (
        <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,var(--purple),var(--brand))" }} />
      )}
      {story.is_placeholder && (
        <span className="placeholder-badge" style={{ position: "absolute", top: 12, left: 12 }}>Placeholder</span>
      )}
      <span className="shade">
        <h3>{story.title}</h3>
        <span className="clabel">{story.label || "In Their Words"}</span>
      </span>
      {hasVideo ? (
        <span className="couple-play" aria-hidden="true">▶</span>
      ) : (
        <span className="couple-soon">Video coming soon</span>
      )}
    </>
  );

  if (!hasVideo) {
    return (
      <div className="couple-card" aria-label={story.title} style={{ cursor: "default" }}>
        {inner}
      </div>
    );
  }

  return (
    <>
      <button
        className="couple-card"
        onClick={() => setOpen(true)}
        aria-label={`Play video: ${story.title}`}
      >
        {inner}
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
