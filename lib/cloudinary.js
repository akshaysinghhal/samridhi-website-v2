import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function cloud() {
  return cloudinary;
}

// Optimised delivery URL with sensible defaults
export function clUrl(publicId, { w = 1600, q = "auto", f = "auto" } = {}) {
  return cloudinary.url(publicId, {
    width: w,
    quality: q,
    fetch_format: f,
    crop: "limit",
    secure: true,
  });
}
