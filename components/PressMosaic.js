"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Interactive press mosaic for the homepage: a varied-size tile wall that
// always fits inside one viewport, with staggered entrance, hover captions
// and a tap-to-zoom lightbox.
const AREAS = ["pm-a", "pm-b", "pm-c", "pm-d", "pm-e", "pm-f", "pm-g", "pm-h"];

export default function PressMosaic({ items }) {
  const [open, setOpen] = useState(-1);
  const gridRef = useRef(null);
  const list = (items || []).slice(0, 8);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.classList.add("in"); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (open < 0) return;
    const h = (e) => {
      if (e.key === "Escape") setOpen(-1);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % list.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, list.length]);

  if (!list.length) return null;

  const altFor = (p) =>
    [p.headline, p.publication].filter(Boolean).join(" — ") || "Press clipping";

  return (
    <>
      <div ref={gridRef} className="pm-grid" role="list" aria-label="Press coverage mosaic">
        {list.map((p, i) => (
          <figure
            key={p.id || i}
            role="listitem"
            tabIndex={0}
            className={`pm-tile ${AREAS[i]}`}
            style={{ transitionDelay: `${(i % 8) * 70}ms` }}
            onClick={() => setOpen(i)}
            onKeyDown={(e) => { if (e.key === "Enter") setOpen(i); }}
            aria-label={`${altFor(p)} — open larger`}
          >
            <img src={p.image_url} alt={altFor(p)} loading="lazy" />
            <figcaption className="pm-cap">
              {p.publication && <span className="pm-pub">{p.publication}</span>}
              {p.headline && <span className="pm-head">{p.headline}</span>}
            </figcaption>
            <span className="pm-zoom" aria-hidden="true">+</span>
          </figure>
        ))}
      </div>
      <div className="pm-cta">
        <Link className="btn btn-dark" href="/press">All Press Coverage</Link>
      </div>

      {open >= 0 && list[open] && (
        <div className="lightbox" onClick={() => setOpen(-1)} role="dialog" aria-modal="true" aria-label="Press clipping viewer">
          <button className="lb-close" onClick={() => setOpen(-1)} aria-label="Close">×</button>
          {list.length > 1 && (
            <>
              <button className="lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + list.length) % list.length); }}>‹</button>
              <button className="lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % list.length); }}>›</button>
            </>
          )}
          <div className="lb-content" onClick={(e) => e.stopPropagation()}>
            <img src={list[open].image_url} alt={altFor(list[open])} />
            <div className="lb-cap">
              {[list[open].publication, list[open].headline].filter(Boolean).join(" — ")}
              <span>{open + 1} / {list.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
