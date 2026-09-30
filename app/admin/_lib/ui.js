"use client";

// Shared client helpers for admin pages.

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Best-effort on-demand revalidation after a save. The server also revalidates
// in the API route itself; this is a second trigger. Requires
// NEXT_PUBLIC_REVALIDATE_SECRET to match the server's REVALIDATE_SECRET.
export async function revalidateSite(paths = ["/"]) {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_REVALIDATE_SECRET || "dev", paths }),
    });
  } catch { /* ignore */ }
}

export function PhBadge() {
  return <span className="placeholder-badge">Placeholder</span>;
}

export function StatusBadge({ status }) {
  return <span className={`badge ${status === "published" ? "pub" : "draft"}`}>{status || "—"}</span>;
}

// Upload a single file from an <input type=file> change event. Returns the URL or null.
export async function uploadOne(file, setUploading, setMsg) {
  if (!file) return null;
  const { uploadFile } = await import("../../../lib/adminApi");
  try {
    if (setUploading) setUploading(true);
    const m = await uploadFile(file);
    return m.url;
  } catch (err) {
    if (setMsg) setMsg("Upload failed: " + err.message);
    return null;
  } finally {
    if (setUploading) setUploading(false);
  }
}

export const STATUS_OPTIONS = ["draft", "published", "scheduled"];
