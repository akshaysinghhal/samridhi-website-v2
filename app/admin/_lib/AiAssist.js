"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/adminApi";

// Shared AI writing helper for the admin panel. Everything goes through the
// server-side /api/admin/ai proxy (Gemini key stays server-side).

// Removes markdown formatting for copy-paste into WhatsApp / social / fields.
export function stripMarkdown(t) {
  return String(t || "")
    .replace(/^#{1,6}\s+/gm, "")            // ## headings
    .replace(/\*\*(.+?)\*\*/g, "$1")        // **bold**
    .replace(/__(.+?)__/g, "$1")            // __bold__
    .replace(/(^|[\s(])\*(.+?)\*/g, "$1$2") // *italics*
    .replace(/(^|[\s(])_(.+?)_/g, "$1$2")   // _italics_
    .replace(/`(.+?)`/g, "$1")              // `code`
    .replace(/^\s*[-*+]\s+/gm, "")          // - bullets
    .replace(/^\s*\d+[.)]\s+/gm, "")        // 1. numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [links](url)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function AiAssistModal({ open, onClose, onInsert, seedPrompt, title, seedTick, quickActions, historyEnabled, plainDefault }) {
  const [prompt, setPrompt] = useState("");
  const [lang, setLang] = useState("en");
  const [plain, setPlain] = useState(plainDefault !== false); // plain text, no markdown
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPrompt(seedPrompt || "");
      setResult("");
      setErr("");
      setCopied(false);
      if (historyEnabled) setHistory(loadAiHistory());
      document.body.style.overflow = "hidden";
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKey);
      };
    }
  }, [open, seedPrompt, seedTick, onClose]);

  if (!open) return null;

  const generate = async () => {
    const p = prompt.trim();
    if (!p || busy) return;
    setBusy(true); setErr(""); setResult(""); setCopied(false);
    try {
      const r = await api("/api/admin/ai", { method: "POST", body: { prompt: p, lang, plain } });
      setResult(r.text || "");
      if (historyEnabled && r.text) saveAiHistory(p, r.text);
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
          <button type="button" className={plain ? "on" : ""} onClick={() => setPlain((v) => !v)} title="Plain text without markdown like **bold**">📝 Plain text</button>
        </div>
        <label className="ai-label">What should the AI write?</label>
        {quickActions && quickActions.length > 0 && (
          <div className="ai-chips">
            {quickActions.map((q) => (
              <button key={q.label} type="button" className="ai-chip" onClick={() => setPrompt(q.seed())}>
                {q.label}
              </button>
            ))}
          </div>
        )}
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
              <button type="button" className="btn btn-dark" onClick={() => setResult(stripMarkdown(result))} title="Remove **bold**, ## headings and bullets">🧹 Plain text</button>
              {onInsert && (
                <button type="button" className="btn btn-primary" onClick={() => onInsert(result)}>Use this text</button>
              )}
            </div>
          </>
        )}
        {historyEnabled && !result && history.length > 0 && (
          <>
            <label className="ai-label" style={{ marginTop: 16 }}>Recent generations</label>
            <div className="ai-history">
              {history.map((h, i) => (
                <button
                  key={h.at + "-" + i}
                  type="button"
                  className="ai-history-item"
                  onClick={() => { setPrompt(h.prompt); setResult(h.result); }}
                  title="Reuse this generation"
                >
                  <span className="ai-history-prompt">{h.prompt}</span>
                  <span className="ai-history-snippet">{h.result.slice(0, 90)}{h.result.length > 90 ? "…" : ""}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small "✨ AI" button that sits next to a form field and inserts the result.
export function AiFieldButton({ onInsert, seedPrompt, label, plainDefault }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="ai-mini" onClick={() => setOpen(true)} title="Write with AI">✨ AI</button>
      <AiAssistModal
        open={open}
        onClose={() => setOpen(false)}
        title={label || "Write with AI"}
        seedPrompt={seedPrompt}
        plainDefault={plainDefault}
        onInsert={(t) => { onInsert(t); setOpen(false); }}
      />
    </>
  );
}

// Floating bottom-right AI helper for every admin page (copy-only mode).
// ---------- floating helper (improved) ----------
// Quick-action chips prefill a tailored prompt; recent generations are
// kept in localStorage so the admin can reuse or copy them later.
const AI_QUICK_ACTIONS = [
  { label: "📣 Event announcement", seed: (page) => `Write a punchy event announcement for our event company's social media. Mention the event name, date and city — I will fill the details after. Keep it under 60 words.` },
  { label: "📸 Instagram caption", seed: () => `Write a warm Instagram caption for an event photo from a wedding/event we managed. Under 40 words, with 5 relevant hashtags.` },
  { label: "💬 WhatsApp broadcast", seed: () => `Write a short WhatsApp broadcast message announcing our event management services for the upcoming festive season. Friendly, under 50 words.` },
  { label: "🙏 Thank-you note", seed: () => `Write a warm thank-you note from our event company to a client after their event. Two or three lines, grateful and professional.` },
  { label: "🎉 Festival wish", seed: () => `Write a festive greeting message from Samridhi Films & Television for an upcoming Indian festival. Warm, one or two lines.` },
];

const AI_HISTORY_KEY = "samridhi-ai-history";
function loadAiHistory() {
  try { return JSON.parse(localStorage.getItem(AI_HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveAiHistory(prompt, result) {
  try {
    const h = loadAiHistory();
    h.unshift({ prompt: prompt.slice(0, 120), result: result.slice(0, 2000), at: Date.now() });
    localStorage.setItem(AI_HISTORY_KEY, JSON.stringify(h.slice(0, 10)));
  } catch { /* ignore */ }
}

export function AiFloatHelper() {
  const [open, setOpen] = useState(false);
  const [quickSeed, setQuickSeed] = useState("");
  const [historyTick, setHistoryTick] = useState(0);
  const openWith = (seed) => { setQuickSeed(seed); setHistoryTick((t) => t + 1); setOpen(true); };
  return (
    <>
      <button className="ai-float" onClick={() => openWith("")} aria-label="AI writing helper" title="AI writing helper">
        ✨
      </button>
      <AiAssistModal
        open={open}
        onClose={() => setOpen(false)}
        title="AI writing helper"
        seedPrompt={quickSeed}
        seedTick={historyTick}
        quickActions={AI_QUICK_ACTIONS}
        historyEnabled
      />
    </>
  );
}
