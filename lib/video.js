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
