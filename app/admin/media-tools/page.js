"use client";
import { useEffect, useRef, useState } from "react";
import MediaPicker from "../_lib/MediaPicker";
import { api, uploadFile } from "../../../lib/adminApi";
import { toast, AdminLoader } from "../_lib/ui";

// Media Tools — crop, watermark and basic video editing for the admin.
// Crop: canvas-based, ratio presets incl. Instagram sizes, freeform.
// Watermark: canvas text overlay for images; Cloudinary text-overlay URLs
//   for Cloudinary images AND videos (no re-encoding needed).
// Video Studio: text overlay + trim, exported in-browser as WebM via
//   canvas.captureStream + MediaRecorder, with AI caption suggestions.

const CROP_PRESETS = [
  { id: "free", label: "Freeform", ratio: 0 },
  { id: "1:1", label: "Instagram Post · 1:1", ratio: 1 },
  { id: "4:5", label: "Instagram Portrait · 4:5", ratio: 4 / 5 },
  { id: "9:16", label: "Story / Reel · 9:16", ratio: 9 / 16 },
  { id: "16:9", label: "Wide · 16:9", ratio: 16 / 9 },
  { id: "3:2", label: "Classic · 3:2", ratio: 3 / 2 },
];

function loadImage(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = url;
  });
}

function downloadBlob(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------------- Crop tool ----------------
function CropTool() {
  const [img, setImg] = useState(null);
  const [imgName, setImgName] = useState("");
  const [picker, setPicker] = useState(false);
  const [preset, setPreset] = useState("free");
  const [crop, setCrop] = useState(null); // natural px {x,y,w,h}
  const [fitMode, setFitMode] = useState(false); // false = cut to shape, true = fit whole image with padded background
  const [padColor, setPadColor] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  const ratio = (CROP_PRESETS.find((p) => p.id === preset) || {}).ratio || 0;

  const chooseUrl = async (url, name) => {
    setBusy(true);
    try {
      const im = await loadImage(url);
      setImg(im);
      setImgName(name || "image");
      setCrop(centeredCrop(im.naturalWidth, im.naturalHeight, ratio));
    } catch { toast("Could not load that image.", "error"); }
    setBusy(false);
  };

  const centeredCrop = (W, H, r) => {
    if (!r) return { x: W * 0.1, y: H * 0.1, w: W * 0.8, h: H * 0.8 };
    let w = W, h = W / r;
    if (h > H) { h = H; w = H * r; }
    return { x: (W - w) / 2, y: (H - h) / 2, w, h };
  };

  const onPreset = (id) => {
    setPreset(id);
    const r = (CROP_PRESETS.find((p) => p.id === id) || {}).ratio || 0;
    if (!r) setFitMode(false); // fit needs a fixed target ratio
    if (img) setCrop(centeredCrop(img.naturalWidth, img.naturalHeight, r));
  };

  // --- draw ---
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    const dispW = Math.min(680, img.naturalWidth);
    const s = dispW / img.naturalWidth;
    const dispH = img.naturalHeight * s;
    cv.width = dispW; cv.height = dispH;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, dispW, dispH);
    if (crop) {
      const c = { x: crop.x * s, y: crop.y * s, w: crop.w * s, h: crop.h * s };
      ctx.fillStyle = "rgba(20,8,20,0.55)";
      ctx.fillRect(0, 0, dispW, dispH);
      if (fitMode && ratio) {
        // Fit preview: paint the frame with the pad colour, whole image contained inside.
        ctx.fillStyle = padColor;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        const fs = Math.min(c.w / dispW, c.h / dispH);
        const dw = dispW * fs, dh = dispH * fs;
        ctx.drawImage(img, c.x + (c.w - dw) / 2, c.y + (c.h - dh) / 2, dw, dh);
      } else {
        ctx.clearRect(c.x, c.y, c.w, c.h);
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, c.x, c.y, c.w, c.h);
      }
      ctx.strokeStyle = "#C9A15A"; ctx.lineWidth = 2.5;
      ctx.strokeRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "#C9A15A";
      for (const [hx, hy] of [[c.x, c.y], [c.x + c.w, c.y], [c.x, c.y + c.h], [c.x + c.w, c.y + c.h]]) {
        ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 7); ctx.fill();
      }
    }
    cv.dataset.scale = s;
  }, [img, crop, fitMode, padColor, ratio]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const onDown = (e) => {
    if (!img || !crop) return;
    const s = parseFloat(canvasRef.current.dataset.scale || 1);
    const p = pos(e);
    const c = { x: crop.x * s, y: crop.y * s, w: crop.w * s, h: crop.h * s };
    const corners = [
      ["nw", c.x, c.y], ["ne", c.x + c.w, c.y],
      ["sw", c.x, c.y + c.h], ["se", c.x + c.w, c.y + c.h],
    ];
    for (const [id, hx, hy] of corners) {
      if (Math.hypot(p.x - hx, p.y - hy) < 16) {
        dragRef.current = { mode: "resize", id, start: p, orig: { ...crop } };
        return;
      }
    }
    if (p.x > c.x && p.x < c.x + c.w && p.y > c.y && p.y < c.y + c.h) {
      dragRef.current = { mode: "move", start: p, orig: { ...crop } };
    } else {
      dragRef.current = { mode: "new", start: p, orig: null };
    }
  };

  const onMove = (e) => {
    const dr = dragRef.current;
    if (!dr || !img) return;
    const s = parseFloat(canvasRef.current.dataset.scale || 1);
    const p = pos(e);
    const dx = (p.x - dr.start.x) / s, dy = (p.y - dr.start.y) / s;
    const W = img.naturalWidth, H = img.naturalHeight;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    if (dr.mode === "move") {
      const o = dr.orig;
      setCrop({
        ...o,
        x: clamp(o.x + dx, 0, W - o.w),
        y: clamp(o.y + dy, 0, H - o.h),
      });
    } else if (dr.mode === "new") {
      const x0 = dr.start.x / s, y0 = dr.start.y / s;
      let w = p.x / s - x0, h = p.y / s - y0;
      if (ratio) {
        if (Math.abs(w) / ratio > Math.abs(h)) h = Math.sign(h || 1) * Math.abs(w) / ratio;
        else w = Math.sign(w || 1) * Math.abs(h) * ratio;
      }
      setCrop({
        x: clamp(Math.min(x0, x0 + w), 0, W - 4),
        y: clamp(Math.min(y0, y0 + h), 0, H - 4),
        w: clamp(Math.abs(w), 4, W),
        h: clamp(Math.abs(h), 4, H),
      });
    } else if (dr.mode === "resize") {
      const o = dr.orig;
      let { x, y, w, h } = o;
      if (dr.id.includes("e")) w = o.w + dx;
      if (dr.id.includes("s")) h = o.h + dy;
      if (dr.id.includes("w")) { x = o.x + dx; w = o.w - dx; }
      if (dr.id.includes("n")) { y = o.y + dy; h = o.h - dy; }
      if (ratio) {
        // keep the dominant dimension, recompute the other
        if (dr.id === "se" || dr.id === "nw") { h = w / ratio; if (dr.id === "nw") y = o.y + o.h - h; }
        else { w = h * ratio; if (dr.id.includes("w")) x = o.x + o.w - w; }
      }
      w = clamp(w, 8, W); h = clamp(h, 8, H);
      x = clamp(x, 0, W - w); y = clamp(y, 0, H - h);
      setCrop({ x, y, w, h });
    }
  };

  const exportCrop = async (saveToLibrary) => {
    if (!img || !crop) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      c.width = Math.round(crop.w); c.height = Math.round(crop.h);
      const ctx = c.getContext("2d");
      let suffix;
      if (fitMode && ratio) {
        // Fit: whole image contained in the target frame, padded with the chosen colour.
        ctx.fillStyle = padColor;
        ctx.fillRect(0, 0, c.width, c.height);
        const fs = Math.min(c.width / img.naturalWidth, c.height / img.naturalHeight);
        const dw = img.naturalWidth * fs, dh = img.naturalHeight * fs;
        ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
        suffix = `fit-${preset.replace(":", "x")}`;
      } else {
        ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, c.width, c.height);
        suffix = `crop-${preset.replace(":", "x")}`;
      }
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      const name = `${imgName.replace(/\.[a-z]+$/i, "")}-${suffix}.png`;
      if (saveToLibrary) {
        await uploadFile(new File([blob], name, { type: "image/png" }));
        toast("Cropped image saved to Media Library.");
      } else {
        downloadBlob(blob, name);
        toast("Cropped PNG downloaded.");
      }
    } catch (e) { toast("Export failed: " + e.message, "error"); }
    setBusy(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" className="btn btn-dark" onClick={() => setPicker(true)}>🖼 Choose from library</button>
        <label className="btn btn-dark" style={{ cursor: "pointer" }}>
          ⬆ Upload image
          <input type="file" accept="image/*" hidden onChange={(e) => {
            const fl = e.target.files[0];
            if (fl) chooseUrl(URL.createObjectURL(fl), fl.name);
            e.target.value = "";
          }} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {CROP_PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => onPreset(p.id)}
            className="ai-chip" style={preset === p.id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>
            {p.label}
          </button>
        ))}
      </div>
      {ratio > 0 && (
        <div className="mt-seg" style={{ marginBottom: 14 }}>
          <button type="button" onClick={() => setFitMode(false)} className={"mt-seg-btn" + (!fitMode ? " active" : "")}>
            <b>✂ Crop</b><span>Cut the image to this shape</span>
          </button>
          <button type="button" onClick={() => setFitMode(true)} className={"mt-seg-btn" + (fitMode ? " active" : "")}>
            <b>🖼 Fit — no cut</b><span>Whole image kept, background filled</span>
          </button>
          {fitMode && (
            <label className="mt-padcolor">
              <span>Background colour</span>
              <input type="color" value={padColor} onChange={(e) => setPadColor(e.target.value)} />
              <input value={padColor} onChange={(e) => setPadColor(e.target.value)} spellCheck={false} style={{ width: 84 }} />
            </label>
          )}
        </div>
      )}
      {!img && !busy && <p className="admin-sub">Pick an image to start cropping. Drag inside the box to move it, drag the gold corners to resize.</p>}
      {busy && !img && <AdminLoader />}
      {img && (
        <>
          <canvas
            ref={canvasRef}
            style={{ maxWidth: "100%", borderRadius: 12, cursor: "crosshair", touchAction: "none", boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={() => (dragRef.current = null)} onMouseLeave={() => (dragRef.current = null)}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={() => (dragRef.current = null)}
          />
          <div className="seo-hint" style={{ margin: "8px 0" }}>
            {fitMode && ratio ? "Fit" : "Crop"}: {Math.round(crop?.w || 0)} × {Math.round(crop?.h || 0)} px
            {fitMode && ratio ? " — whole image kept, padded" : ""}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => exportCrop(false)}>⬇ Download {fitMode && ratio ? "fitted" : "cropped"} PNG</button>
            <button type="button" className="btn btn-dark" disabled={busy} onClick={() => exportCrop(true)}>💾 Save to Media Library</button>
          </div>
        </>
      )}
      <MediaPicker open={picker} kind="image" onClose={() => setPicker(false)}
        onSelect={(items) => { const a = Array.isArray(items) ? items : [items]; if (a[0]) chooseUrl(a[0].url, (a[0].public_id || "image").split("/").pop()); setPicker(false); }} />
    </div>
  );
}

// ---------------- Watermark tool ----------------
const WM_SHORTCUTS_KEY = "samridhi-wm-shortcuts";
const WM_DEFAULT_SHORTCUTS = ["© Samridhi Films & Television", "Samridhi Films & Television", "+91 96022 28846"];
const GRAVITIES = [
  ["north_west", "north", "north_east"],
  ["west", "center", "east"],
  ["south_west", "south", "south_east"],
];

function clOverlayUrl(mediaUrl, { text, size, color, opacity, gravity, dx, dy }) {
  const m = String(mediaUrl).match(/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(.+)$/);
  if (!m) return null;
  const [, cloud, kind, rest] = m;
  const noVer = rest.replace(/^v\d+\//, "");
  const ext = (noVer.match(/\.([a-z0-9]+)$/i) || [])[1] || "";
  const pub = noVer.replace(/\.[a-z0-9]+$/i, "");
  const enc = encodeURIComponent(text).replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
  const t = `l_text:Arial_${Math.round(size)}_bold:${enc},co_${color.replace("#", "")},o_${opacity},g_${gravity},x_${Math.round(dx)},y_${Math.round(dy)}`;
  return `https://res.cloudinary.com/${cloud}/${kind}/upload/${t}/${pub}${ext ? "." + ext : ""}`;
}

function WatermarkTool() {
  const [mode, setMode] = useState("image"); // image | cloudinary
  const [img, setImg] = useState(null);
  const [imgUrl, setImgUrl] = useState("");
  const [imgName, setImgName] = useState("");
  const [media, setMedia] = useState(null); // cloudinary asset for overlay mode
  const [picker, setPicker] = useState(null); // image | any
  const [text, setText] = useState("© Samridhi Films & Television");
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(70);
  const [grav, setGrav] = useState("south_east");
  const [shortcuts, setShortcuts] = useState(WM_DEFAULT_SHORTCUTS);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WM_SHORTCUTS_KEY) || "null");
      if (Array.isArray(saved) && saved.length) setShortcuts(saved);
    } catch { /* ignore */ }
  }, []);

  const saveShortcut = () => {
    const t = text.trim();
    if (!t || shortcuts.includes(t)) return;
    const next = [t, ...shortcuts].slice(0, 8);
    setShortcuts(next);
    try { localStorage.setItem(WM_SHORTCUTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    toast("Watermark shortcut saved.");
  };

  const chooseImage = async (url, name) => {
    setBusy(true);
    try {
      const im = await loadImage(url);
      setImg(im); setImgUrl(url); setImgName(name || "image");
    } catch { toast("Could not load that image.", "error"); }
    setBusy(false);
  };

  // draw watermarked image
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img || mode !== "image") return;
    const dispW = Math.min(680, img.naturalWidth);
    const s = dispW / img.naturalWidth;
    cv.width = dispW; cv.height = img.naturalHeight * s;
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    const fs = Math.max(10, size * s);
    ctx.font = `700 ${fs}px Manrope, sans-serif`;
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 6;
    const pad = 24 * s;
    const tw = ctx.measureText(text).width;
    const posMap = {
      north_west: [pad, pad + fs], north: [(cv.width - tw) / 2, pad + fs], north_east: [cv.width - pad - tw, pad + fs],
      west: [pad, cv.height / 2], center: [(cv.width - tw) / 2, cv.height / 2], east: [cv.width - pad - tw, cv.height / 2],
      south_west: [pad, cv.height - pad], south: [(cv.width - tw) / 2, cv.height - pad], south_east: [cv.width - pad - tw, cv.height - pad],
    };
    const [x, y] = posMap[grav] || posMap.south_east;
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }, [img, text, size, color, opacity, grav, mode]);

  const exportWm = async (saveToLibrary) => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    setBusy(true);
    try {
      // re-render at full resolution
      const full = document.createElement("canvas");
      full.width = img.naturalWidth; full.height = img.naturalHeight;
      const ctx = full.getContext("2d");
      ctx.drawImage(img, 0, 0);
      ctx.font = `700 ${size}px Manrope, sans-serif`;
      ctx.globalAlpha = opacity / 100; ctx.fillStyle = color;
      ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 8;
      const pad = Math.round(img.naturalWidth * 0.035);
      const tw = ctx.measureText(text).width;
      const W = full.width, H = full.height;
      const posMap = {
        north_west: [pad, pad + size], north: [(W - tw) / 2, pad + size], north_east: [W - pad - tw, pad + size],
        west: [pad, H / 2], center: [(W - tw) / 2, H / 2], east: [W - pad - tw, H / 2],
        south_west: [pad, H - pad], south: [(W - tw) / 2, H - pad], south_east: [W - pad - tw, H - pad],
      };
      const [x, y] = posMap[grav] || posMap.south_east;
      ctx.fillText(text, x, y);
      const blob = await new Promise((r) => full.toBlob(r, "image/png"));
      const name = `${imgName.replace(/\.[a-z]+$/i, "")}-watermarked.png`;
      if (saveToLibrary) {
        await uploadFile(new File([blob], name, { type: "image/png" }));
        toast("Watermarked image saved to Media Library.");
      } else {
        downloadBlob(blob, name);
        toast("Watermarked PNG downloaded.");
      }
    } catch (e) { toast("Export failed: " + e.message, "error"); }
    setBusy(false);
  };

  const clUrl = media ? clOverlayUrl(media.url, { text, size: Math.min(size * 2, 200), color, opacity, gravity: grav, dx: 20, dy: 20 }) : null;
  const isVideo = media && /video|\.mp4|\.mov|\.webm/i.test(media.url || "") && !/\.(jpe?g|png|gif|webp)$/i.test(media.url || "");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["image", "🖼 Image watermark"], ["cloudinary", "☁ Cloudinary overlay (images + video)"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} className="ai-chip"
            style={mode === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
        ))}
      </div>

      {mode === "image" ? (
        <>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <button type="button" className="btn btn-dark" onClick={() => setPicker("image")}>🖼 Choose from library</button>
            <label className="btn btn-dark" style={{ cursor: "pointer" }}>
              ⬆ Upload image
              <input type="file" accept="image/*" hidden onChange={(e) => {
                const fl = e.target.files[0];
                if (fl) chooseImage(URL.createObjectURL(fl), fl.name);
                e.target.value = "";
              }} />
            </label>
          </div>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-dark" style={{ marginBottom: 14 }} onClick={() => setPicker("any")}>
            {media ? "🔁 Change media" : "🎞 Choose image / video from library"}
          </button>
          {media && <div className="seo-hint" style={{ margin: "-6px 0 14px" }}>Selected: {(media.public_id || "").split("/").pop()} — overlay is applied by Cloudinary, no re-encoding.</div>}
        </>
      )}

      <div className="editor" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Watermark text</label>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="© Samridhi Films & Television" />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {shortcuts.map((sc) => (
            <button key={sc} type="button" className="ai-chip" onClick={() => setText(sc)} title="Use this text">{sc}</button>
          ))}
          <button type="button" className="ai-chip" onClick={saveShortcut} title="Save current text as a shortcut">＋ Save current</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, alignItems: "end" }}>
          <div className="field" style={{ margin: 0 }}>
            <label>Size: {size}px</label>
            <input type="range" min={16} max={160} value={size} onChange={(e) => setSize(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Colour</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 60, height: 38, padding: 2 }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Opacity: {opacity}%</label>
            <input type="range" min={10} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} style={{ width: "100%" }} />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Position</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 30px)", gap: 4 }}>
              {GRAVITIES.flat().map((g) => (
                <button key={g} type="button" onClick={() => setGrav(g)} title={g.replace("_", " ")}
                  style={{ width: 30, height: 30, borderRadius: 6, border: grav === g ? "2px solid #8F3F2D" : "1px solid #ddd", background: grav === g ? "#FDEFE4" : "#fff", cursor: "pointer" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {mode === "image" && (
        <>
          {!img && <p className="admin-sub">Pick an image above, set your watermark text and style, then export.</p>}
          {img && (
            <>
              <canvas ref={canvasRef} style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => exportWm(false)}>⬇ Download watermarked PNG</button>
                <button type="button" className="btn btn-dark" disabled={busy} onClick={() => exportWm(true)}>💾 Save to Media Library</button>
              </div>
            </>
          )}
        </>
      )}

      {mode === "cloudinary" && (
        <>
          {!media && <p className="admin-sub">Choose a Cloudinary image or video — the watermark is applied on delivery, so it works on video too, with zero re-encoding.</p>}
          {media && !clUrl && <div className="login-err">That asset is not a Cloudinary URL — overlays only work on Cloudinary-hosted media.</div>}
          {media && clUrl && (
            <>
              <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", maxWidth: 680 }}>
                {isVideo
                  ? <video src={clUrl} controls style={{ width: "100%", display: "block" }} />
                  : <img src={clUrl} alt="Watermarked preview" style={{ width: "100%", display: "block" }} />}
              </div>
              <div className="seo-hint" style={{ margin: "10px 0", wordBreak: "break-all" }}>{clUrl}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-dark" onClick={() => { navigator.clipboard.writeText(clUrl).then(() => toast("Watermarked URL copied.")); }}>📋 Copy URL</button>
                <a className="btn btn-primary" href={clUrl} target="_blank" rel="noreferrer" download>⬇ Open / download file</a>
              </div>
            </>
          )}
        </>
      )}

      <MediaPicker open={!!picker} kind={picker === "image" ? "image" : undefined} onClose={() => setPicker(null)}
        onSelect={(items) => {
          const a = Array.isArray(items) ? items : [items];
          if (a[0]) {
            if (picker === "image") chooseImage(a[0].url, (a[0].public_id || "image").split("/").pop());
            else setMedia(a[0]);
          }
          setPicker(null);
        }} />
    </div>
  );
}

// ---------------- Video studio ----------------
// Text over video + trim. Preview is live; Export re-renders in the browser
// (canvas + MediaRecorder) and downloads a WebM. AI suggests overlay text.
function VideoTool() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [picker, setPicker] = useState(false);
  const [text, setText] = useState("");
  const [size, setSize] = useState(56);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(90);
  const [grav, setGrav] = useState("south");
  const [startT, setStartT] = useState(0);
  const [endT, setEndT] = useState(0);
  const [dur, setDur] = useState(0);
  const [topic, setTopic] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOptions, setAiOptions] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState("");
  const videoRef = useRef(null);

  const onLoaded = () => {
    const v = videoRef.current;
    if (v && isFinite(v.duration)) { setDur(v.duration); setEndT((e) => (e > 0 ? e : Math.round(v.duration))); }
  };

  const overlayStyle = () => {
    const map = {
      north_west: { top: "6%", left: "5%", textAlign: "left" }, north: { top: "6%", left: "50%", transform: "translateX(-50%)", textAlign: "center" },
      north_east: { top: "6%", right: "5%", textAlign: "right" },
      west: { top: "50%", left: "5%", transform: "translateY(-50%)", textAlign: "left" }, center: { top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" },
      east: { top: "50%", right: "5%", transform: "translateY(-50%)", textAlign: "right" },
      south_west: { bottom: "8%", left: "5%", textAlign: "left" }, south: { bottom: "8%", left: "50%", transform: "translateX(-50%)", textAlign: "center" },
      south_east: { bottom: "8%", right: "5%", textAlign: "right" },
    };
    return {
      position: "absolute", ...(map[grav] || map.south),
      color, opacity: opacity / 100, fontSize: size, fontWeight: 800,
      fontFamily: "Manrope, sans-serif", textShadow: "0 2px 12px rgba(0,0,0,0.7)",
      maxWidth: "86%", pointerEvents: "none", lineHeight: 1.25,
    };
  };

  const aiSuggest = async () => {
    if (!topic.trim()) { toast("Tell the AI what the video is about first.", "info"); return; }
    setAiBusy(true);
    try {
      const r = await api("/api/admin/ai", {
        method: "POST",
        body: { prompt: `Suggest 3 short punchy overlay texts for a video, each under 6 words, one per line, no numbering. The video is about: ${topic.trim()}. Context: Samridhi Films & Television, an event company in Rajasthan.`, lang: "en" },
      });
      const opts = String(r.text || "").split("\n").map((x) => x.replace(/^[\d.\-•\s]+/, "").trim()).filter(Boolean).slice(0, 3);
      setAiOptions(opts);
      if (!opts.length) toast("AI returned nothing — try again.", "info");
    } catch (e) { toast("AI failed: " + e.message, "error"); }
    setAiBusy(false);
  };

  const doExport = async (saveToLibrary) => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const s = Math.max(0, +startT || 0);
    const e = Math.min(dur || 1e9, +endT || 1e9);
    if (e <= s) { toast("End time must be after start time.", "error"); return; }
    setExporting(true); setProgress("Preparing…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 1280; canvas.height = v.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      // video + audio tracks combined
      const vStream = v.captureStream ? v.captureStream() : v.mozCaptureStream();
      const cStream = canvas.captureStream(30);
      (vStream.getAudioTracks() || []).forEach((t) => cStream.addTrack(t));
      const mime = ["video/webm;codecs=vp9", "video/webm"].find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
      const rec = new MediaRecorder(cStream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
      const chunks = [];
      rec.ondataavailable = (ev) => ev.data.size && chunks.push(ev.data);
      const done = new Promise((res) => (rec.onstop = res));

      const drawFrame = () => {
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        if (text.trim()) {
          const fs = Math.round(size * (canvas.width / 640));
          ctx.font = `800 ${fs}px Manrope, sans-serif`;
          ctx.globalAlpha = opacity / 100; ctx.fillStyle = color;
          ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 10;
          ctx.textBaseline = "middle";
          const pad = canvas.width * 0.05;
          const tw = Math.min(ctx.measureText(text).width, canvas.width * 0.86);
          const cx = canvas.width / 2, cy = canvas.height / 2;
          const px = {
            north_west: pad, north: cx - tw / 2, north_east: canvas.width - pad - tw,
            west: pad, center: cx - tw / 2, east: canvas.width - pad - tw,
            south_west: pad, south: cx - tw / 2, south_east: canvas.width - pad - tw,
          }[grav];
          const py = {
            north_west: canvas.height * 0.1, north: canvas.height * 0.1, north_east: canvas.height * 0.1,
            west: cy, center: cy, east: cy,
            south_west: canvas.height * 0.88, south: canvas.height * 0.88, south_east: canvas.height * 0.88,
          }[grav];
          ctx.fillText(text, px, py, canvas.width * 0.86);
          ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        }
      };

      await new Promise((res) => {
        const go = () => { v.currentTime = Math.min(s, (dur || 1) - 0.1); res(); };
        if (v.readyState >= 1) go(); else v.addEventListener("loadedmetadata", go, { once: true });
      });
      await new Promise((res) => {
        if (Math.abs(v.currentTime - s) < 0.05 && v.readyState >= 2) res();
        else v.addEventListener("seeked", res, { once: true });
      });
      rec.start(250);
      await v.play();
      await new Promise((res) => {
        const tick = () => {
          drawFrame();
          setProgress(`Rendering… ${Math.max(0, v.currentTime - s).toFixed(1)}s / ${(e - s).toFixed(1)}s`);
          if (v.currentTime >= e || v.ended) res();
          else requestAnimationFrame(tick);
        };
        tick();
      });
      v.pause();
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: "video/webm" });
      const name = `${(videoName || "video").replace(/\.[a-z0-9]+$/i, "")}${text ? "-text" : ""}-edited.webm`;
      if (saveToLibrary) {
        await uploadFile(new File([blob], name, { type: "video/webm" }));
        toast("Edited video saved to Media Library.");
      } else {
        downloadBlob(blob, name);
        toast("Edited video downloaded (WebM).");
      }
    } catch (err) { toast("Export failed: " + (err.message || err), "error"); }
    setExporting(false); setProgress("");
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" className="btn btn-dark" onClick={() => setPicker(true)}>🎞 Choose video from library</button>
        <label className="btn btn-dark" style={{ cursor: "pointer" }}>
          ⬆ Upload video
          <input type="file" accept="video/*" hidden onChange={(e) => {
            const fl = e.target.files[0];
            if (fl) { setVideoUrl(URL.createObjectURL(fl)); setVideoName(fl.name); setEndT(0); setDur(0); }
            e.target.value = "";
          }} />
        </label>
      </div>
      {!videoUrl && <p className="admin-sub">Pick a video — add overlay text, trim the length, then export. The edited file downloads as WebM.</p>}
      {videoUrl && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(320px, 420px)", gap: 22, alignItems: "start" }} className="vt-grid">
          <div>
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
              <video ref={videoRef} src={videoUrl} controls crossOrigin="anonymous" playsInline
                onLoadedMetadata={onLoaded} style={{ width: "100%", display: "block", maxHeight: 480 }} />
              {text.trim() && <div style={overlayStyle()}>{text}</div>}
            </div>
            <div className="seo-hint" style={{ marginTop: 8 }}>
              {dur ? `Duration: ${dur.toFixed(1)}s — exporting ${Math.max(0, (+startT || 0)).toFixed(1)}s → ${(+endT || dur).toFixed(1)}s` : "Loading video…"}
              {progress && <b> · {progress}</b>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" className="btn btn-primary" disabled={exporting} onClick={() => doExport(false)}>
                {exporting ? "Rendering…" : "⬇ Export video (WebM)"}
              </button>
              <button type="button" className="btn btn-dark" disabled={exporting} onClick={() => doExport(true)}>💾 Save to Media Library</button>
            </div>
          </div>
          <div className="editor" style={{ margin: 0 }}>
            <div className="field">
              <label>Text over video</label>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Dussehra Mela 2026 — Bhilwara" />
            </div>
            <div className="field">
              <label>✨ AI caption — what is the video about?</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. celebrity sangeet night in Udaipur" style={{ flex: 1 }} />
                <button type="button" className="btn-sm btn-edit" disabled={aiBusy} onClick={aiSuggest}>{aiBusy ? "…" : "Suggest"}</button>
              </div>
              {aiOptions.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  {aiOptions.map((o) => (
                    <button key={o} type="button" className="ai-chip" onClick={() => setText(o)}>{o}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field" style={{ margin: 0 }}><label>Size: {size}px</label>
                <input type="range" min={20} max={120} value={size} onChange={(e) => setSize(+e.target.value)} style={{ width: "100%" }} /></div>
              <div className="field" style={{ margin: 0 }}><label>Opacity: {opacity}%</label>
                <input type="range" min={20} max={100} value={opacity} onChange={(e) => setOpacity(+e.target.value)} style={{ width: "100%" }} /></div>
              <div className="field" style={{ margin: 0 }}><label>Colour</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 60, height: 38, padding: 2 }} /></div>
              <div className="field" style={{ margin: 0 }}><label>Position</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 30px)", gap: 4 }}>
                  {GRAVITIES.flat().map((g) => (
                    <button key={g} type="button" onClick={() => setGrav(g)} title={g.replace("_", " ")}
                      style={{ width: 30, height: 30, borderRadius: 6, border: grav === g ? "2px solid #8F3F2D" : "1px solid #ddd", background: grav === g ? "#FDEFE4" : "#fff", cursor: "pointer" }} />
                  ))}
                </div></div>
              <div className="field" style={{ margin: 0 }}><label>Trim start (sec)</label>
                <input type="number" min={0} step={0.5} value={startT} onChange={(e) => setStartT(e.target.value)} /></div>
              <div className="field" style={{ margin: 0 }}><label>Trim end (sec)</label>
                <input type="number" min={0} step={0.5} value={endT} onChange={(e) => setEndT(e.target.value)} placeholder={dur ? dur.toFixed(0) : ""} /></div>
            </div>
          </div>
        </div>
      )}
      <MediaPicker open={picker} kind="video" onClose={() => setPicker(false)}
        onSelect={(items) => {
          const a = Array.isArray(items) ? items : [items];
          if (a[0]) { setVideoUrl(a[0].url); setVideoName((a[0].public_id || "video").split("/").pop()); setEndT(0); setDur(0); }
          setPicker(false);
        }} />
      <style>{`@media (max-width: 900px) { .vt-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

// ---------------- page ----------------
const TABS = [
  ["crop", "✂", "Crop & resize", "Cut or fit photos to Instagram-ready sizes"],
  ["watermark", "💧", "Watermark", "Stamp your brand on images & video"],
  ["video", "🎬", "Video studio", "Text overlays, trim & WebM export"],
];

export default function MediaToolsAdmin() {
  const [tab, setTab] = useState("crop");
  return (
    <>
      <h1>Media Tools</h1>
      <p className="admin-sub">Crop photos for Instagram, stamp watermarks on images &amp; video, and do basic video edits — all right here.</p>
      <div className="mt-tabs">
        {TABS.map(([id, icon, title, desc]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={"mt-tab" + (tab === id ? " active" : "")} aria-pressed={tab === id}>
            <span className="mt-tab-icon" aria-hidden="true">{icon}</span>
            <span className="mt-tab-title">{title}</span>
            <span className="mt-tab-desc">{desc}</span>
          </button>
        ))}
      </div>
      {tab === "crop" && <CropTool />}
      {tab === "watermark" && <WatermarkTool />}
      {tab === "video" && <VideoTool />}
    </>
  );
}
