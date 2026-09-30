"use client";
import { useState } from "react";
import Link from "next/link";

const GRADS = [
  "linear-gradient(135deg,#7b1fa2,#e91e63)",
  "linear-gradient(135deg,#e91e63,#ff6f00)",
  "linear-gradient(135deg,#00acc1,#5e35b1)",
  "linear-gradient(135deg,#ff6f00,#ffc107)",
];

// Client-side category tabs for the artists grid.
export default function ArtistTabs({ artists, categories }) {
  const [tab, setTab] = useState("all");
  const list = tab === "all" ? artists : artists.filter((a) => a.category === tab);

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
          All Artists
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`tab-btn ${tab === cat ? "active" : ""}`}
            onClick={() => setTab(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="wedding-grid">
        {list.map((a, i) => (
          <Link
            key={a.id || a.slug || a.name}
            href={a.slug ? `/artists/${a.slug}` : "/artists"}
            className="artist-card"
            style={{ flex: "none", background: "#fff", border: "1px solid #f0d7e2", textDecoration: "none" }}
          >
            {a.image_url ? (
              <img src={a.image_url} alt={a.name} loading="lazy" />
            ) : (
              <div className="aimg" style={{ background: GRADS[i % GRADS.length] }}>
                {a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
            )}
            <div className="ainfo">
              <h4 style={{ color: "var(--ink)" }}>{a.name}</h4>
              {a.category && <span className="acat" style={{ color: "var(--pink)" }}>{a.category}</span>}
              {a.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
            </div>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>More artists in this category are being added — ask us on WhatsApp for options.</p>
      )}
    </>
  );
}
