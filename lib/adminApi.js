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

export async function uploadFile(file) {
  const t = await token();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", headers: { Authorization: `Bearer ${t}` }, body: form });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.media;
}
