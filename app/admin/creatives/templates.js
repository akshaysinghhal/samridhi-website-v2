// Premium 1080×1080 graphic templates for the Creative Studio.
// Each template is a pure function of `d` (the creative's data) and renders a
// fixed 1080×1080 canvas. The studio shows a scaled preview and exports the
// natural-size node to PNG via html2canvas.
//
// All templates share the same soft pastel aesthetic, driven by the PASTELS
// colorways (peach / mint / lavender) chosen in the studio via `pal(d)`:
// light backgrounds, deep-tone type for contrast, palette-accent details and
// soft warm shadows — no heavy black.

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Manrope, system-ui, -apple-system, sans-serif";

// Pastel colorways (chosen in the studio).
const PASTELS = {
  peach:    { bg: "#FDEFE4", deep: "#B9553A", accent: "#C9A15A", text: "#6B3A26", soft: "#F6DCC4" },
  mint:     { bg: "#EAF4EC", deep: "#2F6B4F", accent: "#7FBF96", text: "#274A38", soft: "#CFE8D6" },
  lavender: { bg: "#F0EAF7", deep: "#6B4A8F", accent: "#A98FD4", text: "#46305F", soft: "#DACDEE" },
};
function pal(d) { return PASTELS[d.palette] || PASTELS.peach; }

function Eyebrow({ d, color, style, children }) {
  if (d.showEyebrow === false) return null;
  return <div style={{ color, fontSize: 27, letterSpacing: 6, fontWeight: 700, ...style }}>{(children || d.eyebrow || "").toUpperCase()}</div>;
}

function LogoPill({ src }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 999, padding: "14px 30px",
      display: "inline-flex", alignItems: "center",
      boxShadow: "0 10px 30px rgba(120,70,40,0.16)",
    }}>
      <img src={src || "/images/logo.png"} alt="Samridhi Films & Television" style={{ height: 54, width: "auto", display: "block" }} />
    </div>
  );
}

function PhotoPlaceholder({ d }) {
  const p = pal(d);
  return (
    <div style={{
      width: "100%", height: "100%",
      background: `radial-gradient(circle at 50% 35%, #ffffff 0%, ${p.soft} 55%, ${p.bg} 100%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: p.accent, fontFamily: SERIF, fontSize: 120,
    }}>✦</div>
  );
}

function Pill({ d, children }) {
  const p = pal(d);
  return (
    <span style={{
      border: `2px solid ${p.accent}`, color: p.deep, background: "#ffffff", borderRadius: 999,
      padding: "14px 34px", fontFamily: SANS, fontWeight: 700, fontSize: 30,
      letterSpacing: 1, display: "inline-block", boxShadow: "0 8px 24px rgba(120,70,40,0.10)",
    }}>{children}</span>
  );
}

// ---------- 1. Star Arrival — celebrity / artist announcement ----------
function StarArrival({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: `linear-gradient(165deg, #FFFDF8 0%, ${p.bg} 55%, ${p.soft} 125%)`, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.55, background: `radial-gradient(circle, ${p.soft} 1.5px, transparent 1.6px)`, backgroundSize: "46px 46px" }} />
      <div style={{ position: "absolute", inset: 34, border: `3px solid ${p.accent}`, borderRadius: 6, opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 48, border: `1px solid ${p.accent}`, borderRadius: 4, opacity: 0.5 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "92px 90px 70px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "Samridhi Films & Television Presents"}</Eyebrow>
        <div style={{ width: 440, height: 440, borderRadius: "50%", marginTop: 44, border: "10px solid #ffffff", outline: `2px solid ${p.accent}`, outlineOffset: 10, overflow: "hidden", boxShadow: "0 24px 70px rgba(120,70,40,0.20)" }}>
          {d.photo ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder d={d} />}
        </div>
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 116, fontWeight: 700, lineHeight: 1.05, marginTop: 36 }}>{d.title || "Star Name"}</div>
        <div style={{ color: p.text, fontSize: 36, marginTop: 14, maxWidth: 860, lineHeight: 1.4 }}>{d.subtitle || "Live in concert — one night only"}</div>
        {(d.date || d.venue) && (
          <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
            {d.date && <Pill d={d}>{d.date}</Pill>}
            {d.venue && <Pill d={d}>{d.venue}</Pill>}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

// ---------- 2. Festival Greeting ----------
function FestivalGreeting({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: p.bg, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: `radial-gradient(circle, ${p.soft} 1.5px, transparent 1.6px)`, backgroundSize: "44px 44px" }} />
      <div style={{ position: "absolute", inset: 40, border: `4px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 58, border: `1.5px solid ${p.accent}` }} />
      {[{ l: 40, t: 40 }, { r: 40, t: 40 }, { l: 40, b: 40 }, { r: 40, b: 40 }].map((pos, i) => (
        <div key={i} style={{ position: "absolute", ...pos, width: 56, height: 56, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", color: p.accent, fontSize: 40, fontFamily: SERIF }}>✦</div>
      ))}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "120px 110px 80px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "Warm greetings from"}</Eyebrow>
        {d.photo && (
          <div style={{ width: 300, height: 300, borderRadius: "50%", marginTop: 40, border: "8px solid #ffffff", outline: `2px solid ${p.accent}`, outlineOffset: 8, overflow: "hidden", boxShadow: "0 16px 44px rgba(120,70,40,0.16)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 124, fontWeight: 700, lineHeight: 1.08, marginTop: d.photo ? 34 : 54 }}>{d.title || "Happy Diwali"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 30, color: p.accent }}>
          <div style={{ width: 120, height: 2, background: p.accent }} />
          <div style={{ fontSize: 30 }}>✦</div>
          <div style={{ width: 120, height: 2, background: p.accent }} />
        </div>
        <div style={{ color: p.text, fontSize: 37, marginTop: 30, maxWidth: 800, lineHeight: 1.55 }}>{d.subtitle || "May this festival of lights bring joy, prosperity and unforgettable celebrations to you and your family."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: p.deep, fontSize: 30, fontWeight: 700, marginTop: 26, letterSpacing: 1 }}>
            {[d.date, d.venue].filter(Boolean).join("  •  ")}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

// ---------- 3. Planner Spotlight — includes the event planner's photo ----------
function PlannerSpotlight({ d }) {
  const p = pal(d);
  const img = d.plannerPhoto || d.photo;
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", display: "flex", fontFamily: SANS }}>
      <div style={{ width: 460, height: 1080, position: "relative", overflow: "hidden", borderRight: `3px solid ${p.accent}`, flex: "0 0 auto" }}>
        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder d={d} />}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 60%, ${p.soft} 100%)`, opacity: 0.55 }} />
      </div>
      <div style={{ flex: 1, background: `linear-gradient(150deg, #FFFDF9 0%, ${p.bg} 100%)`, padding: "90px 70px 70px", display: "flex", flexDirection: "column", position: "relative", minWidth: 0 }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: `radial-gradient(circle, ${p.soft} 1.5px, transparent 1.6px)`, backgroundSize: "44px 44px" }} />
        <div style={{ position: "relative" }}>
          {d.showEyebrow !== false && <div style={{ color: p.accent, fontSize: 26, letterSpacing: 5, fontWeight: 800 }}>MEET YOUR EVENT PLANNER</div>}
          <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 700, color: p.deep, lineHeight: 1.1, marginTop: 26 }}>{d.plannerName || "Sunil Jain"}</div>
          <div style={{ width: 90, height: 3, background: p.accent, marginTop: 28 }} />
          <div style={{ fontFamily: SERIF, fontSize: 62, fontWeight: 600, color: p.text, lineHeight: 1.2, marginTop: 34 }}>{d.title || "Your Event Title"}</div>
          <div style={{ color: p.text, fontSize: 33, marginTop: 20, lineHeight: 1.5 }}>{d.subtitle || "Planned to perfection — you just think, we manage it."}</div>
          <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 12 }}>
            {d.date && <div style={{ fontSize: 31, fontWeight: 700, color: p.deep }}>📅 <span style={{ fontWeight: 400 }}>{d.date}</span></div>}
            {d.venue && <div style={{ fontSize: 31, fontWeight: 700, color: p.deep }}>📍 <span style={{ fontWeight: 400 }}>{d.venue}</span></div>}
          </div>
        </div>
        <div style={{ marginTop: "auto", position: "relative" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

// ---------- 4. Royal Minimal — light, airy luxury ----------
function RoyalMinimal({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: `linear-gradient(180deg, #FFFDF9 0%, ${p.bg} 100%)`, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 48, border: `2px solid ${p.accent}`, opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 62, border: `1px solid ${p.accent}`, opacity: 0.4 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 110px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "Samridhi Films & Television"}</Eyebrow>
        {d.photo && (
          <div style={{ width: 340, height: 340, borderRadius: "50%", marginTop: 44, border: "8px solid #ffffff", outline: `2px solid ${p.accent}`, outlineOffset: 8, overflow: "hidden", boxShadow: "0 16px 44px rgba(120,70,40,0.14)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 126, fontWeight: 700, lineHeight: 1.08, marginTop: d.photo ? 40 : 56 }}>{d.title || "An Evening to Remember"}</div>
        <div style={{ width: 110, height: 3, background: p.accent, marginTop: 36 }} />
        <div style={{ color: p.text, fontSize: 37, marginTop: 32, maxWidth: 820, lineHeight: 1.55 }}>{d.subtitle || "Join us for a celebration crafted with passion and precision."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: p.deep, fontSize: 31, marginTop: 30, letterSpacing: 2, fontWeight: 600 }}>
            {[d.date, d.venue].filter(Boolean).join("   ✦   ")}
          </div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {d.showLogo !== false && <LogoPill src={d.logoUrl} />}
      </div>
    </div>
  );
}

// ---------- 5. Mela Blast — bright pastel-festive announcement ----------
const CONFETTI = [
  { x: 90, y: 150, s: 26, c: "#C9A15A" }, { x: 220, y: 90, s: 16, c: "#E8836B" },
  { x: 880, y: 120, s: 22, c: "#7FBF96" }, { x: 970, y: 220, s: 15, c: "#A98FD4" },
  { x: 120, y: 880, s: 20, c: "#E8A0A0" }, { x: 940, y: 860, s: 24, c: "#C9A15A" },
  { x: 700, y: 80, s: 14, c: "#7FBF96" }, { x: 380, y: 1000, s: 18, c: "#E8836B" },
  { x: 540, y: 60, s: 18, c: "#A98FD4" }, { x: 80, y: 540, s: 16, c: "#C9A15A" },
  { x: 1000, y: 560, s: 20, c: "#E8A0A0" }, { x: 620, y: 990, s: 15, c: "#7FBF96" },
];
function MelaBlast({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: `linear-gradient(165deg, #FFF9F1 0%, ${p.bg} 60%, ${p.soft} 135%)`, fontFamily: SANS }}>
      {CONFETTI.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s, borderRadius: "50%", background: c.c, opacity: 0.85 }} />
      ))}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 70px 0", textAlign: "center" }}>
        {d.showLogo !== false && <LogoPill src={d.logoUrl} />}
        <Eyebrow d={d} color={p.deep} style={{ marginTop: 44 }}>{d.eyebrow || "Samridhi Films & Television Presents"}</Eyebrow>
        <div style={{ fontFamily: SANS, fontWeight: 800, color: p.deep, fontSize: 148, lineHeight: 1.02, marginTop: 26, textTransform: "uppercase", letterSpacing: 2, textShadow: "0 6px 26px rgba(255,255,255,0.9)" }}>{d.title || "Dussehra Mela"}</div>
        <div style={{ color: p.text, fontSize: 38, fontWeight: 600, marginTop: 22, maxWidth: 880, lineHeight: 1.45 }}>{d.subtitle || "Rides • Food • Live performances — the biggest festive fair of the season"}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 36, alignItems: "center" }}>
          {d.date && (
            <div style={{ background: p.deep, color: "#fff", borderRadius: "50%", width: 240, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 14px 40px rgba(120,70,40,0.25)" }}>
              <div style={{ fontSize: 26, letterSpacing: 2 }}>SAVE THE</div>
              <div style={{ fontSize: 26, letterSpacing: 2 }}>DATE</div>
              <div style={{ fontSize: 40, marginTop: 8 }}>{d.date}</div>
            </div>
          )}
          {d.venue && <Pill d={d}>{d.venue}</Pill>}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 330, borderTop: `6px solid ${p.accent}`, background: "#ffffff" }}>
        {d.photo ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder d={d} />}
      </div>
    </div>
  );
}

// ---------- 6. Thank You — soft pastel gratitude card ----------
function ThankYouPastel({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: p.bg, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: `radial-gradient(circle, ${p.soft} 1.6px, transparent 1.7px)`, backgroundSize: "46px 46px" }} />
      <div style={{ position: "absolute", inset: 44, border: `4px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 62, border: `1.5px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "130px 110px 80px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "With heartfelt gratitude"}</Eyebrow>
        {d.photo && (
          <div style={{ width: 300, height: 300, borderRadius: "50%", marginTop: 44, border: "8px solid #ffffff", outline: `2px solid ${p.accent}`, outlineOffset: 8, overflow: "hidden", boxShadow: "0 14px 40px rgba(120,70,40,0.12)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 150, fontWeight: 700, lineHeight: 1.05, marginTop: d.photo ? 36 : 70 }}>{d.title || "Thank You"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32, color: p.accent }}>
          <div style={{ width: 130, height: 2, background: p.accent }} />
          <div style={{ fontSize: 30 }}>✦</div>
          <div style={{ width: 130, height: 2, background: p.accent }} />
        </div>
        <div style={{ color: p.text, fontSize: 38, marginTop: 32, maxWidth: 800, lineHeight: 1.6 }}>{d.subtitle || "For trusting us with your celebration — it was an honour to be part of your special day."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: p.deep, fontSize: 30, fontWeight: 700, marginTop: 28, letterSpacing: 1 }}>
            {[d.date, d.venue].filter(Boolean).join("  •  ")}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

// ---------- 7. Happy New Year — soft pastel celebration ----------
const SPARKLES = [
  { x: 90, y: 150, s: 26, c: "#C9A15A" }, { x: 220, y: 90, s: 16, c: "#E8836B" },
  { x: 880, y: 120, s: 22, c: "#7FBF96" }, { x: 970, y: 220, s: 15, c: "#C9A15A" },
  { x: 120, y: 880, s: 20, c: "#A98FD4" }, { x: 940, y: 860, s: 24, c: "#E8836B" },
  { x: 700, y: 80, s: 14, c: "#C9A15A" }, { x: 380, y: 1000, s: 18, c: "#7FBF96" },
];
function NewYearPastel({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: p.bg, fontFamily: SANS }}>
      {SPARKLES.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s, borderRadius: "50%", background: c.c, opacity: 0.8 }} />
      ))}
      <div style={{ position: "absolute", inset: 44, border: `4px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "150px 100px 80px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "Samridhi Films & Television wishes you"}</Eyebrow>
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 148, fontWeight: 700, lineHeight: 1.06, marginTop: 56 }}>{d.title || "Happy New Year"}</div>
        <div style={{ fontFamily: SERIF, color: p.accent, fontSize: 84, fontWeight: 700, marginTop: 8 }}>✦ ✦ ✦</div>
        <div style={{ color: p.text, fontSize: 38, marginTop: 36, maxWidth: 800, lineHeight: 1.6 }}>{d.subtitle || "May the coming year bring you joy, prosperity and many more reasons to celebrate."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: p.deep, fontSize: 30, fontWeight: 700, marginTop: 28, letterSpacing: 1 }}>
            {[d.date, d.venue].filter(Boolean).join("  •  ")}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

// ---------- 8. Pastel Invite — soft event invitation ----------
function PastelInvite({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: p.bg, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: `radial-gradient(circle, ${p.soft} 1.6px, transparent 1.7px)`, backgroundSize: "46px 46px" }} />
      <div style={{ position: "absolute", inset: 44, border: `4px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 62, border: `1.5px solid ${p.accent}` }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "130px 110px 80px", textAlign: "center" }}>
        <Eyebrow d={d} color={p.deep}>{d.eyebrow || "You are cordially invited"}</Eyebrow>
        {d.photo && (
          <div style={{ width: 340, height: 240, borderRadius: 24, marginTop: 40, border: `5px solid #ffffff`, outline: `2px solid ${p.accent}`, outlineOffset: 6, overflow: "hidden", boxShadow: "0 14px 40px rgba(120,70,40,0.12)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 116, fontWeight: 700, lineHeight: 1.1, marginTop: d.photo ? 36 : 60 }}>{d.title || "Event Name"}</div>
        <div style={{ color: p.text, fontSize: 36, marginTop: 28, maxWidth: 800, lineHeight: 1.55 }}>{d.subtitle || "Join us for an unforgettable celebration."}</div>
        {(d.date || d.venue) && (
          <div style={{ display: "flex", gap: 16, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
            {d.date && <span style={{ background: p.deep, color: "#fff", borderRadius: 999, padding: "16px 36px", fontSize: 30, fontWeight: 700, boxShadow: "0 10px 26px rgba(120,70,40,0.20)" }}>{d.date}</span>}
            {d.venue && <span style={{ background: "#fff", color: p.deep, border: `2px solid ${p.deep}`, borderRadius: 999, padding: "14px 36px", fontSize: 30, fontWeight: 700 }}>{d.venue}</span>}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill src={d.logoUrl} />}</div>
      </div>
    </div>
  );
}

export const TEMPLATES = [
  { id: "star", name: "Star Arrival", desc: "Celebrity / artist announcement — soft pastel portrait", render: StarArrival, fields: ["photo", "title", "subtitle"] },
  { id: "greeting", name: "Festival Greeting", desc: "Festive wish in pastel shades — Diwali, Dussehra, New Year", render: FestivalGreeting, fields: ["photo", "title", "subtitle"] },
  { id: "spotlight", name: "Planner Spotlight", desc: "Event planner feature in a light pastel split layout", render: PlannerSpotlight, fields: ["planner", "title", "subtitle"] },
  { id: "royal", name: "Royal Minimal", desc: "Understated luxury — light, airy, centered type", render: RoyalMinimal, fields: ["photo", "title", "subtitle"] },
  { id: "mela", name: "Mela Blast", desc: "Bright pastel-festive poster for melas & public events", render: MelaBlast, fields: ["photo", "title", "subtitle"] },
  { id: "thankyou", name: "Thank You (pastel)", desc: "Soft gratitude card — peach, mint or lavender", render: ThankYouPastel, fields: ["photo", "title", "subtitle"] },
  { id: "newyear", name: "Happy New Year (pastel)", desc: "Soft New Year wish in pastel shades", render: NewYearPastel, fields: ["title", "subtitle"] },
  { id: "invite", name: "Pastel Invite", desc: "Soft elegant invitation card", render: PastelInvite, fields: ["photo", "title", "subtitle"] },
];
