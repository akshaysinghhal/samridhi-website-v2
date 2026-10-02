"use client";
import { useState } from "react";
import VideoModal from "./VideoModal";
import { youTubeId, ytThumb } from "../lib/video";

// Homepage video-testimonial card. Reuses the couple-card look (photo in the
// brief): portrait card, bottom shade with name, round play button, and a
// modal player on click. Only rendered for testimonials that have a video.
export default function TestimonialCard({ t }) {
  const [open, setOpen] = useState(false);
  const url = String(t.video_url || "").trim();
  const isYt = !!youTubeId(url);
  if (!url) return null;

  const title = t.author_name || "Client testimonial";
  let thumb = null;
  if (t.photo_url) {
    thumb = <img src={t.photo_url} alt={title} loading="lazy" />;
  } else if (isYt) {
    thumb = <img src={ytThumb(url)} alt={title} loading="lazy" />;
  } else {
    thumb = <video className="tcard-vid" src={url} preload="metadata" muted playsInline aria-hidden="true" />;
  }

  return (
    <>
      <button className="couple-card" onClick={() => setOpen(true)} aria-label={`Play testimonial by ${title}`}>
        {thumb}
        <span className="shade">
          <h3>{title}</h3>
          <span className="clabel">{t.company || "In Their Words"}</span>
        </span>
        <span className="couple-play" aria-hidden="true">▶</span>
      </button>
      {open && (
        <VideoModal
          source={isYt ? "youtube" : "mp4_url"}
          videoRef={url}
          title={`Testimonial — ${title}`}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
