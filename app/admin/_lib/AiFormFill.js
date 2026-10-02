"use client";
import { useState } from "react";
import { api } from "../../../lib/adminApi";
import { toast } from "./ui";

// AiFormFill — "describe it in words, AI fills the form".
// Place at the top of an add/edit form. The admin types a free-text
// description; Gemini returns JSON for the given fields; onFill merges it
// into the form state. Always asks the user to review before saving.
//
// fields: [{ key, label, type: "text"|"textarea"|"date"|"select"|"number"|"list", options? }]
export function AiFormFill({ title = "Describe it — AI fills the form", hint, fields, onFill, context, instructions, placeholder }) {
  const [open, setOpen] = useState(true);
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!desc.trim()) { toast("Describe it first — a line or two is enough.", "info"); return; }
    setBusy(true);
    try {
      const spec = fields.map((f) => {
        let t = `- ${f.key}: ${f.label}`;
        if (f.type === "date") t += " (date as YYYY-MM-DD)";
        else if (f.type === "select" && f.options) t += ` (choose exactly one of: ${f.options.join(" / ")})`;
        else if (f.type === "list") t += " (JSON array of short strings)";
        else if (f.type === "number") t += " (number only)";
        return t;
      }).join("\n");
      const prompt =
        (instructions
          ? `${instructions}\n\nReturn exactly these JSON keys:\n${spec}\n` +
            `Rules: reply with ONLY a valid JSON object (no code fences, no explanation); ` +
            `use "" for anything not mentioned; keep the response in the same language as the description.`
          : `You are a data-entry assistant for an Indian event company's admin panel. ` +
            `Read the description below and extract the fields. Reply with ONLY a valid JSON object ` +
            `(no code fences, no explanation) with exactly these keys:\n${spec}\n` +
            `Rules: use "" for anything not mentioned; keep text in the same language as the description; ` +
            `never invent facts, names, dates or places not present in the description.`) +
        (context ? `\nContext: ${context}` : "") +
        `\nDescription:\n${desc.trim()}`;
      const r = await api("/api/admin/ai", { method: "POST", body: { prompt, lang: "en" } });
      const raw = String(r.text || "").trim()
        .replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      const obj = JSON.parse(raw);
      const values = {};
      let n = 0;
      for (const f of fields) {
        let v = obj[f.key];
        if (v === undefined || v === null) continue;
        if (f.type === "list" && !Array.isArray(v)) {
          v = String(v).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
        }
        if (f.type === "date" && typeof v === "string") v = v.slice(0, 10);
        if (typeof v === "string") v = v.trim();
        values[f.key] = v;
        if (v !== "" && !(Array.isArray(v) && v.length === 0)) n++;
      }
      onFill(values);
      toast(n ? `AI filled ${n} field${n === 1 ? "" : "s"} — please review before saving.` : "AI could not extract any fields from that description.", n ? "success" : "info");
    } catch (e) {
      const msg = e.message && e.message.includes("no_key") ? "Add your Gemini API key in Integrations & AI first." : (e.message || "try again");
      toast("AI fill failed: " + msg, "error");
    }
    setBusy(false);
  };

  return (
    <div className="ai-fill" style={{ marginBottom: 18 }}>
      <button type="button" className="ai-fill-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>✨ {title}</span>
        <span>{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ai-fill-body">
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder={placeholder || 'e.g. "Dussehra Mela 2026 in Bhilwara for Nagar Palika, on 24 Oct 2026. Cultural programs category. We handled stage, sound and artist management."'}
            aria-label="Describe the entry for AI"
          />
          <div className="ai-fill-row">
            <button type="button" className="btn btn-primary" onClick={run} disabled={busy}>
              {busy ? "Thinking…" : "✨ Fill the form with AI"}
            </button>
            {hint && <span className="seo-hint" style={{ margin: 0 }}>{hint}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
