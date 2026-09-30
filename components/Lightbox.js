"use client";
import { useEffect, useCallback } from "react";
import { ytEmbed } from "../lib/video";

// items: [{ src, title, videoUrl? }]
export default function Lightbox({ items, index, onClose, onNav }) {
  const go = useCallback(
    (d) => onNav((index + d + items.length) % items.length),
    [index, items.length, onNav]
  );

  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [go, onClose]);

  if (!items.length) return null;
  const item = items[index];
  const embed = item.videoUrl ? ytEmbed(item.videoUrl) : null;

  return (
    <div className="lightbox" onClick={onClose}>
      <button className="lb-close" onClick={onClose} aria-label="Close">×</button>
      {items.length > 1 && (
        <>
          <button className="lb-prev" aria-label="Previous"
            onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
          <button className="lb-next" aria-label="Next"
            onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
        </>
      )}
      <div className="lb-content" onClick={(e) => e.stopPropagation()}>
        {embed ? (
          <div className="video-wrap">
            <iframe src={embed} title={item.title || "Video"} allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        ) : item.videoUrl ? (
          <video src={item.videoUrl} controls autoPlay style={{ maxWidth: "100%", maxHeight: "76vh", borderRadius: 12 }} />
        ) : (
          <img src={item.src} alt={item.title || ""} />
        )}
        <div className="lb-cap">
          {item.title || ""}
          {items.length > 1 && <span>{index + 1} / {items.length}</span>}
        </div>
      </div>
    </div>
  );
}
