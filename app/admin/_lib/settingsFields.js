// Shared settings field components for the admin settings pages.
// Kept at module level (never inside a page component) so input identity is
// stable across renders — defining them inside would remount every input on
// each keystroke, losing focus and closing the native colour picker.

export const THEME_DEFAULTS = {
  theme_primary: "#B9553A",
  theme_deep: "#8F3F2D",
  theme_gold: "#C9A15A",
  theme_footer: "#2A1B16",
};

export const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(String(v || "").trim());

export function TextField({ k, s, set, label, hint, mono }) {
  return (
    <div className="field"><label>{label}</label>
      <input
        value={s[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        spellCheck={false}
        style={mono ? { fontFamily: "ui-monospace, monospace" } : undefined}
      />
      {hint && <div className="seo-hint">{hint}</div>}
    </div>
  );
}

export function PasswordField({ k, s, set, label, hint }) {
  return (
    <div className="field"><label>{label}</label>
      <input
        type="password"
        value={s[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        autoComplete="new-password"
        spellCheck={false}
        style={{ fontFamily: "ui-monospace, monospace" }}
        placeholder="Paste your Gemini API key"
      />
      {hint && <div className="seo-hint">{hint}</div>}
    </div>
  );
}

export function ColorField({ k, s, set, label, hint }) {
  const valid = isHex(s[k]) ? String(s[k]).trim() : THEME_DEFAULTS[k];
  const setHex = (raw) => {
    let h = String(raw || "").trim();
    if (/^[0-9a-fA-F]{6}$/.test(h)) h = "#" + h;
    set(k, h);
  };
  return (
    <div className="field"><label>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          type="color"
          value={valid}
          onChange={(e) => set(k, e.target.value)}
          aria-label={label + " colour picker"}
          style={{ width: 52, height: 42, padding: 4, border: "1.5px solid #ecd9e4", borderRadius: 10, cursor: "pointer", background: "#fff" }}
        />
        <input
          value={s[k] ?? ""}
          onChange={(e) => setHex(e.target.value)}
          placeholder={THEME_DEFAULTS[k]}
          spellCheck={false}
          style={{ maxWidth: 130, fontFamily: "ui-monospace, monospace" }}
          aria-label={label + " hex value"}
        />
      </div>
      {hint && <div className="seo-hint">{hint}</div>}
    </div>
  );
}

// Dynamic address list: label + address + Google Map URL per row, with
// add/remove. Stored as a single `addresses` setting (JSON array).
export function AddressListField({ s, set }) {
  const legacy = [
    { label: "Chittorgarh Office", address: s.address_chittorgarh || "230/4, Main Collectorate Circle, Gandhi Nagar, Chittorgarh 312001, Rajasthan", map_url: "" },
    { label: "Mumbai Office", address: s.address_mumbai || "Mumbai, Maharashtra", map_url: "" },
  ];
  const list = Array.isArray(s.addresses) ? s.addresses : legacy;
  const update = (i, k, v) => set("addresses", list.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  const add = () => set("addresses", [...list, { label: "", address: "", map_url: "" }]);
  const remove = (i) => set("addresses", list.filter((_, j) => j !== i));
  return (
    <div>
      {list.map((a, i) => (
        <div key={i} style={{ border: "1px solid #ecd9e4", borderRadius: 12, padding: 14, marginBottom: 12, background: "#fff" }}>
          <div className="field"><label>Label</label>
            <input value={a.label || ""} onChange={(e) => update(i, "label", e.target.value)} placeholder="e.g. Chittorgarh Office" />
          </div>
          <div className="field"><label>Address</label>
            <textarea rows={2} value={a.address || ""} onChange={(e) => update(i, "address", e.target.value)} placeholder="Full office address" />
          </div>
          <div className="field"><label>Google Map URL</label>
            <input value={a.map_url || ""} onChange={(e) => update(i, "map_url", e.target.value)} placeholder="https://maps.google.com/… (optional)" spellCheck={false} />
            <div className="seo-hint">Paste the Google Maps link for this office. Visitors get a "View on Google Maps" link. Leave empty to auto-search the address.</div>
          </div>
          <button type="button" onClick={() => remove(i)} style={{ background: "none", border: "1px solid #e5b8b0", color: "#b3402e", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600 }}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={add} style={{ background: "#fff", border: "1.5px dashed #C9A15A", color: "#8F3F2D", borderRadius: 10, padding: "10px 18px", cursor: "pointer", fontWeight: 700 }}>+ Add new address</button>
    </div>
  );
}
