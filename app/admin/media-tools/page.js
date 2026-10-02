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
  const [padMode, setPadMode] = useState("blur"); // blur | color — what fills the frame around the fitted photo
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
        // Fit preview: blurred-photo or solid-colour frame, whole image contained inside.
        ctx.save();
        ctx.translate(c.x, c.y);
        paintFitBg(ctx, c.w, c.h);
        const fs = Math.min(c.w / dispW, c.h / dispH);
        const dw = dispW * fs, dh = dispH * fs;
        ctx.drawImage(img, (c.w - dw) / 2, (c.h - dh) / 2, dw, dh);
        ctx.restore();
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
  }, [img, crop, fitMode, padColor, padMode, ratio]);

  // Paint the Fit-mode frame background: either the solid pad colour, or a
  // blurred cover-scaled copy of the photo (tiny downscale → upscale = smooth
  // blur on every browser, no canvas-filter needed), darkened a touch so the
  // sharp fitted photo pops.
  const paintFitBg = (ctx, W, H) => {
    if (padMode === "blur" && img) {
      const tw = 48, th = Math.max(1, Math.round((48 * H) / W));
      const tiny = document.createElement("canvas");
      tiny.width = tw; tiny.height = th;
      const tctx = tiny.getContext("2d");
      const cover = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
      const sw = tw / cover, sh = th / cover;
      tctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, 0, 0, tw, th);
      ctx.save();
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
      ctx.drawImage(tiny, 0, 0, W, H);
      ctx.fillStyle = "rgba(20,12,10,0.28)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    } else {
      ctx.fillStyle = padColor;
      ctx.fillRect(0, 0, W, H);
    }
  };

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
        // Fit: whole image contained in the target frame, blurred-photo or solid-colour background.
        paintFitBg(ctx, c.width, c.height);
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
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: "1 1 100%" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[["blur", "🌀 Blurred photo"], ["color", "🎨 Solid colour"]].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setPadMode(id)} className="ai-chip"
                    style={padMode === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
                ))}
              </div>
              {padMode === "color" && (
                <label className="mt-padcolor">
                  <span>Background colour</span>
                  <input type="color" value={padColor} onChange={(e) => setPadColor(e.target.value)} />
                  <input value={padColor} onChange={(e) => setPadColor(e.target.value)} spellCheck={false} style={{ width: 84 }} />
                </label>
              )}
            </div>
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
const SITE_LOGO = "/images/logo.png";

function clParse(mediaUrl) {
  const m = String(mediaUrl).match(/res\.cloudinary\.com\/([^/]+)\/(image|video)\/upload\/(.+)$/);
  if (!m) return null;
  const [, cloud, kind, rest] = m;
  const noVer = rest.replace(/^v\d+\//, "");
  const ext = (noVer.match(/\.([a-z0-9]+)$/i) || [])[1] || "";
  const pub = noVer.replace(/\.[a-z0-9]+$/i, "");
  return { cloud, kind, pub, ext };
}

// Center-based overlays: g_center anchors the overlay by its middle, so x_/y_
// shift it by fractions of the base image (fl_relative). Verified live on
// Cloudinary's demo cloud for both text and logo overlays.
function clTextOverlayT({ text, size, color, opacity, pos, bold, italic }) {
  const enc = encodeURIComponent(text).replace(/!/g, "%21").replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\*/g, "%2A");
  const style = [bold ? "bold" : "", italic ? "italic" : ""].filter(Boolean).join("_");
  const fontSpec = style ? `Arial_${Math.round(size)}_${style}` : `Arial_${Math.round(size)}`;
  const dx = (pos.x - 0.5).toFixed(3);
  const dy = (pos.y - 0.5).toFixed(3);
  return `l_text:${fontSpec}:${enc},fl_relative,g_center,x_${dx},y_${dy},co_rgb:${color.replace("#", "")},o_${opacity}`;
}

function clLogoOverlayT({ logoUrl, widthPct, opacity, pos }) {
  const logoPub = clPublicId(logoUrl);
  if (!logoPub) return null;
  const w = Math.min(0.9, Math.max(0.05, widthPct / 100));
  const dx = (pos.x - 0.5).toFixed(3);
  const dy = (pos.y - 0.5).toFixed(3);
  return `l_${logoPub},fl_relative,w_${w.toFixed(2)},g_center,x_${dx},y_${dy},o_${opacity}`;
}

function clPublicId(url) {
  const m = String(url).match(/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.+)$/);
  if (!m) return null;
  return m[1].replace(/^v\d+\//, "").replace(/\.[a-z0-9]+$/i, "");
}

function WatermarkTool() {
  const [mode, setMode] = useState("image"); // image | cloudinary
  // Two independent watermark layers that can be used together.
  const [textOn, setTextOn] = useState(true);
  const [logoOn, setLogoOn] = useState(false);
  const [img, setImg] = useState(null);
  const [imgUrl, setImgUrl] = useState("");
  const [imgName, setImgName] = useState("");
  const [media, setMedia] = useState(null); // cloudinary asset for overlay mode
  const [loadErr, setLoadErr] = useState(false); // preview failed to load from Cloudinary
  const [picker, setPicker] = useState(null); // image | any | logo
  // text styling
  const [text, setText] = useState("© Samridhi Films & Television");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [shadow, setShadow] = useState(true);
  const [outline, setOutline] = useState(false);
  // logo watermark
  const [logoUrl, setLogoUrl] = useState(SITE_LOGO);
  const [logoImg, setLogoImg] = useState(null);
  const [logoSize, setLogoSize] = useState(18); // % of image width
  const [logoOpacity, setLogoOpacity] = useState(90);
  // shared
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(70);
  // Position = center of the watermark as a fraction (0..1) of the image.
  // Grid mode (default): pick a cell in the 5×5 grid. Drag mode (opt-in):
  // drag the watermark directly on the preview.
  const [posMode, setPosMode] = useState("grid"); // grid | drag
  const [pos, setPos] = useState({ x: 0.5, y: 0.9 }); // text layer
  const [logoPos, setLogoPos] = useState({ x: 0.85, y: 0.15 }); // logo layer
  const [dragLayer, setDragLayer] = useState("text"); // which layer the position tools move
  // The layer the position controls act on: the selected one when both are on.
  const activeLayer = textOn && logoOn ? dragLayer : textOn ? "text" : "logo";
  const setLayerPos = (c) => { if (activeLayer === "logo") setLogoPos(c); else setPos(c); };
  const layerPos = activeLayer === "logo" ? logoPos : pos;
  const [layout, setLayout] = useState("single"); // single | tiled (image mode)
  const [mediaW, setMediaW] = useState(0); // picked cloudinary asset dims
  const [mediaH, setMediaH] = useState(0);
  const [shortcuts, setShortcuts] = useState(WM_DEFAULT_SHORTCUTS);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef(null);
  const cloudWrapRef = useRef(null);
  const dragRef = useRef(null); // active preview drag {layer, dx, dy, moved}
  const wmRects = useRef({ text: null, logo: null }); // drawn rects in preview pixels, for hit-testing
  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WM_SHORTCUTS_KEY) || "null");
      if (Array.isArray(saved) && saved.length) setShortcuts(saved);
    } catch { /* ignore */ }
  }, []);

  // Load the logo image for canvas drawing (site logo or a custom one).
  useEffect(() => {
    if (!logoUrl) { setLogoImg(null); return; }
    let live = true;
    loadImage(logoUrl).then((im) => { if (live) setLogoImg(im); }).catch(() => { if (live) setLogoImg(null); });
    return () => { live = false; };
  }, [logoUrl]);

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

  // Draw the watermark layers (text and/or logo) onto ctx for a W×H image
  // that is already drawn. Shared by the live preview and the full-res export.
  // Each layer's position is the watermark CENTER as a fraction (0..1) of the
  // image — set by dragging the watermark on the preview. layout "tiled"
  // repeats the layer diagonally across the image (position then doesn't apply).
  // Drawn rects are recorded for drag hit-testing.
  const drawWm = (ctx, W, H) => {
    if (!img) return;
    const k = W / img.naturalWidth;
    const pad = Math.max(6, Math.round(W * 0.035));
    const rects = { text: null, logo: null };

    const paintText = (x, y, fs, tw) => {
      if (outline) {
        ctx.lineWidth = Math.max(1, fs * 0.07);
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.strokeText(text, x, y);
      }
      ctx.fillText(text, x, y);
      if (underline) {
        ctx.save();
        ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
        ctx.lineWidth = Math.max(1, fs * 0.06);
        ctx.strokeStyle = color;
        const uy = y + fs * 0.14;
        ctx.beginPath(); ctx.moveTo(x, uy); ctx.lineTo(x + tw, uy); ctx.stroke();
        ctx.restore();
      }
    };

    if (textOn && text.trim()) {
      ctx.save();
      ctx.globalAlpha = opacity / 100;
      const fs = Math.max(8, size * k);
      ctx.font = `${italic ? "italic " : ""}${bold ? "700" : "400"} ${fs}px Manrope, sans-serif`;
      ctx.fillStyle = color;
      if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = Math.max(2, 6 * k); }
      const tw = ctx.measureText(text).width;
      if (layout === "tiled") {
        ctx.save();
        ctx.translate(W / 2, H / 2); ctx.rotate(-0.35); ctx.translate(-W / 2, -H / 2);
        for (let yy = -H; yy < H * 2; yy += fs * 3.2) {
          for (let xx = -W; xx < W * 2; xx += tw * 1.35) {
            paintText(xx, yy, fs, tw);
          }
        }
        ctx.restore();
      } else {
        // center-based: the baseline sits ~0.35*fs below the visual center
        const x = Math.max(pad, Math.min(W - tw - pad, pos.x * W - tw / 2));
        const y = Math.max(pad + fs * 0.8, Math.min(H - pad, pos.y * H + fs * 0.35));
        paintText(x, y, fs, tw);
        rects.text = { x, y: y - fs * 0.8, w: tw, h: fs };
      }
      ctx.restore();
    }

    if (logoOn && logoImg) {
      ctx.save();
      ctx.globalAlpha = logoOpacity / 100;
      const lw = W * (logoSize / 100);
      const lh = lw * (logoImg.naturalHeight / logoImg.naturalWidth);
      if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = Math.max(2, 8 * k); }
      if (layout === "tiled") {
        ctx.save();
        ctx.translate(W / 2, H / 2); ctx.rotate(-0.35); ctx.translate(-W / 2, -H / 2);
        for (let yy = -H; yy < H * 2; yy += lh * 2.6) {
          for (let xx = -W; xx < W * 2; xx += lw * 1.7) {
            ctx.drawImage(logoImg, xx, yy, lw, lh);
          }
        }
        ctx.restore();
      } else {
        const x = Math.max(pad, Math.min(W - lw - pad, logoPos.x * W - lw / 2));
        const y = Math.max(pad, Math.min(H - lh - pad, logoPos.y * H - lh / 2));
        ctx.drawImage(logoImg, x, y, lw, lh);
        rects.logo = { x, y, w: lw, h: lh };
      }
      ctx.restore();
    }
    wmRects.current = rects;
  };

  // --- Drag the watermark directly on the image-mode preview ---
  const wmPoint = (e) => {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: ((t.clientX - r.left) / r.width) * cv.width,
      y: ((t.clientY - r.top) / r.height) * cv.height,
    };
  };
  const inRect = (p, rc) => rc && p.x >= rc.x - 8 && p.x <= rc.x + rc.w + 8 && p.y >= rc.y - 8 && p.y <= rc.y + rc.h + 8;
  const onWmDown = (e) => {
    if (!img || layout === "tiled" || posMode !== "drag") return;
    const p = wmPoint(e);
    const rects = wmRects.current;
    // Grab whichever enabled layer is under the finger (logo draws on top);
    // a tap on empty space moves the currently selected layer there.
    let layer = null;
    if (logoOn && inRect(p, rects.logo)) layer = "logo";
    else if (textOn && inRect(p, rects.text)) layer = "text";
    else layer = dragLayer;
    if ((layer === "text" && !textOn) || (layer === "logo" && !logoOn)) {
      layer = textOn ? "text" : logoOn ? "logo" : null;
    }
    if (!layer) return;
    const rc = rects[layer];
    dragRef.current = {
      layer,
      dx: rc ? p.x - (rc.x + rc.w / 2) : 0,
      dy: rc ? p.y - (rc.y + rc.h / 2) : 0,
      sx: p.x, sy: p.y, moved: false,
    };
    setDragLayer(layer);
  };
  const onWmMove = (e) => {
    const d = dragRef.current;
    if (!d || d.cloud) return;
    const cv = canvasRef.current;
    const p = wmPoint(e);
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) < 6) return; // tap threshold
    d.moved = true;
    if (e.cancelable) e.preventDefault();
    const c = { x: clamp01((p.x - d.dx) / cv.width), y: clamp01((p.y - d.dy) / cv.height) };
    if (d.layer === "logo") setLogoPos(c); else setPos(c);
  };
  const onWmUp = () => { dragRef.current = null; };

  // --- Drag on the Cloudinary preview (image or video) ---
  // Center-based: the pointer fraction IS the new watermark center.
  const onCloudDown = (e) => {
    if (!media || !clUrl || posMode !== "drag") return;
    let layer = dragLayer;
    if ((layer === "text" && !textOn) || (layer === "logo" && !logoOn)) {
      layer = textOn ? "text" : logoOn ? "logo" : null;
    }
    if (!layer) return;
    const r = cloudWrapRef.current.getBoundingClientRect();
    dragRef.current = {
      layer, cloud: true, sx: e.clientX, sy: e.clientY, moved: false,
      left: r.left, top: r.top, width: r.width, height: r.height,
    };
    setDragLayer(layer);
  };
  const onCloudMove = (e) => {
    const d = dragRef.current;
    if (!d || !d.cloud) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return; // tap threshold — keeps video controls usable
    d.moved = true;
    if (e.cancelable) e.preventDefault();
    const c = { x: clamp01((e.clientX - d.left) / d.width), y: clamp01((e.clientY - d.top) / d.height) };
    if (d.layer === "logo") setLogoPos(c); else setPos(c);
  };

  // live preview
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img || mode !== "image") return;
    const dispW = Math.min(680, img.naturalWidth);
    cv.width = dispW; cv.height = Math.round(img.naturalHeight * (dispW / img.naturalWidth));
    const ctx = cv.getContext("2d");
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    drawWm(ctx, cv.width, cv.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img, mode, textOn, logoOn, text, size, color, opacity, pos, logoPos, logoOpacity, layout, bold, italic, underline, shadow, outline, logoImg, logoSize]);

  const renderFullWm = async () => {
    if (!img) return null;
    const full = document.createElement("canvas");
    full.width = img.naturalWidth; full.height = img.naturalHeight;
    const ctx = full.getContext("2d");
    ctx.drawImage(img, 0, 0);
    drawWm(ctx, full.width, full.height);
    return new Promise((r) => full.toBlob(r, "image/png"));
  };

  const wmFileName = () => `${(imgName || "image").replace(/\.[a-z]+$/i, "")}-watermarked.png`;

  const exportWm = async (saveToLibrary) => {
    const blob = await renderFullWm();
    if (!blob) return null;
    setBusy(true);
    try {
      const name = wmFileName();
      if (saveToLibrary) {
        await uploadFile(new File([blob], name, { type: "image/png" }));
        toast("Watermarked image saved to Media Library.");
      } else {
        downloadBlob(blob, name);
        toast("Watermarked PNG downloaded.");
      }
    } catch (e) { toast("Export failed: " + e.message, "error"); }
    setBusy(false);
    return null;
  };

  const shareWhatsApp = async () => {
    if (mode === "cloudinary") {
      if (clUrl) window.open(`https://wa.me/?text=${encodeURIComponent(clUrl)}`, "_blank");
      return;
    }
    setBusy(true);
    try {
      const blob = await renderFullWm();
      if (!blob) { setBusy(false); return; }
      const file = new File([blob], wmFileName(), { type: "image/png" });
      // Mobile: native share sheet with the image file (WhatsApp appears there).
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Watermarked image" }); } catch (e) { /* dismissed */ }
        setBusy(false);
        return;
      }
      // Desktop fallback: save to the Media Library, then share its link.
      toast("Uploading to Media Library for sharing…");
      const m = await uploadFile(file);
      window.open(`https://wa.me/?text=${encodeURIComponent(m.url)}`, "_blank");
    } catch (e) { toast("Share failed: " + e.message, "error"); }
    setBusy(false);
  };

  const uploadLogo = async (e) => {
    const fl = e.target.files[0];
    e.target.value = "";
    if (!fl) return;
    setBusy(true);
    try {
      const m = await uploadFile(fl);
      setLogoUrl(m.url);
      toast("Logo uploaded — now hosted on Cloudinary, works for video too.");
    } catch (err) { toast("Logo upload failed: " + err.message, "error"); }
    setBusy(false);
  };

  // Cloudinary overlay URL — text and logo layers are combined into one
  // transformation chain, so both watermarks can be applied at the same time.
  const clParts = media ? clParse(media.url) : null;
  const clOverlays = [];
  if (clParts) {
    if (textOn && text.trim()) {
      clOverlays.push(clTextOverlayT({ text, size: Math.min(size * 2, 200), color, opacity, pos, bold, italic }));
    }
    if (logoOn) {
      const lt = clLogoOverlayT({ logoUrl, widthPct: logoSize, opacity: logoOpacity, pos: logoPos });
      if (lt) clOverlays.push(lt);
    }
  }
  const clUrl = clParts && clOverlays.length
    ? `https://res.cloudinary.com/${clParts.cloud}/${clParts.kind}/upload/${clOverlays.join("/")}/${clParts.pub}${clParts.ext ? "." + clParts.ext : ""}`
    : null;
  const logoOnCloudinary = !!clPublicId(logoUrl);
  const isVideo = media && /video|\.mp4|\.mov|\.webm/i.test(media.url || "") && !/\.(jpe?g|png|gif|webp)$/i.test(media.url || "");

  useEffect(() => { setLoadErr(false); }, [clUrl]);

  const styleBtn = (active, label, title, onClick, extraStyle) => (
    <button type="button" onClick={onClick} title={title} className="ai-chip"
      style={active
        ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff", fontWeight: 800, ...(extraStyle || {}) }
        : { fontWeight: 800, ...(extraStyle || {}) }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[["image", "🖼 Image watermark"], ["cloudinary", "☁ Cloudinary overlay (images + video)"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} className="ai-chip"
            style={mode === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          ["text", "📝 Text watermark", textOn, () => setTextOn((v) => !v)],
          ["logo", "🖼 Logo watermark", logoOn, () => setLogoOn((v) => !v)],
        ].map(([id, label, on, toggle]) => (
          <button key={id} type="button" onClick={toggle} className="ai-chip" title={on ? "Switch off" : "Switch on"}
            style={on ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}{on ? " ✓" : ""}</button>
        ))}
        <span className="seo-hint" style={{ alignSelf: "center" }}>Both can be on together.</span>
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
        {!textOn && !logoOn && (
          <p className="admin-sub" style={{ margin: 0 }}>Switch on the text or logo watermark above to begin — both can be used together.</p>
        )}
        {textOn && (
          <>
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
            <div className="field">
              <label>Text style</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {styleBtn(bold, "B", "Bold", () => setBold((b) => !b))}
                {styleBtn(italic, "I", "Italic", () => setItalic((v) => !v), { fontStyle: "italic" })}
                {styleBtn(underline, "U", "Underline", () => setUnderline((v) => !v), { textDecoration: "underline" })}
                {styleBtn(shadow, "Shadow", "Drop shadow", () => setShadow((v) => !v), { textShadow: "2px 2px 3px rgba(0,0,0,0.5)" })}
                {styleBtn(outline, "Outline", "Dark outline around letters", () => setOutline((v) => !v), { WebkitTextStroke: "1px #8F3F2D" })}
              </div>
              {mode === "cloudinary" && (
                <span className="seo-hint">Underline, shadow &amp; outline render in Image watermark mode — the Cloudinary overlay supports bold &amp; italic.</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, alignItems: "end", marginBottom: 4 }}>
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
            </div>
          </>
        )}
        {logoOn && (
          <>
            <div className="field">
              <label>Logo</label>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                {logoImg && (
                  <img src={logoUrl} alt="Watermark logo" style={{ height: 44, background: "#fff", borderRadius: 8, padding: 4, border: "1px solid #ddd" }} />
                )}
                <button type="button" className="ai-chip" onClick={() => setLogoUrl(SITE_LOGO)} title="Use the website logo">Use site logo</button>
                <button type="button" className="ai-chip" onClick={() => setPicker("logo")}>🖼 Choose from library</button>
                <label className="ai-chip" style={{ cursor: "pointer" }}>
                  ⬆ Upload logo
                  <input type="file" accept="image/*" hidden onChange={uploadLogo} />
                </label>
              </div>
              {mode === "cloudinary" && !logoOnCloudinary && (
                <span className="seo-hint">The site logo isn&apos;t on Cloudinary — choose a logo from the library or upload one to watermark videos / cloud images.</span>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, alignItems: "end", marginBottom: 4 }}>
              <div className="field" style={{ margin: 0, maxWidth: 320 }}>
                <label>Logo size: {logoSize}% of image width</label>
                <input type="range" min={5} max={60} value={logoSize} onChange={(e) => setLogoSize(+e.target.value)} style={{ width: "100%" }} />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Logo opacity: {logoOpacity}%</label>
                <input type="range" min={10} max={100} value={logoOpacity} onChange={(e) => setLogoOpacity(+e.target.value)} style={{ width: "100%" }} />
              </div>
            </div>
          </>
        )}
        {mode === "image" && (textOn || logoOn) && (
          <div className="field" style={{ margin: "12px 0 0" }}>
            <label>Layout</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[["single", "Single"], ["tiled", "Tiled repeat"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setLayout(id)} className="ai-chip"
                  style={layout === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
              ))}
            </div>
            {layout === "tiled" && (
              <span className="seo-hint">Tiled repeats the watermark diagonally across the photo — position is set by the layout.</span>
            )}
          </div>
        )}
        {!(mode === "image" && layout === "tiled") && (textOn || logoOn) && (
          <div className="field" style={{ margin: "12px 0 0" }}>
            <label>Position{activeLayer === "logo" ? " — logo" : textOn && logoOn ? " — text" : ""}</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
              {[["grid", "⊞ Grid"], ["drag", "✋ Drag"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setPosMode(id)} className="ai-chip"
                  title={id === "drag" ? "Drag the watermark directly on the preview" : "Pick a position from the grid"}
                  style={posMode === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
              ))}
              {textOn && logoOn && (
                <>
                  <span className="seo-hint" style={{ margin: 0 }}>Moving:</span>
                  {[["text", "Text"], ["logo", "Logo"]].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setDragLayer(id)} className="ai-chip"
                      style={dragLayer === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
                  ))}
                </>
              )}
            </div>
            {posMode === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 32px)", gap: 6 }}>
                {[0, 1, 2, 3, 4].map((cy) => [0, 1, 2, 3, 4].map((cx) => {
                  const fx = (cx + 0.5) / 5, fy = (cy + 0.5) / 5;
                  const active = Math.abs(layerPos.x - fx) < 0.11 && Math.abs(layerPos.y - fy) < 0.11;
                  return (
                    <button key={`${cx}-${cy}`} type="button" onClick={() => setLayerPos({ x: fx, y: fy })}
                      title={activeLayer === "logo" ? "Move logo here" : "Move text here"}
                      style={{ width: 32, height: 32, borderRadius: 8, border: active ? "2px solid #8F3F2D" : "1px solid #ddd", background: active ? "#FDEFE4" : "#fff", cursor: "pointer" }} />
                  );
                }))}
              </div>
            ) : (
              <span className="seo-hint">Drag the watermark directly on the preview below to place it anywhere.</span>
            )}
          </div>
        )}
      </div>

      {mode === "image" && (
        <>
          {!img && <p className="admin-sub">Pick an image above, set your watermark and style, then export.</p>}
          {img && (textOn || logoOn) && (
            <>
              {layout === "single" && posMode === "drag" && (
                <div className="seo-hint" style={{ margin: "0 0 10px" }}>👆 Drag the watermark on the photo to place it anywhere.</div>
              )}
              <canvas
                ref={canvasRef}
                onPointerDown={posMode === "drag" ? onWmDown : undefined}
                onPointerMove={posMode === "drag" ? onWmMove : undefined}
                onPointerUp={onWmUp}
                onPointerCancel={onWmUp}
                onPointerLeave={onWmUp}
                style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", touchAction: posMode === "drag" ? "none" : "auto", cursor: posMode === "drag" && layout === "single" ? "grab" : "default" }}
              />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => exportWm(false)}>⬇ Download watermarked PNG</button>
                <button type="button" className="btn btn-dark" disabled={busy} onClick={() => exportWm(true)}>💾 Save to Media Library</button>
                <button type="button" className="btn btn-dark" disabled={busy} onClick={shareWhatsApp} style={{ background: "#1fa855", borderColor: "#1fa855" }}>💬 Share on WhatsApp</button>
              </div>
            </>
          )}
        </>
      )}

      {mode === "cloudinary" && (
        <>
          {!media && <p className="admin-sub">Choose a Cloudinary image or video — the watermark is applied on delivery, so it works on video too, with zero re-encoding.</p>}
          {media && !clUrl && (
            <div className="login-err">
              {!clParts
                ? "That asset is not a Cloudinary URL — overlays only work on Cloudinary-hosted media."
                : logoOn && !logoOnCloudinary
                  ? "The current logo isn't hosted on Cloudinary — choose a logo from the library or upload one."
                  : "Switch on the text or logo watermark above to generate the overlay URL."}
            </div>
          )}
          {media && clUrl && (
            <>
              {posMode === "drag" && (
                <div className="seo-hint" style={{ margin: "0 0 10px" }}>👆 Drag on the preview to place the watermark anywhere.</div>
              )}
              <div ref={cloudWrapRef} onPointerDown={posMode === "drag" ? onCloudDown : undefined} onPointerMove={posMode === "drag" ? onCloudMove : undefined} onPointerUp={onWmUp} onPointerCancel={onWmUp}
                style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", maxWidth: 680, touchAction: posMode === "drag" ? (isVideo ? "pan-y" : "none") : "auto", cursor: posMode === "drag" ? "grab" : "default" }}>
                {isVideo
                  ? <video src={clUrl} controls onError={() => setLoadErr(true)} style={{ width: "100%", display: "block" }} />
                  : <img src={clUrl} alt="Watermarked preview" onError={() => setLoadErr(true)} style={{ width: "100%", display: "block", userSelect: "none", WebkitUserDrag: "none" }} draggable={false} />}
              </div>
              {logoOn && !logoOnCloudinary && (
                <div className="seo-hint" style={{ margin: "10px 0" }}>The logo layer is skipped — the current logo isn&apos;t on Cloudinary. Choose a logo from the library or upload one to include it.</div>
              )}
              {loadErr && (
                <div className="login-err" style={{ margin: "10px 0" }}>
                  Couldn&apos;t load the watermarked file from Cloudinary — the original may have been deleted, moved or renamed after appearing in the library.
                  Try choosing it again from the library, or re-upload it.
                </div>
              )}
              <div className="seo-hint" style={{ margin: "10px 0", wordBreak: "break-all" }}>{clUrl}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-dark" onClick={() => { navigator.clipboard.writeText(clUrl).then(() => toast("Watermarked URL copied.")); }}>📋 Copy URL</button>
                <a className="btn btn-primary" href={clUrl} target="_blank" rel="noreferrer" download>⬇ Open / download file</a>
                <button type="button" className="btn btn-dark" onClick={shareWhatsApp} style={{ background: "#1fa855", borderColor: "#1fa855" }}>💬 Share on WhatsApp</button>
              </div>
            </>
          )}
        </>
      )}

      <MediaPicker open={!!picker} kind={picker === "any" ? undefined : "image"} onClose={() => setPicker(null)}
        onSelect={(items) => {
          const a = Array.isArray(items) ? items : [items];
          if (a[0]) {
            if (picker === "image") chooseImage(a[0].url, (a[0].public_id || "image").split("/").pop());
            else if (picker === "logo") setLogoUrl(a[0].url);
            else { setMedia(a[0]); setMediaW(a[0].width || 0); setMediaH(a[0].height || 0); }
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
  const [vpos, setVpos] = useState({ x: 0.5, y: 0.88 }); // text center as fraction of the video
  const [vposMode, setVposMode] = useState("grid"); // grid | drag (drag is opt-in)
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

  // Drag the text overlay directly on the video preview (tap threshold
  // keeps the video controls usable).
  const vtWrapRef = useRef(null);
  const vtDragRef = useRef(null);
  const onVtDown = (e) => {
    if (!videoUrl || vposMode !== "drag") return;
    const r = vtWrapRef.current.getBoundingClientRect();
    vtDragRef.current = { sx: e.clientX, sy: e.clientY, moved: false, left: r.left, top: r.top, width: r.width, height: r.height };
  };
  const onVtMove = (e) => {
    const d = vtDragRef.current;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 8) return;
    d.moved = true;
    if (e.cancelable) e.preventDefault();
    setVpos({
      x: Math.max(0, Math.min(1, (e.clientX - d.left) / d.width)),
      y: Math.max(0, Math.min(1, (e.clientY - d.top) / d.height)),
    });
  };
  const onVtUp = () => { vtDragRef.current = null; };

  const overlayStyle = () => {
    return {
      position: "absolute",
      left: `${vpos.x * 100}%`,
      top: `${vpos.y * 100}%`,
      transform: "translate(-50%, -50%)",
      textAlign: "center",
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
        body: { prompt: `Suggest 3 short punchy overlay texts for a video, each under 6 words, one per line, no numbering. The video is about: ${topic.trim()}. Context: Samridhi Films & Television, an event company in Rajasthan.`, lang: "en", plain: true },
      });
      const opts = String(r.text || "").split("\n").map((x) => x.replace(/^[\d.\-•\s]+/, "").trim()).filter(Boolean).slice(0, 3);
      setAiOptions(opts);
      if (!opts.length) toast("AI returned nothing — try again.", "info");
    } catch (e) { toast("AI failed: " + e.message, "error"); }
    setAiBusy(false);
  };

  const exportLabel = (() => {
    if (typeof window === "undefined" || !window.MediaRecorder) return "⬇ Export video";
    try {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9") || MediaRecorder.isTypeSupported("video/webm")) return "⬇ Export video (WebM)";
      if (MediaRecorder.isTypeSupported("video/mp4")) return "⬇ Export video (MP4)";
    } catch { /* ignore */ }
    return "⬇ Export video";
  })();

  const doExport = async (saveToLibrary) => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const s = Math.max(0, +startT || 0);
    const e = Math.min(dur || 1e9, +endT || 1e9);
    if (e <= s) { toast("End time must be after start time.", "error"); return; }
    setExporting(true); setProgress("Preparing…");
    try {
      // Feature-detect the recording pipeline. The video element's own
      // captureStream (used only for the audio track) is missing on iPhone
      // Safari — but canvas.captureStream + MediaRecorder are usually
      // present, so export the picture without sound rather than refusing.
      const grabVideoStream = v.captureStream ? () => v.captureStream()
        : (v.mozCaptureStream ? () => v.mozCaptureStream() : null);
      const probeCanvas = document.createElement("canvas");
      const canCanvasStream = !!probeCanvas.captureStream;
      const canRecord = !!window.MediaRecorder;
      if (!canCanvasStream || !canRecord) {
        toast("Video export isn't supported in this browser — please export from Chrome on a desktop; your original video is untouched.", "error");
        setExporting(false); setProgress("");
        return;
      }
      const withAudio = !!grabVideoStream;
      if (!withAudio) toast("This browser can't capture audio — exporting the video with your text overlay, without sound.", "info");
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth || 1280; canvas.height = v.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      const cStream = canvas.captureStream(30);
      if (withAudio) {
        try {
          const vStream = grabVideoStream();
          (vStream.getAudioTracks() || []).forEach((t) => cStream.addTrack(t));
        } catch { /* audio is a bonus — never fail the export for it */ }
      }
      const mime = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((m) => { try { return MediaRecorder.isTypeSupported(m); } catch { return false; } }) || "";
      let rec;
      try {
        rec = new MediaRecorder(cStream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
      } catch {
        rec = new MediaRecorder(cStream); // some browsers lie in isTypeSupported — fall back to default
      }
      const actualMime = rec.mimeType || mime || "video/webm";
      const ext = actualMime.includes("mp4") ? "mp4" : "webm";
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
          const tw = Math.min(ctx.measureText(text).width, canvas.width * 0.86);
          const px = vpos.x * canvas.width - tw / 2;
          const py = vpos.y * canvas.height;
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
      // iOS only allows programmatic playback when muted — and on the no-audio
      // path there's no sound to lose anyway.
      const wasMuted = v.muted;
      if (!withAudio) v.muted = true;
      try { await v.play(); }
      catch (playErr) { v.muted = wasMuted; throw playErr; }
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
      v.muted = wasMuted;
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: actualMime });
      const name = `${(videoName || "video").replace(/\.[a-z0-9]+$/i, "")}${text ? "-text" : ""}-edited.${ext}`;
      if (saveToLibrary) {
        await uploadFile(new File([blob], name, { type: actualMime }));
        toast("Edited video saved to Media Library.");
      } else {
        downloadBlob(blob, name);
        toast(`Edited video downloaded (${ext.toUpperCase()}).`);
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
      {!videoUrl && <p className="admin-sub">Pick a video — add overlay text, trim the length, then export.</p>}
      {videoUrl && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(320px, 420px)", gap: 22, alignItems: "start" }} className="vt-grid">
          <div>
            <div ref={vtWrapRef} onPointerDown={vposMode === "drag" ? onVtDown : undefined} onPointerMove={vposMode === "drag" ? onVtMove : undefined} onPointerUp={onVtUp} onPointerCancel={onVtUp}
              style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: "#000", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", touchAction: vposMode === "drag" ? "pan-y" : "auto", cursor: vposMode === "drag" ? "grab" : "default" }}>
              <video ref={videoRef} src={videoUrl} controls crossOrigin="anonymous" playsInline
                onLoadedMetadata={onLoaded} style={{ width: "100%", display: "block", maxHeight: 480 }} />
              {text.trim() && <div style={overlayStyle()}>{text}</div>}
            </div>
            {vposMode === "drag" && (
              <div className="seo-hint" style={{ marginTop: 8 }}>👆 Drag the text on the video to place it anywhere.</div>
            )}
            <div className="seo-hint" style={{ marginTop: 8 }}>
              {dur ? `Duration: ${dur.toFixed(1)}s — exporting ${Math.max(0, (+startT || 0)).toFixed(1)}s → ${(+endT || dur).toFixed(1)}s` : "Loading video…"}
              {progress && <b> · {progress}</b>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" className="btn btn-primary" disabled={exporting} onClick={() => doExport(false)}>
                {exporting ? "Rendering…" : exportLabel}
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
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  {[["grid", "⊞ Grid"], ["drag", "✋ Drag"]].map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setVposMode(id)} className="ai-chip"
                      title={id === "drag" ? "Drag the text directly on the video" : "Pick a position from the grid"}
                      style={vposMode === id ? { borderColor: "#8F3F2D", background: "#8F3F2D", color: "#fff" } : undefined}>{label}</button>
                  ))}
                </div>
                {vposMode === "grid" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 30px)", gap: 5 }}>
                    {[0, 1, 2, 3, 4].map((cy) => [0, 1, 2, 3, 4].map((cx) => {
                      const fx = (cx + 0.5) / 5, fy = (cy + 0.5) / 5;
                      const active = Math.abs(vpos.x - fx) < 0.11 && Math.abs(vpos.y - fy) < 0.11;
                      return (
                        <button key={`${cx}-${cy}`} type="button" onClick={() => setVpos({ x: fx, y: fy })}
                          style={{ width: 30, height: 30, borderRadius: 7, border: active ? "2px solid #8F3F2D" : "1px solid #ddd", background: active ? "#FDEFE4" : "#fff", cursor: "pointer" }} />
                      );
                    }))}
                  </div>
                ) : (
                  <span className="seo-hint" style={{ margin: 0 }}>Drag the text on the video preview to place it anywhere.</span>
                )}
              </div>
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
