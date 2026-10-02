"use client";
import { supabaseBrowser } from "./supabaseClient";

async function token() {
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token;
}

export async function api(path, { method = "GET", body } = {}) {
  const t = await token();
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// Public upload config (cloud name + unsigned preset) — cached per page load.
let uploadCfg = null;
async function uploadConfig() {
  if (uploadCfg) return uploadCfg;
  const res = await fetch("/api/upload-config");
  const json = await res.json().catch(() => ({}));
  if (!json.cloudName || !json.uploadPreset) {
    throw new Error("Upload not configured — set your Cloudinary upload preset in Admin → Integrations → Media uploads.");
  }
  uploadCfg = json;
  return uploadCfg;
}

// Direct browser → Cloudinary unsigned upload with progress.
//
// Why: the old /api/upload route buffered the whole file through the
// serverless function, and Vercel rejects bodies over ~4.5 MB
// (FUNCTION_PAYLOAD_TOO_LARGE) — every real video failed. Uploading straight
// to Cloudinary removes the size cap entirely.
//
// Returns { url, public_id, kind }. onProgress(0..1) fires as bytes upload.
export async function uploadFile(file, onProgress) {
  const cfg = await uploadConfig();
  const isVideo = (file.type || "").startsWith("video");
  const done = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let finished = false;
    let stalled = false;
    let lastActivity = Date.now();
    // A frozen mobile connection can hang forever with no error and no
    // progress — abort if nothing moves for 90s so the user gets an error
    // message instead of silence.
    const stallTimer = setInterval(() => {
      if (!finished && Date.now() - lastActivity > 90000) {
        stalled = true;
        try { xhr.abort(); } catch { /* ignore */ }
      }
    }, 10000);
    const finish = (fn) => { if (!finished) { finished = true; clearInterval(stallTimer); fn(); } };
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cfg.cloudName}/auto/upload`);
    xhr.upload.onprogress = (e) => {
      lastActivity = Date.now();
      if (e.lengthComputable && onProgress) {
        try { onProgress(Math.min(1, e.loaded / e.total)); } catch { /* ignore */ }
      }
    };
    xhr.onload = () => finish(() => {
      let j = {};
      try { j = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && j.secure_url) resolve(j);
      else reject(new Error(j?.error?.message || `Upload failed (${xhr.status})`));
    });
    xhr.onerror = () => finish(() => reject(new Error("Upload failed — check your internet connection and retry.")));
    xhr.onabort = () => finish(() => reject(new Error(stalled
      ? "Upload stalled — no data moved for 90 seconds. Check your connection and retry."
      : "Upload cancelled.")));
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", cfg.uploadPreset);
    // The preset decides the destination folder in your Cloudinary account.
    xhr.send(form);
  });
  // Best-effort catalogue row (alt text). The media library lists from
  // Cloudinary itself, so the upload is usable even if this fails.
  try {
    const t = await token();
    await fetch("/api/admin/media", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ public_id: done.public_id, url: done.secure_url, kind: isVideo ? "video" : "image", alt: file.name || "" }),
    });
  } catch { /* ignore */ }
  return { url: done.secure_url, public_id: done.public_id, kind: isVideo ? "video" : "image" };
}
