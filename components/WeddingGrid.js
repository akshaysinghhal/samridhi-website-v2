"use client";
import { useState } from "react";
import Lightbox from "./Lightbox";

// weddings: [{id,title,location,event_date,description,cover_image,gallery[],pinned}]
export default function WeddingGrid({ weddings }) {
  const [open, setOpen] = useState(null); // wedding index
  const [idx, setIdx] = useState(0);

  const openWedding = (i) => { setOpen(i); setIdx(0); };
  const w = open !== null ? weddings[open] : null;
  const items = w
    ? [{ src: w.cover_image, title: w.title }, ...(w.gallery || []).map((g) => ({ src: g, title: w.title }))]
        .filter((x) => x.src)
    : [];

  return (
    <>
      <div className="wedding-grid">
        {weddings.map((wd, i) => (
          <div className="wedding-card" key={wd.id} onClick={() => openWedding(i)}>
            {wd.cover_image && <img src={wd.cover_image} alt={wd.title} loading="lazy" />}
            <div className="body">
              {wd.pinned && <span className="pin-badge">★ Featured</span>}
              <h3>{wd.title}</h3>
              {(wd.location || wd.event_date) && (
                <div className="wmeta">
                  {[wd.location, wd.event_date ? new Date(wd.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""]
                    .filter(Boolean).join(" • ")}
                </div>
              )}
              {wd.description && <p>{wd.description}</p>}
              {(wd.gallery || []).length > 0 && (
                <span className="read" style={{ color: "var(--brand)", fontWeight: 700, fontSize: 14, display: "inline-block", marginTop: 12 }}>
                  View {(wd.gallery || []).length + (wd.cover_image ? 1 : 0)} photos →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {w && items.length > 0 && (
        <Lightbox items={items} index={idx} onClose={() => setOpen(null)} onNav={setIdx} />
      )}
    </>
  );
}
