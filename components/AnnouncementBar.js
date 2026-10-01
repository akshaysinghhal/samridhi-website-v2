"use client";
import { useEffect, useState } from "react";

// Slim site-wide announcement strip rendered above the header.
// Dismissible per visit (X); a new message reappears automatically because the
// dismissal is keyed on the message text.
export default function AnnouncementBar({ text, linkUrl, linkLabel }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!text) return;
    try {
      setOpen(sessionStorage.getItem("ann_closed") !== text);
    } catch {
      setOpen(true);
    }
  }, [text]);

  if (!open || !text) return null;

  const close = () => {
    try {
      sessionStorage.setItem("ann_closed", text);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div className="announce-bar" role="region" aria-label="Announcement">
      <p>
        <span>{text}</span>
        {linkUrl ? (
          <>
            {" "}
            <a href={linkUrl}>{linkLabel || "Learn more →"}</a>
          </>
        ) : null}
      </p>
      <button type="button" onClick={close} aria-label="Dismiss announcement">
        ✕
      </button>
    </div>
  );
}
