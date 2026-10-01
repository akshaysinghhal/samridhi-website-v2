"use client";
import { useEffect, useRef } from "react";

// Full-size preview for an image or video URL. Used across admin forms and
// the media library: click any thumbnail to inspect it before using it.
export default function PreviewModal({ url, kind, title, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = prev; };
  }, [onClose]);
  if (!url) return null;
  const isVideo = kind === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(url);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Preview: ${title}` : "Media preview"}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(20,12,10,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "min(960px, 94vw)", maxHeight: "88vh", background: "#000", borderRadius: 12, overflow: "hidden" }}>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close preview"
          style={{ position: "absolute", top: 10, right: 10, zIndex: 2, width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
        >×</button>
        {isVideo ? (
          <video src={url} controls autoPlay playsInline style={{ display: "block", maxWidth: "min(960px, 94vw)", maxHeight: "88vh", width: "auto", height: "auto" }} />
        ) : (
          <img src={url} alt={title || "Preview"} style={{ display: "block", maxWidth: "min(960px, 94vw)", maxHeight: "88vh", objectFit: "contain" }} />
        )}
      </div>
    </div>
  );
}
