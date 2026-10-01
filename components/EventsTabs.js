"use client";
import { useState } from "react";
import Link from "next/link";

// events: [{slug, title, cover_image, event_date, location, category}]
// Tabbed Upcoming / Past event cards. Rendered inside app/events/page.js.
export default function EventsTabs({ upcoming, past }) {
  const [tab, setTab] = useState("upcoming");
  const list = tab === "upcoming" ? upcoming : past;

  const fmtDate = (d) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return d;
    }
  };

  const card = (e) => (
    <Link key={e.id} href={`/events/${e.slug}`} className="wedding-card" style={{ textDecoration: "none", color: "inherit" }}>
      {e.cover_image && <img src={e.cover_image} alt={e.title} loading="lazy" />}
      <div className="body">
        {e.event_date && (
          <div className="wmeta" style={{ color: "var(--brand)", fontWeight: 700, marginBottom: 6 }}>
            📅 {fmtDate(e.event_date)}
          </div>
        )}
        <h3>{e.title}</h3>
        {(e.location || e.category) && (
          <div className="wmeta">{[e.category, e.location].filter(Boolean).join(" • ")}</div>
        )}
      </div>
    </Link>
  );

  return (
    <>
      <div className="tabs">
        <button
          className={`tab-btn ${tab === "upcoming" ? "active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming Events{upcoming.length > 0 ? ` (${upcoming.length})` : ""}
        </button>
        <button
          className={`tab-btn ${tab === "past" ? "active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past Events{` (${past.length})`}
        </button>
      </div>

      {list.length === 0 ? (
        <p className="lead" style={{ textAlign: "center", marginTop: 40 }}>
          {tab === "upcoming"
            ? "No upcoming events announced yet — check back soon."
            : "No past events to show yet."}
        </p>
      ) : (
        <div className="wedding-grid">{list.map(card)}</div>
      )}
    </>
  );
}
