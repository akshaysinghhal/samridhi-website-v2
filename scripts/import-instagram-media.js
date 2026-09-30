#!/usr/bin/env node
/**
 * import-instagram-media.js
 *
 * Bulk-imports seed photos/videos that the client drops into a folder:
 *
 *   ~/workspace/seed-media/instagram/   -> source = 'instagram'
 *   ~/workspace/seed-media/facebook/    -> source = 'facebook'
 *   ~/workspace/seed-media/anything-else/ -> source = 'upload'
 *
 * Each file is uploaded to Cloudinary (folder samridhi/seed) and a `media`
 * row is inserted with is_placeholder = true, so every item appears in the
 * admin Media Library flagged for review/replacement.
 *
 * No npm dependencies — Node built-ins only.
 *
 *   node scripts/import-instagram-media.js [seedDir]
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const path = require("path");

const seedDir = process.argv[2] || path.join(process.env.HOME || "/home/hatch", "workspace", "seed-media");

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

const ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.log(`
Missing env vars: ${missing.join(", ")}

MANUAL ALTERNATIVE (no script needed):
  1. In the admin panel go to Gallery & Videos (photos) and upload the files
     directly — they land in Cloudinary and appear in the Media Library.
  2. For Instagram/Facebook-sourced photos, note the source in the item
     caption so the team can re-credit or replace it before launch.

Then set the env vars and re-run:
  node scripts/import-instagram-media.js ${seedDir}
`);
  process.exit(0);
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".mkv"]);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (IMAGE_EXT.has(path.extname(name).toLowerCase()) || VIDEO_EXT.has(path.extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

function cloudinarySign(params, secret) {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret;
  return crypto.createHash("sha1").update(str).digest("hex");
}

function postMultipart(url, fields, filePath, fileField, mime) {
  return new Promise((resolve, reject) => {
    const boundary = "----muse" + crypto.randomBytes(8).toString("hex");
    const chunks = [];
    for (const [k, v] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
    }
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${path.basename(filePath)}"\r\nContent-Type: ${mime}\r\n\r\n`));
    chunks.push(fs.readFileSync(filePath));
    chunks.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const body = Buffer.concat(chunks);
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname, method: "POST", headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 400) reject(new Error(json.error?.message || data));
            else resolve(json);
          } catch (e) { reject(new Error("Bad Cloudinary response: " + data.slice(0, 200))); }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function supabaseInsert(table, row) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(row);
    const u = new URL(process.env.SUPABASE_URL);
    const req = https.request(
      {
        hostname: u.hostname,
        path: `/rest/v1/${table}`,
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => (res.statusCode >= 400 ? reject(new Error(`Supabase ${res.statusCode}: ${data.slice(0, 300)}`)) : resolve(JSON.parse(data))));
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function uploadToCloudinary(filePath, kind) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder: "samridhi/seed", resource_type: kind === "video" ? "video" : "image" };
  const signature = cloudinarySign(params, process.env.CLOUDINARY_API_SECRET);
  const res = await postMultipart(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${kind === "video" ? "video" : "image"}/upload`,
    { ...params, api_key: process.env.CLOUDINARY_API_KEY, signature },
    filePath,
    "file",
    kind === "video" ? "video/mp4" : "image/jpeg"
  );
  return res;
}

(async () => {
  if (!fs.existsSync(seedDir)) fail(`Seed folder not found: ${seedDir}\nCreate it and drop files into subfolders: instagram/, facebook/, ...`);
  const files = walk(seedDir);
  if (!files.length) fail("No image/video files found in " + seedDir);
  console.log(`Found ${files.length} file(s) under ${seedDir}`);

  let done = 0;
  for (const file of files) {
    const rel = path.relative(seedDir, file);
    const topFolder = rel.split(path.sep)[0] || "";
    const source = topFolder === "instagram" ? "instagram" : topFolder === "facebook" ? "facebook" : "upload";
    const kind = VIDEO_EXT.has(path.extname(file).toLowerCase()) ? "video" : "image";
    try {
      const up = await uploadToCloudinary(file, kind);
      await supabaseInsert("media", {
        url: up.secure_url,
        public_id: up.public_id,
        kind,
        alt: path.basename(file, path.extname(file)),
        source,
        is_placeholder: true,
        folder: "samridhi/seed",
      });
      done++;
      console.log(`  ✓ [${source}] ${rel}`);
    } catch (e) {
      console.error(`  ✗ ${rel}: ${e.message}`);
    }
  }
  console.log(`\nDone: ${done}/${files.length} files imported as PLACEHOLDER media.`);
  console.log("Review them at Admin → Media Library / Gallery and untick the placeholder flag once verified.");
})().catch((e) => fail(e.message));
