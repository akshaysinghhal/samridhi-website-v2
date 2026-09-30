"use client";
import { useState } from "react";
import { ytEmbed } from "../lib/video";
import Lightbox from "./Lightbox";

// Show card gallery: photos with lightbox + optional video play.
export default function ShowMedia({ show }) {
  const [lb, setLb] = useState(-1);
  const photos = Array.isArray(show.gallery) ? show.gallery.filter((g) => g.src) : [];
  const embed = show.video_source === "youtube" ? ytEmbed(show.video_ref) : null;

  return (
    <>
      {embed ? (
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src={embed}
            title={show.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : show.video_ref && /^https?:/.test(show.video_ref) ? (
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <video src={show.video_ref} controls playsInline style={{ width: "100%", height: "100%" }} preload="none" />
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
