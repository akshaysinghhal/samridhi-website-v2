// Premium 1080×1080 graphic templates for the Creative Studio.
// Each template is a pure function of `d` (the creative's data) and renders a
// fixed 1080×1080 canvas. The studio shows a scaled preview and exports the
// natural-size node to PNG via html2canvas.

const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "Manrope, system-ui, -apple-system, sans-serif";
const GOLD = "#C9A15A";
const GOLD_SOFT = "#e8cf9a";
const IVORY = "#F7F2E8";
const DEEP = "#8F3F2D";
const BROWN = "#3d2317";

// Pastel colorways for the soft templates (chosen in the studio).
const PASTELS = {
  peach:    { bg: "#FDEFE4", deep: "#B9553A", accent: "#C9A15A", text: "#6B3A26", soft: "#F6DCC4" },
  mint:     { bg: "#EAF4EC", deep: "#2F6B4F", accent: "#7FBF96", text: "#274A38", soft: "#CFE8D6" },
  lavender: { bg: "#F0EAF7", deep: "#6B4A8F", accent: "#A98FD4", text: "#46305F", soft: "#DACDEE" },
};
function pal(d) { return PASTELS[d.palette] || PASTELS.peach; }
function Eyebrow({ d, color, children }) {
  if (d.showEyebrow === false) return null;
  return <div style={{ color, fontSize: 27, letterSpacing: 6, fontWeight: 700 }}>{(children || d.eyebrow || "").toUpperCase()}</div>;
}

function LogoPill({ dark }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 999, padding: "14px 30px",
      display: "inline-flex", alignItems: "center",
      boxShadow: dark ? "0 6px 24px rgba(0,0,0,0.25)" : "0 6px 24px rgba(93,44,30,0.18)",
    }}>
      <img src="/images/logo.png" alt="Samridhi Films & Television" style={{ height: 54, width: "auto", display: "block" }} />
    </div>
  );
}

function PhotoPlaceholder({ label }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: `radial-gradient(circle at 50% 35%, #c98a5e 0%, ${DEEP} 70%)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(255,255,255,0.75)", fontFamily: SERIF, fontSize: 120,
    }}>✦</div>
  );
}

function Pill({ children }) {
  return (
    <span style={{
      border: `2px solid ${GOLD}`, color: GOLD_SOFT, borderRadius: 999,
      padding: "14px 34px", fontFamily: SANS, fontWeight: 700, fontSize: 30,
      letterSpacing: 1, display: "inline-block",
    }}>{children}</span>
  );
}

// ---------- 1. Star Arrival — celebrity / artist announcement ----------
function StarArrival({ d }) {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: "radial-gradient(circle at 50% 30%, #8a3a24 0%, #4a1a10 75%)", fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 34, border: `3px solid ${GOLD}`, borderRadius: 6, opacity: 0.9 }} />
      <div style={{ position: "absolute", inset: 46, border: `1px solid ${GOLD}`, borderRadius: 4, opacity: 0.55 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "92px 90px 70px", textAlign: "center" }}>
        {d.showEyebrow !== false && <div style={{ color: GOLD, fontSize: 27, letterSpacing: 6, fontWeight: 700 }}>{(d.eyebrow || "SAMRIDHI FILMS & TELEVISION PRESENTS").toUpperCase()}</div>}
        <div style={{ width: 470, height: 470, borderRadius: "50%", marginTop: 44, border: `8px solid ${GOLD}`, overflow: "hidden", boxShadow: "0 20px 70px rgba(0,0,0,0.45)", background: "#2a100a" }}>
          {d.photo ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder />}
        </div>
        <div style={{ fontFamily: SERIF, color: IVORY, fontSize: 118, fontWeight: 700, lineHeight: 1.05, marginTop: 36 }}>{d.title || "Star Name"}</div>
        <div style={{ color: GOLD_SOFT, fontSize: 36, marginTop: 14, maxWidth: 860, lineHeight: 1.4 }}>{d.subtitle || "Live in concert — one night only"}</div>
        {(d.date || d.venue) && (
          <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
            {d.date && <Pill>{d.date}</Pill>}
            {d.venue && <Pill>{d.venue}</Pill>}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill dark />}</div>
      </div>
    </div>
  );
}

// ---------- 2. Festival Greeting ----------
function FestivalGreeting({ d }) {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: IVORY, fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.5, background: "radial-gradient(circle, #e9d9b8 1.5px, transparent 1.6px)", backgroundSize: "44px 44px" }} />
      <div style={{ position: "absolute", inset: 40, border: `4px solid ${GOLD}` }} />
      <div style={{ position: "absolute", inset: 58, border: `1.5px solid ${GOLD}` }} />
      {[{ l: 40, t: 40 }, { r: 40, t: 40 }, { l: 40, b: 40 }, { r: 40, b: 40 }].map((p, i) => (
        <div key={i} style={{ position: "absolute", ...p, width: 56, height: 56, background: IVORY, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 40, fontFamily: SERIF }}>✦</div>
      ))}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "120px 110px 80px", textAlign: "center" }}>
        {d.showEyebrow !== false && <div style={{ color: DEEP, fontSize: 28, letterSpacing: 7, fontWeight: 800 }}>{(d.eyebrow || "WARM GREETINGS FROM").toUpperCase()}</div>}
        {d.photo && (
          <div style={{ width: 300, height: 300, borderRadius: "50%", marginTop: 40, border: `6px solid ${GOLD}`, overflow: "hidden", boxShadow: "0 14px 44px rgba(93,44,30,0.25)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: DEEP, fontSize: 124, fontWeight: 700, lineHeight: 1.08, marginTop: d.photo ? 34 : 54 }}>{d.title || "Happy Diwali"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 30, color: GOLD }}>
          <div style={{ width: 120, height: 2, background: GOLD }} />
          <div style={{ fontSize: 30 }}>✦</div>
          <div style={{ width: 120, height: 2, background: GOLD }} />
        </div>
        <div style={{ color: BROWN, fontSize: 37, marginTop: 30, maxWidth: 800, lineHeight: 1.55 }}>{d.subtitle || "May this festival of lights bring joy, prosperity and unforgettable celebrations to you and your family."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: DEEP, fontSize: 30, fontWeight: 700, marginTop: 26, letterSpacing: 1 }}>
            {[d.date, d.venue].filter(Boolean).join("  •  ")}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill />}</div>
      </div>
    </div>
  );
}

// ---------- 3. Planner Spotlight — includes the event planner's photo ----------
function PlannerSpotlight({ d }) {
  const img = d.plannerPhoto || d.photo;
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", display: "flex", fontFamily: SANS }}>
      <div style={{ width: 460, height: 1080, background: "#2a100a", position: "relative", overflow: "hidden" }}>
        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(42,16,10,0.55) 100%)" }} />
      </div>
      <div style={{ flex: 1, background: `linear-gradient(150deg, ${DEEP} 0%, #5c2317 100%)`, padding: "90px 70px 70px", display: "flex", flexDirection: "column", color: IVORY }}>
        <div style={{ color: GOLD, fontSize: 26, letterSpacing: 5, fontWeight: 800 }}>MEET YOUR EVENT PLANNER</div>
        <div style={{ fontFamily: SERIF, fontSize: 92, fontWeight: 700, lineHeight: 1.1, marginTop: 26 }}>{d.plannerName || "Sunil Jain"}</div>
        <div style={{ width: 90, height: 3, background: GOLD, marginTop: 28 }} />
        <div style={{ fontFamily: SERIF, fontSize: 64, fontWeight: 600, lineHeight: 1.2, marginTop: 34 }}>{d.title || "Your Event Title"}</div>
        <div style={{ color: GOLD_SOFT, fontSize: 33, marginTop: 20, lineHeight: 1.5 }}>{d.subtitle || "Planned to perfection — you just think, we manage it."}</div>
        <div style={{ marginTop: 34, display: "flex", flexDirection: "column", gap: 12 }}>
          {d.date && <div style={{ fontSize: 31, fontWeight: 700 }}>📅 <span style={{ fontWeight: 400 }}>{d.date}</span></div>}
          {d.venue && <div style={{ fontSize: 31, fontWeight: 700 }}>📍 <span style={{ fontWeight: 400 }}>{d.venue}</span></div>}
        </div>
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill dark />}</div>
      </div>
    </div>
  );
}

// ---------- 4. Royal Minimal ----------
function RoyalMinimal({ d }) {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: "#211309", fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 48, border: `2px solid ${GOLD}`, opacity: 0.85 }} />
      <div style={{ position: "absolute", inset: 62, border: `1px solid ${GOLD}`, opacity: 0.4 }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 110px", textAlign: "center" }}>
        {d.showEyebrow !== false && <div style={{ color: GOLD, fontSize: 27, letterSpacing: 7, fontWeight: 700 }}>{(d.eyebrow || "SAMRIDHI FILMS & TELEVISION").toUpperCase()}</div>}
        {d.photo && (
          <div style={{ width: 340, height: 340, borderRadius: "50%", marginTop: 44, border: `4px solid ${GOLD}`, overflow: "hidden" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: IVORY, fontSize: 128, fontWeight: 700, lineHeight: 1.08, marginTop: d.photo ? 40 : 56 }}>{d.title || "An Evening to Remember"}</div>
        <div style={{ width: 110, height: 3, background: GOLD, marginTop: 36 }} />
        <div style={{ color: GOLD_SOFT, fontSize: 37, marginTop: 32, maxWidth: 820, lineHeight: 1.55 }}>{d.subtitle || "Join us for a celebration crafted with passion and precision."}</div>
        {(d.date || d.venue) && (
          <div style={{ color: IVORY, fontSize: 31, marginTop: 30, letterSpacing: 2, opacity: 0.92 }}>
            {[d.date, d.venue].filter(Boolean).join("   ✦   ")}
          </div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        {d.showLogo !== false && <LogoPill dark />}
      </div>
    </div>
  );
}

// ---------- 5. Mela Blast — loud, festive announcement ----------
function MelaBlast({ d }) {
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: "linear-gradient(165deg, #c05a35 0%, #8F3F2D 55%, #57200f 100%)", fontFamily: SANS }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.16, background: "radial-gradient(circle, #ffe9b0 2px, transparent 2.4px)", backgroundSize: "52px 52px" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 70px 0", textAlign: "center" }}>
        {d.showLogo !== false && <LogoPill dark />}
        {d.showEyebrow !== false && <div style={{ color: GOLD_SOFT, fontSize: 30, letterSpacing: 8, fontWeight: 800, marginTop: 44 }}>{(d.eyebrow || "SAMRIDHI FILMS & TELEVISION PRESENTS").toUpperCase()}</div>}
        <div style={{ fontFamily: SANS, fontWeight: 800, color: "#fff", fontSize: 148, lineHeight: 1.02, marginTop: 26, textTransform: "uppercase", textShadow: "0 8px 30px rgba(0,0,0,0.35)", letterSpacing: 2 }}>{d.title || "Dussehra Mela"}</div>
        <div style={{ color: "#ffe9c4", fontSize: 38, fontWeight: 600, marginTop: 22, maxWidth: 880, lineHeight: 1.45 }}>{d.subtitle || "Rides • Food • Live performances — the biggest festive fair of the season"}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 36, alignItems: "center" }}>
          {d.date && (
            <div style={{ background: GOLD, color: "#3d1c10", borderRadius: "50%", width: 240, height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800, boxShadow: "0 14px 44px rgba(0,0,0,0.35)" }}>
              <div style={{ fontSize: 26, letterSpacing: 2 }}>SAVE THE</div>
              <div style={{ fontSize: 26, letterSpacing: 2 }}>DATE</div>
              <div style={{ fontSize: 40, marginTop: 8 }}>{d.date}</div>
            </div>
          )}
          {d.venue && <Pill>{d.venue}</Pill>}
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 330, borderTop: `6px solid ${GOLD}`, background: "#2a100a" }}>
        {d.photo ? <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <PhotoPlaceholder />}
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
          <div style={{ width: 300, height: 300, borderRadius: "50%", marginTop: 44, border: `6px solid ${p.accent}`, overflow: "hidden", boxShadow: "0 14px 44px rgba(0,0,0,0.12)" }}>
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
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill />}</div>
      </div>
    </div>
  );
}

// ---------- 7. Happy New Year — soft pastel celebration ----------
const CONFETTI = [
  { x: 90, y: 150, s: 26, c: "#C9A15A" }, { x: 220, y: 90, s: 16, c: "#B9553A" },
  { x: 880, y: 120, s: 22, c: "#7FBF96" }, { x: 970, y: 220, s: 15, c: "#C9A15A" },
  { x: 120, y: 880, s: 20, c: "#A98FD4" }, { x: 940, y: 860, s: 24, c: "#B9553A" },
  { x: 700, y: 80, s: 14, c: "#C9A15A" }, { x: 380, y: 1000, s: 18, c: "#7FBF96" },
];
function NewYearPastel({ d }) {
  const p = pal(d);
  return (
    <div style={{ width: 1080, height: 1080, position: "relative", overflow: "hidden", background: p.bg, fontFamily: SANS }}>
      {CONFETTI.map((c, i) => (
        <div key={i} style={{ position: "absolute", left: c.x, top: c.y, width: c.s, height: c.s, borderRadius: "50%", background: c.c, opacity: 0.75 }} />
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
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill />}</div>
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
          <div style={{ width: 340, height: 240, borderRadius: 24, marginTop: 40, border: `5px solid ${p.accent}`, overflow: "hidden", boxShadow: "0 14px 44px rgba(0,0,0,0.12)" }}>
            <img src={d.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
        <div style={{ fontFamily: SERIF, color: p.deep, fontSize: 116, fontWeight: 700, lineHeight: 1.1, marginTop: d.photo ? 36 : 60 }}>{d.title || "Event Name"}</div>
        <div style={{ color: p.text, fontSize: 36, marginTop: 28, maxWidth: 800, lineHeight: 1.55 }}>{d.subtitle || "Join us for an unforgettable celebration."}</div>
        {(d.date || d.venue) && (
          <div style={{ display: "flex", gap: 16, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
            {d.date && <span style={{ background: p.deep, color: "#fff", borderRadius: 999, padding: "16px 36px", fontSize: 30, fontWeight: 700 }}>{d.date}</span>}
            {d.venue && <span style={{ background: "#fff", color: p.deep, border: `2px solid ${p.deep}`, borderRadius: 999, padding: "14px 36px", fontSize: 30, fontWeight: 700 }}>{d.venue}</span>}
          </div>
        )}
        <div style={{ marginTop: "auto" }}>{d.showLogo !== false && <LogoPill />}</div>
      </div>
    </div>
  );
}

export const TEMPLATES = [
  { id: "star", name: "Star Arrival", desc: "Celebrity / artist announcement with a grand portrait", render: StarArrival, fields: ["photo", "title", "subtitle"] },
  { id: "greeting", name: "Festival Greeting", desc: "Elegant festive wish — Diwali, Dussehra, New Year", render: FestivalGreeting, fields: ["photo", "title", "subtitle"] },
  { id: "spotlight", name: "Planner Spotlight", desc: "Feature the event planner's photo beside the event", render: PlannerSpotlight, fields: ["planner", "title", "subtitle"] },
  { id: "royal", name: "Royal Minimal", desc: "Understated luxury — dark gold, centered type", render: RoyalMinimal, fields: ["photo", "title", "subtitle"] },
  { id: "mela", name: "Mela Blast", desc: "Loud festive poster for melas & public events", render: MelaBlast, fields: ["photo", "title", "subtitle"] },
  { id: "thankyou", name: "Thank You (pastel)", desc: "Soft gratitude card — peach, mint or lavender", render: ThankYouPastel, fields: ["photo", "title", "subtitle"], pastel: true },
  { id: "newyear", name: "Happy New Year (pastel)", desc: "Soft New Year wish in pastel shades", render: NewYearPastel, fields: ["title", "subtitle"], pastel: true },
  { id: "invite", name: "Pastel Invite", desc: "Soft elegant invitation card", render: PastelInvite, fields: ["photo", "title", "subtitle"], pastel: true },
];
