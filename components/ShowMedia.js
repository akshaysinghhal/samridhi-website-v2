"use client";
import { useState } from "react";
import { ytEmbed } from "../lib/video";
import Lightbox from "./Lightbox";

// Show card gallery: photos with lightbox + optional video play.
// The admin stores gallery as an array of URL strings (text[]); older rows may
// hold { src, caption } objects. Both shapes are accepted here.
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

export default function ShowMedia({ show }) {
  const [lb, setLb] = useState(-1);
  const photos = normPhotos(show.gallery);

  // Video: prefer the admin's video_url (YouTube link or direct MP4),
  // fall back to legacy video_ref / video_source fields.
  const rawVideo = show.video_url || show.video_ref || "";
  const yt = show.video_source === "youtube" ? ytEmbed(show.video_ref) : ytEmbed(rawVideo);
  const isDirect = !yt && /^https?:/.test(rawVideo);

  return (
    <>
      {yt ? (
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src={yt}
            title={show.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : isDirect ? (
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <video src={rawVideo} controls playsInline style={{ width: "100%", height: "100%" }} preload="none" />
        </div>
      ) : null}
      {photos.length > 0 && (
        <div className="masonry">
          {photos.map((g, i) => (
            <figure key={i} onClick={() => setLb(i)} style={{ cursor: "zoom-in" }}>
              <img src={g.src} alt={g.caption || show.title} loading="lazy" />
              {g.caption && <figcaption>{g.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {lb >= 0 && (
        <Lightbox
          items={photos.map((g) => ({ src: g.src, title: g.caption }))}
          index={lb}
          onClose={() => setLb(-1)}
          onNav={setLb}
        />
      )}
    </>
  );
}
