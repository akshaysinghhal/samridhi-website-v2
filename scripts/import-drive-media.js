#!/usr/bin/env node
/**
 * Samridhi media bulk import — Drive download -> Cloudinary (unsigned preset) -> SQL file.
 *
 * 1. Uploads the 50 print-media photos to Cloudinary folder samridhi/press
 *    and the 15 celebrity-feedback videos to samridhi/feedback, using an
 *    UNSIGNED upload preset (no API secret needed).
 * 2. Writes a ready-to-run SQL file with INSERTs for the NEW Supabase project:
 *      - press_clippings  (50 rows, status='published')
 *      - gallery_items    (15 video rows, kind='video', category='Highlight Videos')
 *      - artists          (appends the feedback video to the matching artist's videos[] jsonb)
 *
 * Usage:
 *   node scripts/import-drive-media.js --cloud <cloud_name> --preset <unsigned_preset> \
 *        --out /tmp/samridhi-media-import.sql
 *
 * The user runs the generated SQL once in the NEW Supabase project's SQL Editor.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "/home/hatch/workspace/import-work/samridhi-import";

// Find a folder by name anywhere under ROOT (Drive structure may vary).
function findDir(name) {
  const out = [];
  (function walk(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const p = path.join(dir, e.name);
      if (e.name.toLowerCase() === name.toLowerCase()) out.push(p);
      else walk(p);
    }
  })(ROOT);
  return out;
}
// List media files in a dir, tagged with which dir they came from (for dedupe).
function listMedia(dir) {
  try {
    return fs.readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|mp4|mov)$/i.test(f) && !/\.part$/i.test(f))
      .sort().map((f) => ({ dir, file: f, full: path.join(dir, f) }));
  } catch { return []; }
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}
const CLOUD = arg("--cloud");
const PRESET = arg("--preset");
const OUT = arg("--out") || "/tmp/samridhi-media-import.sql";
if (!CLOUD || !PRESET) {
  console.error("Usage: node scripts/import-drive-media.js --cloud <cloud_name> --preset <unsigned_preset> [--out file.sql]");
  process.exit(1);
}

// filename -> { name, artist } ; artist = exact roster name to attach the video to (or null)
const CELEBS = {
  "CHOTU SINGH RAWNAFEED BACK.mp4": { name: "Chotu Singh Rawna", artist: null },
  "HELLY SHAH FEED BACK.mp4": { name: "Helly Shah", artist: "Helly Shah" },
  "My Video.mp4": { name: "Celebrity Feedback", artist: null },
  "PAWNI PANDEY  FEEDBACK.mp4": { name: "Pawni Pandey", artist: "Pawni Pandey" },
  "PRANJAL DAHIYA  FEEDBACK.mp4": { name: "Pranjal Dahiya", artist: "Pranjal Dahiya" },
  "PRANJAL DAHIYA.mp4": { name: "Pranjal Dahiya", artist: "Pranjal Dahiya" },
  "RAJPAL YADHAV FEEDBACK.mp4": { name: "Rajpal Yadav", artist: "Rajpal Yadav" },
  "RASHMI GUPTA FEED BACK.mp4": { name: "Rashmi Gupta", artist: null },
  "SHAKTI MOHAN  FEEDBACK.mp4": { name: "Shakti Mohan", artist: null },
  "SHIVANHI SHARMA  FEEDBACK.mp4": { name: "Shivangi Sharma", artist: "Shivangi Sharma" },
  "SNEHA GUPTA FEEDBACK.mp4": { name: "Sneha Gupta", artist: "Sneha Gupta" },
  "Shivangi Sharma bite.mp4": { name: "Shivangi Sharma", artist: "Shivangi Sharma" },
  "geeta rabari.mp4": { name: "Geeta Rabari", artist: "Geeta Rabari" },
  "pooja singh imli.mp4": { name: "Pooja Singh", artist: null },
  "sonia sharma.mp4": { name: "Sonia Sharma", artist: "Sonia Sharma" },
};

const sqlEscape = (s) => String(s).replace(/'/g, "''");

async function uploadFile(filePath, resourceType, folder) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const buf = fs.readFileSync(filePath);
      const form = new FormData();
      form.append("file", new Blob([buf]), path.basename(filePath));
      form.append("upload_preset", PRESET);
      form.append("folder", folder);
      const res = await fetch(url, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
      return data;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function main() {
  const seen = new Set(); // dedupe by lowercase filename (user may have moved folders)
  const pressRows = [];
  const galleryRows = [];
  const eventPhotoRows = [];
  const artistUpdates = [];
  const failures = [];

  const fbDirs = findDir("Feedback Video");
  const videos = fbDirs.flatMap(listMedia)
    .filter((m) => /\.mp4$/i.test(m.file) && !seen.has(m.file.toLowerCase()) && (seen.add(m.file.toLowerCase()), true));
  console.log(`Feedback videos: ${videos.length} (from: ${fbDirs.join(", ") || "none found"})`);

  // 1. print-media photos -> Cloudinary -> press_clippings rows
  const printDirs = findDir("Print Media");
  const photos = printDirs.flatMap(listMedia)
    .filter((m) => /\.jpe?g$/i.test(m.file) && !seen.has(m.file.toLowerCase()) && (seen.add(m.file.toLowerCase()), true));
  console.log(`Print-media photos: ${photos.length} (from: ${printDirs.join(", ") || "none found"})`);
  let i = 0;
  for (const m of photos) {
    i++;
    try {
      const d = await uploadFile(m.full, "image", "samridhi/press");
      pressRows.push(`('${sqlEscape(d.secure_url)}','single_clipping','Dainik Bhaskar','Pratapgarh','published',false,${i})`);
      if (i % 10 === 0) console.log(`  press photos ${i}/${photos.length}`);
    } catch (e) {
      failures.push(`PHOTO ${m.file}: ${e.message}`);
      console.error(`  FAILED photo ${m.file}: ${e.message}`);
    }
  }

  // 1b. "Events Photos" + "Clients feedback" folders -> gallery_items
  //   - "Clients feedback": videos -> kind='video', category='Highlight Videos', titled "Client Feedback"
  //   - "Events Photos": images -> kind='photo', category='Events';
  //     videos -> kind='video', category='Highlight Videos'
  const extraDirs = [...findDir("Events Photos"), ...findDir("Clients feedback")];
  console.log(`Extra folders: ${extraDirs.join(", ") || "none found"}`);
  const extraFiles = extraDirs.flatMap(listMedia)
    .filter((m) => !seen.has(m.file.toLowerCase()) && (seen.add(m.file.toLowerCase()), true));
  let evSort = 0, j = 0;
  for (const m of extraFiles) {
    const dir = path.basename(m.dir);
    const isVideo = /\.(mp4|mov)$/i.test(m.file);
    const isClientFb = /client/i.test(dir);
    j++; evSort++;
    try {
      const d = await uploadFile(m.full, isVideo ? "video" : "image",
        isVideo ? "samridhi/feedback" : "samridhi/events");
      let title, category, kind, imageUrl, videoUrl;
      if (isVideo) {
        const thumb = `https://res.cloudinary.com/${CLOUD}/video/upload/so_3,w_800,q_auto/f_jpg/${d.public_id}.jpg`;
        kind = "video"; category = "Highlight Videos"; imageUrl = thumb; videoUrl = d.secure_url;
        title = isClientFb ? `Client Feedback ${j}` :
          m.file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 120);
      } else {
        kind = "photo"; category = "Events"; imageUrl = d.secure_url; videoUrl = null;
        title = m.file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 120);
      }
      // Client-feedback reels are draft by default (consent gating); event photos stay published.
      const rowStatus = (isVideo && isClientFb) ? "draft" : "published";
      eventPhotoRows.push(`('${kind}','${sqlEscape(title)}','${sqlEscape(imageUrl)}',` +
        `${videoUrl ? `'${sqlEscape(videoUrl)}'` : "null"},'${category}','','${rowStatus}',false,${evSort})`);
      if (j % 10 === 0) console.log(`  extra files ${j}/${extraFiles.length}`);
    } catch (e) {
      failures.push(`EXTRA ${dir}/${m.file}: ${e.message}`);
      console.error(`  FAILED ${dir}/${m.file}: ${e.message}`);
    }
  }

  // 2. videos -> Cloudinary
  let vi = 0;
  for (const m of videos) {
    vi++;
    const f = m.file;
    const celeb = CELEBS[f] || { name: f.replace(/\.mp4$/i, ""), artist: null };
    try {
      const d = await uploadFile(m.full, "video", "samridhi/feedback");
      const mp4 = d.secure_url;
      const thumb = `https://res.cloudinary.com/${CLOUD}/video/upload/so_3,w_800,q_auto/f_jpg/${d.public_id}.jpg`;
      const title = `Celebrity Feedback — ${celeb.name}`;
      // Feedback/testimonial videos are draft by default (consent gating):
      // Akshay publishes them from Admin -> Gallery after permission is confirmed.
      galleryRows.push(`('video','${sqlEscape(title)}','${sqlEscape(thumb)}','${sqlEscape(mp4)}','Highlight Videos','','draft',false,${vi})`);
      if (celeb.artist) {
        const entry = JSON.stringify([{ source: "cloudinary", ref: mp4, thumb, title: `Feedback — ${celeb.name}` }]);
        // Disabled by default: uncomment only after permission to publish is confirmed.
        artistUpdates.push(
          `-- ${celeb.artist} <- ${f}\n` +
          `-- DISABLED (needs permission confirmed): ` +
          `update artists set videos = coalesce(videos,'[]'::jsonb) || '${sqlEscape(entry)}'::jsonb where lower(name) = '${sqlEscape(celeb.artist.toLowerCase())}';`
        );
      }
      console.log(`  video ${vi}/${videos.length}: ${celeb.name}${celeb.artist ? " (linked to artist)" : ""}`);
    } catch (e) {
      failures.push(`VIDEO ${f}: ${e.message}`);
      console.error(`  FAILED video ${f}: ${e.message}`);
    }
  }

  // 3. SQL file
  let sql = `-- Samridhi media bulk import — generated ${new Date().toISOString()}\n` +
    `-- RUN ONCE in the NEW Supabase project's SQL Editor (after schema.sql + migration-002.sql + migration-003.sql).\n` +
    `-- ${pressRows.length} press clippings, ${eventPhotoRows.length} event photos, ${galleryRows.length} feedback videos, ${artistUpdates.length} artist video links.\n\n`;
  if (pressRows.length) {
    sql += `-- 1. Print-media photos -> Press (all Dainik Bhaskar, Pratapgarh edition, per the clippings)\n` +
      `insert into press_clippings (image_url, type, publication, city, status, is_placeholder, sort) values\n` +
      pressRows.join(",\n") + ";\n\n";
  }
  if (galleryRows.length || eventPhotoRows.length) {
    sql += `-- 2. Event photos + celebrity feedback videos -> Gallery
--    photos: kind='photo', category='Events' | videos: kind='video', category='Highlight Videos'
` +
      `insert into gallery_items (kind, title, image_url, video_url, category, caption, status, is_placeholder, sort) values\n` +
      [...eventPhotoRows, ...galleryRows].join(",\n") + ";\n\n";
  }
  if (artistUpdates.length) {
    sql += `-- 3. Link each feedback video to its artist's profile (shows on the artist page)\n` +
      artistUpdates.join("\n") + "\n\n";
  }
  if (failures.length) {
    sql += `-- FAILED UPLOADS (${failures.length}) — re-upload these manually via Admin:\n` +
      failures.map((f) => `--   ${f}`).join("\n") + "\n";
  }
  fs.writeFileSync(OUT, sql);

  console.log(`\nDone. SQL written to ${OUT}`);
  console.log(`  press rows: ${pressRows.length}, event photo rows: ${eventPhotoRows.length}, gallery video rows: ${galleryRows.length}, artist links: ${artistUpdates.length}`);
  if (failures.length) console.log(`  FAILURES: ${failures.length}\n  - ${failures.join("\n  - ")}`);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
