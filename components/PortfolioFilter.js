"use client";
import { useState } from "react";
import Link from "next/link";

// Category filter tabs for the portfolio grid.
export default function PortfolioFilter({ events, categories }) {
  const [tab, setTab] = useState("all");
  const list = tab === "all" ? events : events.filter((e) => e.category === tab);

  return (
    <>
      <div className="tabs">
        <button className={`tab-btn ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
          All Events
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
        {list.map((e) => (
          <Link key={e.id} href={`/portfolio/${e.slug}`} className="wedding-card" style={{ textDecoration: "none", color: "inherit" }}>
            {e.cover_image && <img src={e.cover_image} alt={e.title} loading="lazy" />}
            <div className="body">
              {e.is_placeholder && <span className="placeholder-badge">Placeholder</span>}
              <span className="acat" style={{ color: "var(--teal)" }}>{e.category}</span>
              <h3>{e.title}</h3>
              {(e.location || e.event_date) && (
                <div className="wmeta">
                  {[e.location, e.event_date ? new Date(e.event_date).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : ""].filter(Boolean).join(" • ")}
                </div>
              )}
              {e.description && <p>{e.description.slice(0, 110)}{e.description.length > 110 ? "…" : ""}</p>}
            </div>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <p className="lead center" style={{ marginTop: 24 }}>More events in this category are being added.</p>
      )}
    </>
  );
}
