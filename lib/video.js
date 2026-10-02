export function youTubeId(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function ytThumb(url) {
  const id = youTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

export function ytEmbed(url) {
  const id = youTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

// First-frame JPG poster for a Cloudinary-hosted mp4 (so_0 transformation).
// Returns null for non-Cloudinary URLs. Mobile browsers do not preload
// <video> frames, so without this the card thumbnail renders black.
export function cloudinaryPoster(url, w = 640) {
  const m = String(url || "").match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/video\/upload\/(.+)$/i);
  if (!m) return null;
  let rest = m[2].replace(/\.[a-z0-9]+$/i, ""); // strip extension
  if (!rest || rest.includes("/upload/")) return null;
  return `https://res.cloudinary.com/${m[1]}/video/upload/so_0,w_${w}/${rest}.jpg`;
}
