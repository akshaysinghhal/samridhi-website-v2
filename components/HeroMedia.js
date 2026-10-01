"use client";
import { useEffect, useRef, useState } from "react";

// Homepage hero media:
// - Desktop: the cinematic video autoplays (muted, loop).
// - Mobile: the poster is shown first — no heavy download and no autoplay
//   on phones (Akshay's requirement). A play button calls video.play()
//   synchronously inside the tap handler, so iOS keeps the user gesture
//   and allows playback with sound. preload="none" means zero bytes are
//   downloaded until the visitor taps play.
function mimeFor(src) {
  const clean = String(src || "").split("?")[0].toLowerCase();
  if (clean.endsWith(".webm")) return "video/webm";
  if (clean.endsWith(".mov")) return "video/quicktime";
  if (clean.endsWith(".m4v")) return "video/x-m4v";
  if (clean.endsWith(".ogv")) return "video/ogg";
  return "video/mp4";
}

export default function HeroMedia({ video, mobileVideo, poster, alt }) {
  const [mobile, setMobile] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [tapError, setTapError] = useState("");
  const vidRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Desktop: autoplay muted loop.
  if (video && !mobile) {
    return (
      <video className="hero-bg" autoPlay muted loop playsInline poster={poster} preload="metadata">
        <source src={video} type={mimeFor(video)} />
      </video>
    );
  }

  const tapSrc = mobileVideo || video;

  const handleTap = () => {
    setTapError("");
    const v = vidRef.current;
    if (v) {
      // Called synchronously in the tap handler → mobile browsers treat
      // this as a user gesture, so playback with sound is allowed.
      const p = v.play();
      if (p && typeof p.catch === "function") {
        p.catch(() =>
          setTapError("Couldn't play this video — please tap the player controls to retry.")
        );
      }
    }
    setPlaying(true);
  };

  return (
    <>
      {mobile && tapSrc ? (
        <video
          ref={vidRef}
          className="hero-bg"
          playsInline
          controls={playing}
          preload="none"
          poster={poster}
          onPlaying={() => setPlaying(true)}
          onError={() =>
            setTapError("This video couldn't load. Please check your connection and try again.")
          }
        >
          <source src={tapSrc} type={mimeFor(tapSrc)} />
        </video>
      ) : (
        <img className="hero-bg" src={poster} alt={alt} fetchPriority="high" />
      )}
      {mobile && tapSrc && !playing && (
        <button
          type="button"
          onClick={handleTap}
          aria-label="Play video"
          className="hero-play"
        >
          <span>▶</span>
        </button>
      )}
      {mobile && tapError && (
        <p className="hero-play-err" role="alert">
          {tapError}
        </p>
      )}
    </>
  );
}
