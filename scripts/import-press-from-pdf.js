#!/usr/bin/env node
/**
 * import-press-from-pdf.js
 *
 * Renders pages of the Samridhi event catalogue PDF to PNG, uploads each page
 * to Cloudinary, and inserts press_clippings rows of type "page_collage"
 * flagged as placeholders (source note recorded in headline).
 *
 * No npm dependencies — uses poppler's `pdftoppm` and Node built-ins only.
 *
 *   node scripts/import-press-from-pdf.js <catalogue.pdf> [firstPage] [lastPage]
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
"use strict";

const { execSync } = require("child_process");
const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");

const [pdfPath, firstArg, lastArg] = process.argv.slice(2);

function fail(msg) {
  console.error("ERROR: " + msg);
  process.exit(1);
}

if (!pdfPath || !fs.existsSync(pdfPath)) {
  fail("Usage: node scripts/import-press-from-pdf.js <catalogue.pdf> [firstPage] [lastPage]");
}

const ENV = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missing = ENV.filter((k) => !process.env[k]);
if (missing.length) fail("Missing env vars: " + missing.join(", ") + ". See DEPLOY.md for where to set them.");

// --- poppler check -----------------------------------------------------------
let hasPoppler = true;
try {
  execSync("command -v pdftoppm", { stdio: "ignore" });
} catch {
  hasPoppler = false;
}

if (!hasPoppler) {
  console.log(`
poppler (pdftoppm) is not installed, so the PDF cannot be rendered automatically.

MANUAL ALTERNATIVE:
  1. Open the catalogue PDF and screenshot/export each press page as a PNG.
  2. In the admin panel go to Press Coverage → "Bulk upload clippings"
     and upload the PNGs (each becomes a press item).
  3. Edit each item: set Type = "Page collage", fill Publication / City /
     Published on, and tick "Mark as placeholder" if it is not a real clipping.

To install poppler and re-run this script:
  Ubuntu/Debian:  sudo apt-get install poppler-utils
  macOS:          brew install poppler
`);
  process.exit(0);
}

// --- helpers -----------------------------------------------------------------
function cloudinarySign(params, secret) {
  const str = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret;
  return crypto.createHash("sha1").update(str).digest("hex");
}

function postMultipart(url, fields, filePath, fileField) {
  return new Promise((resolve, reject) => {
    const boundary = "----muse" + crypto.randomBytes(8).toString("hex");
    const chunks = [];
    for (const [k, v] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
    }
    const filename = path.basename(filePath);
    chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`));
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

async function uploadToCloudinary(filePath) {
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { timestamp, folder: "samridhi/press" };
  const signature = cloudinarySign(params, process.env.CLOUDINARY_API_SECRET);
  const res = await postMultipart(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { ...params, api_key: process.env.CLOUDINARY_API_KEY, signature },
    filePath,
    "file"
  );
  return res.secure_url;
}

// --- main --------------------------------------------------------------------
(async () => {
  const first = parseInt(firstArg || "1", 10);
  const last = parseInt(lastArg || "9999", 10);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "press-"));
  console.log(`Rendering pages ${firstArg || "1"}–${lastArg || "end"} of ${pdfPath} …`);
  execSync(`pdftoppm -png -r 150 -f ${first} -l ${last} ${JSON.stringify(pdfPath)} ${path.join(tmp, "page")}`, { stdio: "inherit" });
  const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
  if (!pngs.length) fail("No pages rendered — check the page range.");

  console.log(`Uploading ${pngs.length} page(s) to Cloudinary and inserting press_clippings rows…`);
  let done = 0;
  for (const png of pngs) {
    const file = path.join(tmp, png);
    try {
      const url = await uploadToCloudinary(file);
      await supabaseInsert("press_clippings", {
        image_url: url,
        type: "page_collage",
        headline: `Catalogue press page (${png.replace(".png", "")}) — extracted from PDF`,
        publication: "",
        city: "",
        status: "published",
        is_placeholder: true,
        sort: 0,
      });
      done++;
      console.log(`  ✓ ${png}`);
    } catch (e) {
      console.error(`  ✗ ${png}: ${e.message}`);
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\nDone: ${done}/${pngs.length} pages imported as PLACEHOLDER press collages.`);
  console.log("Review them at Admin → Press Coverage and untick the placeholder flag once verified.");
})().catch((e) => fail(e.message));
