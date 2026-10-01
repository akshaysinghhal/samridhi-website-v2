"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/adminApi";

// Shared AI writing helper for the admin panel. Everything goes through the
// server-side /api/admin/ai proxy (Gemini key stays server-side).

export function AiAssistModal({ open, onClose, onInsert, seedPrompt, title }) {
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState("en");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPrompt(seedPrompt || "");
      setResult("");
      setErr("");
      setCopied(false);
      document.body.style.overflow = "hidden";
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [open, seedPrompt, onClose]);

  if (!open) return null;

  const generate = async () => {
    const p = prompt.trim();
    if (!p || busy) return;
    setBusy(true); setErr(""); setResult(""); setCopied(false);
    try {
      const r = await api("/api/admin/ai", { method: "POST", body: { prompt: p, lang } });
      setResult(r.text || "");
    } catch (e) {
      setErr(e.message || "AI failed — please try again.");
    }
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setErr("Copy failed — select the text manually.");
    }
  };

  return (
    <div className="ai-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={title || "AI writing helper"}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()} ref={boxRef}>
        <div className="ai-head">
          <b>✨ {title || "AI writing helper"}</b>
          <button className="ai-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="ai-lang">
          <button type="button" className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
          <button type="button" className={lang === "hi" ? "on" : ""} onClick={() => setLang("hi")}>हिन्दी</button>
        </div>
        <label className="ai-label">What should the AI write?</label>
        <textarea
          className="ai-prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={lang === "hi" ? "जैसे: गोविंदा के इवेंट के लिए एक धमाकेदार घोषणा लिखो" : "e.g. Write a punchy announcement for Govinda's live event in Bhilwara"}
        />
        <button type="button" className="ai-gen" onClick={generate} disabled={busy || !prompt.trim()}>
          {busy ? "✨ Writing…" : "✨ Generate"}
        </button>
        {err && <div className="login-err" style={{ marginTop: 12 }}>{err}{err.includes("Integrations") ? <> <a href="/admin/integrations">Open Integrations &amp; AI</a></> : null}</div>}
        {result && (
          <>
            <label className="ai-label" style={{ marginTop: 14 }}>Result</label>
            <div className="ai-result" style={{ whiteSpace: "pre-wrap" }}>{result}</div>
            <div className="ai-actions">
              <button type="button" className="btn btn-dark" onClick={copy}>{copied ? "Copied ✓" : "Copy"}</button>
              {onInsert && (
                <button type="button" className="btn btn-primary" onClick={() => onInsert(result)}>Use this text</button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small "✨ AI" button that sits next to a form field and inserts the result.
export function AiFieldButton({ onInsert, seedPrompt, label }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ai-mini" onClick={() => setOpen(true)} title="Write with AI">✨ AI</button>
      <AiAssistModal
        open={open}
        onClose={() => setOpen(false)}
        title={label || "Write with AI"}
        seedPrompt={seedPrompt}
        onInsert={(t) => { onInsert(t); setOpen(false); }}
      />
    </>
  );
}

// Floating bottom-right AI helper for every admin page (copy-only mode).
export function AiFloatHelper() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="ai-float" onClick={() => setOpen(true)} aria-label="AI writing helper" title="AI writing helper">
        ✨
      </button>
      <AiAssistModal open={open} onClose={() => setOpen(false)} title="AI writing helper" />
    </>
  );
}
