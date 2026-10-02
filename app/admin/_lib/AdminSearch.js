"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_SEARCH_INDEX } from "../../../lib/adminSearch";

// Admin command-palette search. Lives in the sidebar (and mobile menu):
// type to filter admin pages + sub-sections, ↑/↓ + Enter to jump, Esc to close.
// Ctrl/Cmd+K focuses it from anywhere in admin.
export function AdminSearch({ onNavigate }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const router = useRouter();
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return ADMIN_SEARCH_INDEX.filter((it) =>
      `${it.title} ${it.section || ""} ${it.keywords || ""}`.toLowerCase().includes(needle)
    ).slice(0, 8);
  }, [q]);

  useEffect(() => { setHi(0); }, [q]);

  // Close on outside tap; Ctrl/Cmd+K focuses the search from anywhere.
  useEffect(() => {
    const outside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const hotkey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", hotkey);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", hotkey);
    };
  }, []);

  const go = (href) => {
    setOpen(false);
    setQ("");
    if (onNavigate) onNavigate();
    router.push(href);
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setHi((h) => (h + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setHi((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === "Enter" && results.length) {
      e.preventDefault();
      go(results[Math.min(hi, results.length - 1)].href);
    } else if (e.key === "Escape") {
      setQ("");
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="admin-search" ref={boxRef}>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="🔍 Search admin…  (Ctrl+K)"
        aria-label="Search admin pages and settings"
        autoComplete="off"
      />
      {open && q.trim().length >= 2 && (
        <div className="admin-search-results" role="listbox">
          {results.length === 0 ? (
            <div className="admin-search-empty">No match — try another word.</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.href + r.title}
                type="button"
                role="option"
                aria-selected={i === hi}
                className={"admin-search-item" + (i === hi ? " hi" : "")}
                onMouseEnter={() => setHi(i)}
                onClick={() => go(r.href)}
              >
                <span className="asr-title">{r.title}</span>
                {r.section && <span className="asr-sec">{r.section}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
