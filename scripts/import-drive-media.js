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

const BASE = "/tmp/samridhi-import/Samrridhi";

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
  const photos = fs.readdirSync(path.join(BASE, "Print Media"))
    .filter((f) => /\.jpe?g$/i.test(f)).sort();
  const videos = fs.readdirSync(path.join(BASE, "Feedback Video"))
    .filter((f) => /\.mp4$/i.test(f)).sort();
  console.log(`Photos: ${photos.length}, Videos: ${videos.length}`);

  const pressRows = [];
  const galleryRows = [];
  const artistUpdates = [];
  const failures = [];

  // 1. photos -> Cloudinary
  let i = 0;
  for (const f of photos) {
    i++;
    try {
      const d = await uploadFile(path.join(BASE, "Print Media", f), "image", "samridhi/press");
      pressRows.push(`('${sqlEscape(d.secure_url)}','single_clipping','Dainik Bhaskar','Pratapgarh','published',false,${i})`);
      if (i % 10 === 0) console.log(`  photos ${i}/${photos.length}`);
    } catch (e) {
      failures.push(`PHOTO ${f}: ${e.message}`);
      console.error(`  FAILED photo ${f}: ${e.message}`);
    }
  }

  // 2. videos -> Cloudinary
  i = 0;
  for (const f of videos) {
    i++;
    const celeb = CELEBS[f] || { name: f.replace(/\.mp4$/i, ""), artist: null };
    try {
      const d = await uploadFile(path.join(BASE, "Feedback Video", f), "video", "samridhi/feedback");
      const mp4 = d.secure_url;
      const thumb = `https://res.cloudinary.com/${CLOUD}/video/upload/so_3,w_800,q_auto/f_jpg/${d.public_id}.jpg`;
      const title = `Celebrity Feedback — ${celeb.name}`;
      galleryRows.push(`('video','${sqlEscape(title)}','${sqlEscape(thumb)}','${sqlEscape(mp4)}','Highlight Videos','','published',false,${i})`);
      if (celeb.artist) {
        const entry = JSON.stringify([{ source: "cloudinary", ref: mp4, thumb, title: `Feedback — ${celeb.name}` }]);
        artistUpdates.push(
          `-- ${celeb.artist} <- ${f}\n` +
          `update artists set videos = coalesce(videos,'[]'::jsonb) || '${sqlEscape(entry)}'::jsonb where lower(name) = '${sqlEscape(celeb.artist.toLowerCase())}';`
        );
      }
      console.log(`  video ${i}/${videos.length}: ${celeb.name}${celeb.artist ? " (linked to artist)" : ""}`);
    } catch (e) {
      failures.push(`VIDEO ${f}: ${e.message}`);
      console.error(`  FAILED video ${f}: ${e.message}`);
    }
  }

  // 3. SQL file
  let sql = `-- Samridhi media bulk import — generated ${new Date().toISOString()}\n` +
    `-- RUN ONCE in the NEW Supabase project's SQL Editor (after schema.sql + migration-002.sql + migration-003.sql).\n` +
    `-- ${pressRows.length} press clippings, ${galleryRows.length} feedback videos, ${artistUpdates.length} artist video links.\n\n`;
  if (pressRows.length) {
    sql += `-- 1. Print-media photos -> Press (all Dainik Bhaskar, Pratapgarh edition, per the clippings)\n` +
      `insert into press_clippings (image_url, type, publication, city, status, is_placeholder, sort) values\n` +
      pressRows.join(",\n") + ";\n\n";
  }
  if (galleryRows.length) {
    sql += `-- 2. Celebrity feedback videos -> Gallery (kind='video', category='Highlight Videos')\n` +
      `insert into gallery_items (kind, title, image_url, video_url, category, caption, status, is_placeholder, sort) values\n` +
      galleryRows.join(",\n") + ";\n\n";
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
  console.log(`  press rows: ${pressRows.length}, gallery video rows: ${galleryRows.length}, artist links: ${artistUpdates.length}`);
  if (failures.length) console.log(`  FAILURES: ${failures.length}\n  - ${failures.join("\n  - ")}`);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
