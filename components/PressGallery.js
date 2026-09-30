"use client";
import { useState, useEffect } from "react";

// Filterable press masonry with a zoomable lightbox.
export default function PressGallery({ items, publications, years }) {
  const [pub, setPub] = useState("all");
  const [year, setYear] = useState("all");
  const [open, setOpen] = useState(-1);
  const [zoomed, setZoomed] = useState(false);

  const filtered = items.filter(
    (p) => (pub === "all" || p.publication === pub) && (year === "all" || String(p.year) === year)
  );

  useEffect(() => {
    if (open < 0) return;
    const h = (e) => {
      if (e.key === "Escape") setOpen(-1);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % filtered.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + filtered.length) % filtered.length);
    };
    window.addEventListener("keydown", h);
    setZoomed(false);
    return () => window.removeEventListener("keydown", h);
  }, [open, filtered.length]);

  return (
    <>
      <div className="press-filters">
        <select value={pub} onChange={(e) => setPub(e.target.value)} aria-label="Filter by publication">
          <option value="all">All Publications</option>
          {publications.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Filter by year">
          <option value="all">All Years</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="masonry">
        {filtered.map((p, i) => (
          <figure key={p.id} onClick={() => setOpen(i)} style={{ cursor: "zoom-in" }}>
            <img src={p.image_url} alt={p.headline || p.publication || "Press clipping"} loading="lazy" />
            <figcaption>
              {p.is_placeholder && <span className="placeholder-badge">Placeholder</span>}{" "}
              {[p.publication, p.headline].filter(Boolean).join(" — ")}{" "}
              <span style={{ opacity: 0.6 }}>
                ({p.type === "page_collage" ? "Page collage" : "Clipping"}{p.year ? `, ${p.year}` : ""})
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>No clippings match this filter.</p>
      )}

      {open >= 0 && filtered[open] && (
        <div className="lightbox" onClick={() => setOpen(-1)}>
          <button className="lb-close" onClick={() => setOpen(-1)} aria-label="Close">×</button>
          {filtered.length > 1 && (
            <>
              <button className="lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + filtered.length) % filtered.length); }}>‹</button>
              <button className="lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % filtered.length); }}>›</button>
            </>
          )}
          <button
            className="lb-zoom"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
          >
            {zoomed ? "−" : "+"}
          </button>
          <div className="lb-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={filtered[open].image_url}
              alt={filtered[open].headline || ""}
              className={zoomed ? "lb-zoomed" : ""}
              onClick={() => setZoomed((z) => !z)}
              style={{ cursor: zoomed ? "zoom-out" : "zoom-in" }}
            />
            <div className="lb-cap">
              {[filtered[open].publication, filtered[open].headline].filter(Boolean).join(" — ")}
              <span>{open + 1} / {filtered.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
