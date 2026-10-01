"use client";
import { useEffect, useState } from "react";

// Homepage hero media: desktop gets the cinematic autoplay video, mobile gets
// the lightweight poster image (no heavy video download/autoplay on phones).
export default function HeroMedia({ video, poster, alt }) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  if (video && !mobile) {
    return (
      <video className="hero-bg" autoPlay muted loop playsInline poster={poster} preload="metadata">
        <source src={video} type="video/mp4" />
      </video>
    );
  }
  return (
    <img className="hero-bg" src={poster} alt={alt} fetchPriority="high" />
  );
}
