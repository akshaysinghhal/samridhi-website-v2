"use client";
import { useState } from "react";
import Link from "next/link";

// Client-side category tabs for the artists grid — luxury editorial cards.
// Artists without a photo get an elegant typographic tile (never initials).
export default function ArtistTabs({ artists, categories }) {
  const [tab, setTab] = useState("all");
  const list = tab === "all" ? artists : artists.filter((a) => a.category === tab);

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Filter artists by category">
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
      <div className="artist-grid">
        {list.map((a) => (
          <Link
            key={a.id || a.slug || a.name}
            href={a.slug ? `/artists/${a.slug}` : "/artists"}
            className="artist-lux"
            aria-label={a.name}
          >
            {a.image_url ? (
              <img src={a.image_url} alt={a.name} loading="lazy" />
            ) : (
              <div className="aimg" aria-hidden="true">
                <span style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", fontFamily: "var(--font)", fontWeight: 700 }}>{a.category || "Artist"}</span>
              </div>
            )}
            <span className="ashade">
              <h4>{a.name}</h4>
              {a.category && <span className="acat">{a.category}</span>}
              <span className="aview">View Profile <span className="arr">→</span></span>
            </span>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>More artists in this category are being added — ask us on WhatsApp for options.</p>
      )}
    </>
  );
}
