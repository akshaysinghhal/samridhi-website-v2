"use client";
import { useState } from "react";
import Lightbox from "./Lightbox";

// Full gallery with category tabs and keyboard-accessible lightbox.
export default function GalleryExplorer({ items, categories }) {
  const [tab, setTab] = useState("all");
  const [lb, setLb] = useState(-1);

  const list = tab === "all" ? items : items.filter((g) => g.category === tab);
  const lbItems = list.map((g) => ({ src: g.image_url, title: g.title }));

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Gallery categories">
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")} role="tab" aria-selected={tab === "all"}>
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tab-btn ${tab === cat ? "active" : ""}`}
            onClick={() => setTab(cat)}
            role="tab"
            aria-selected={tab === cat}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="masonry">
        {list.map((g, i) => (
          <figure
            key={g.id}
            onClick={() => setLb(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLb(i); } }}
            tabIndex={0}
            role="button"
            aria-label={`View photo: ${g.title || "Gallery photo"}`}
            style={{ cursor: "zoom-in" }}
          >
            <img src={g.image_url} alt={g.title || "Gallery photo"} loading="lazy" />
            {(g.title || g.is_placeholder) && (
              <figcaption>
                {g.is_placeholder && <span className="placeholder-badge">Placeholder</span>}{" "}
                {g.title}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
      {list.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>More photos in this category are being added.</p>
      )}

      {lb >= 0 && (
        <Lightbox items={lbItems} index={lb} onClose={() => setLb(-1)} onNav={setLb} />
      )}
    </>
  );
}
