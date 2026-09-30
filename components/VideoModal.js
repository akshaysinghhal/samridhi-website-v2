"use client";
import { useEffect, useRef } from "react";
import { ytEmbed } from "../lib/video";

function vimeoId(url) {
  if (!url) return null;
  const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

// Accessible modal video player. Lazy-loads the iframe/<video> only when open.
// Props: { source: 'youtube'|'vimeo'|'cloudinary'|'mp4_url', ref, title, onClose }
export default function VideoModal({ source, videoRef, title, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    import("../lib/analytics").then(({ trackEvent }) => {
      trackEvent("video_play", { video_title: title || "" });
    }).catch(() => {});
    const h = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  let player = null;
  if (source === "youtube") {
    const embed = ytEmbed(videoRef);
    if (embed) {
      player = (
        <div className="video-wrap">
          <iframe
            src={`${embed}?autoplay=1&rel=0`}
            title={title || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  } else if (source === "vimeo") {
    const id = vimeoId(videoRef);
    if (id) {
      player = (
        <div className="video-wrap">
          <iframe
            src={`https://player.vimeo.com/video/${id}?autoplay=1`}
            title={title || "Video"}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
  } else {
    // cloudinary public_id or direct mp4 url
    const src =
      source === "cloudinary" && videoRef && !/^https?:/.test(videoRef)
        ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo"}/video/upload/${videoRef}.mp4`
        : videoRef;
    if (src) {
      player = (
        <div className="video-wrap">
          <video src={src} controls autoPlay playsInline style={{ width: "100%", height: "100%" }} />
        </div>
      );
    }
  }

  return (
    <div
      className="video-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Play video: ${title}` : "Play video"}
    >
      <div className="video-modal" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="video-modal-close" onClick={onClose} aria-label="Close video">
          ×
        </button>
        {player || <p style={{ color: "#fff", padding: 40, textAlign: "center" }}>Video unavailable.</p>}
      </div>
    </div>
  );
}
