"use client";
import { useState } from "react";
import Link from "next/link";
import Lightbox from "./Lightbox";

// Gallery + video grid with category tabs for a portfolio detail page.
export default function PortfolioMedia({ gallery, videoSource, videoRef }) {
  const [lb, setLb] = useState(-1);
  const photos = (gallery || []).filter((g) => g.src);
  const [videoOpen, setVideoOpen] = useState(false);

  const lbItems = photos.map((g) => ({ src: g.src, title: g.caption }));

  return (
    <>
      {(videoSource && videoRef) && (
        <div className="video-card" style={{ marginBottom: 26 }} onClick={() => setVideoOpen(true)}>
          <div style={{ height: 320, background: "linear-gradient(135deg,#3B241C,#2A1B16)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 56 }}>▶</div>
          <div className="play-btn"><span>▶</span></div>
          <div className="vtitle">Event Film</div>
        </div>
      )}
      {photos.length > 0 && (
        <div className="masonry">
          {photos.map((g, i) => (
            <figure key={i} onClick={() => setLb(i)} style={{ cursor: "zoom-in" }}>
              <img src={g.src} alt={g.caption || "Event photo"} loading="lazy" />
              {g.caption && <figcaption>{g.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {lb >= 0 && <Lightbox items={lbItems} index={lb} onClose={() => setLb(-1)} onNav={setLb} />}
      {videoOpen && (
        <div className="lightbox" onClick={() => setVideoOpen(false)}>
          <button className="lb-close" onClick={() => setVideoOpen(false)} aria-label="Close">×</button>
          <div className="lb-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-wrap">
              {videoSource === "youtube" ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoRef}?autoplay=1&rel=0`}
                  title="Event film"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoSource === "vimeo" ? (
                <iframe
                  src={`https://player.vimeo.com/video/${videoRef}?autoplay=1`}
                  title="Event film"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={videoRef} controls autoPlay style={{ width: "100%", height: "100%" }} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
