"use client";
import { useEffect, useState } from "react";

// Homepage hero media: the video autoplays (muted, loop) on both desktop
// and mobile. On mobile (<=900px) the mobile video URL is used when it is
// set in Admin -> Homepage; otherwise the desktop video plays instead.
// Muted + playsInline is what lets mobile browsers autoplay.
function mimeFor(src) {
  const clean = String(src || "").split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".m4v")) return "video/x-m4v";
  if (clean.endsWith(".ogv")) return "video/ogg";
  return "video/mp4";
}

export default function HeroMedia({ video, mobileVideo, poster, alt }) {
  // Initialise from matchMedia on the client so phones pick the mobile
  // video on the very first render (avoids downloading the desktop file).
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const src = mobile ? mobileVideo || video : video;

  if (src) {
    // key={src}: changing a <source> URL alone does not make the <video>
    // element reload — remounting on src change guarantees the right file plays.
    return (
      <video
        key={src}
        className="hero-bg"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        preload="metadata"
      >
        <source src={src} type={mimeFor(src)} />
      </video>
    );
  }

  return (
    <img className="hero-bg" src={poster} alt={alt} fetchPriority="high" />
  );
}
