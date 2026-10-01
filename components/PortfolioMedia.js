"use client";
import { useState } from "react";
import Lightbox from "./Lightbox";
import { ytEmbed } from "../lib/video";

// Gallery + video grid for a portfolio detail page.
// The admin stores gallery as an array of URL strings (text[]); older rows may
// hold { src, caption } objects. Both shapes are accepted here.
// Video: prefers the admin's video_url (YouTube link or direct MP4); legacy
// video_source / video_ref are still supported.
function normPhotos(gallery) {
  if (!Array.isArray(gallery)) return [];
  return gallery
    .map((g) => {
      if (typeof g === "string") return g.trim() ? { src: g.trim(), caption: "" } : null;
      if (g && typeof g === "object" && g.src) return { src: g.src, caption: g.caption || "" };
      return null;
    })
    .filter(Boolean);
}

export default function PortfolioMedia({ gallery, videoSource, videoRef, videoUrl }) {
  const [lb, setLb] = useState(-1);
  const [videoOpen, setVideoOpen] = useState(false);
  const photos = normPhotos(gallery);

  const rawVideo = videoUrl || videoRef || "";
  const yt = videoSource === "youtube" ? ytEmbed(videoRef) : ytEmbed(rawVideo);
  const isDirect = !yt && /^https?:/.test(rawVideo);
  const hasVideo = !!(yt || isDirect);

  const lbItems = photos.map((g) => ({ src: g.src, title: g.caption }));

  return (
    <>
      {hasVideo && (
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
              {yt ? (
                <iframe
                  src={yt}
                  title="Event film"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={rawVideo} controls autoPlay style={{ width: "100%", height: "100%" }} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
