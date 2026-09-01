#!/usr/bin/env node
/**
 * Bulk-upload a folder of images to Shopify (Content > Files) and print/save
 * the resulting CDN URLs.
 *
 * Flow per file:  stagedUploadsCreate  ->  upload bytes to staged target
 *                 ->  fileCreate       ->  poll until READY  ->  CDN url
 *
 * ── Setup (one time) ────────────────────────────────────────────────────
 * 1. Requires Node.js 18+ (uses built-in fetch / FormData / Blob).
 *      node --version   # must be >= 18
 * 2. In Shopify admin: Settings > Apps and sales channels > Develop apps
 *      > Create an app > Configuration > Admin API scopes: enable
 *      `write_files` (and `read_files`). Install it, then copy the
 *      "Admin API access token" (starts with shpat_...).
 * 3. Set environment variables (do NOT hard-code the token):
 *      export SHOPIFY_STORE="your-store.myshopify.com"
 *      export SHOPIFY_ADMIN_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
 *      # optional: export SHOPIFY_API_VERSION="2025-01"
 *
 * ── Run ─────────────────────────────────────────────────────────────────
 *      node upload-images-to-shopify.mjs /path/to/your/image/folder
 *   or default to ./images if no folder is given:
 *      node upload-images-to-shopify.mjs
 *
 * Output: prints a table and writes cdn-urls.csv in the current directory.
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, basename, extname } from "node:path";

// ── Config ────────────────────────────────────────────────────────────────
const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";
const IMAGE_DIR = process.argv[2] || "./images";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"]);
const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".bmp": "image/bmp", ".tiff": "image/tiff",
};

if (!STORE || !TOKEN) {
  console.error("ERROR: set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN env vars first. See the header of this file.");
  process.exit(1);
}

const ENDPOINT = `https://${STORE}/admin/api/${API_VERSION}/graphql.json`;

// ── GraphQL helper ──────────────────────────────────────────────────────────
async function gql(query, variables) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL: " + JSON.stringify(json.errors));
  return json.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Step 1: ask Shopify for a staged upload target ──────────────────────────
async function createStagedTarget(filename, mimeType, fileSize) {
  const data = await gql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    {
      input: [{
        filename,
        mimeType,
        resource: "FILE",
        fileSize: String(fileSize),
        httpMethod: "POST",
      }],
    }
  );
  const errs = data.stagedUploadsCreate.userErrors;
  if (errs.length) throw new Error("stagedUploadsCreate: " + JSON.stringify(errs));
  return data.stagedUploadsCreate.stagedTargets[0];
}

// ── Step 2: upload the raw bytes to the staged target ───────────────────────
async function uploadBytes(target, buffer, filename, mimeType) {
  const form = new FormData();
  for (const p of target.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(target.url, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`staged upload failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

// ── Step 3: register the file in Content > Files ─────────────────────────────
async function fileCreate(resourceUrl, alt) {
  const data = await gql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
       fileCreate(files: $files) {
         files { id alt fileStatus }
         userErrors { field message }
       }
     }`,
    { files: [{ originalSource: resourceUrl, contentType: "IMAGE", alt }] }
  );
  const errs = data.fileCreate.userErrors;
  if (errs.length) throw new Error("fileCreate: " + JSON.stringify(errs));
  return data.fileCreate.files[0].id;
}

// ── Step 4: poll until the file is READY and has a CDN url ───────────────────
async function waitForCdnUrl(fileId, { tries = 30, delayMs = 2000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const data = await gql(
      `query($id: ID!) {
         node(id: $id) {
           ... on MediaImage { id fileStatus image { url } }
         }
       }`,
      { id: fileId }
    );
    const node = data.node;
    if (node?.fileStatus === "READY" && node.image?.url) return node.image.url;
    if (node?.fileStatus === "FAILED") throw new Error("file processing FAILED");
    await sleep(delayMs);
  }
  throw new Error("timed out waiting for CDN url");
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const dirStat = await stat(IMAGE_DIR).catch(() => null);
  if (!dirStat?.isDirectory()) {
    console.error(`ERROR: "${IMAGE_DIR}" is not a folder. Pass a folder path as the first argument.`);
    process.exit(1);
  }

  const entries = await readdir(IMAGE_DIR);
  const files = entries
    .filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase()))
    .sort();

  if (!files.length) {
    console.error(`No images found in "${IMAGE_DIR}".`);
    process.exit(1);
  }

  console.log(`Found ${files.length} image(s) in ${IMAGE_DIR}\n`);
  const results = [];

  for (const [i, name] of files.entries()) {
    const label = `[${i + 1}/${files.length}] ${name}`;
    try {
      const ext = extname(name).toLowerCase();
      const mimeType = MIME[ext] || "application/octet-stream";
      const buffer = await readFile(join(IMAGE_DIR, name));

      const target = await createStagedTarget(name, mimeType, buffer.length);
      await uploadBytes(target, buffer, name, mimeType);
      const fileId = await fileCreate(target.resourceUrl, basename(name, ext));
      const url = await waitForCdnUrl(fileId);

      console.log(`✅ ${label}\n   ${url}`);
      results.push({ file: name, url, status: "ok" });
    } catch (err) {
      console.error(`❌ ${label}\n   ${err.message}`);
      results.push({ file: name, url: "", status: "error: " + err.message });
    }
  }

  // Write CSV
  const csv =
    "filename,cdn_url,status\n" +
    results
      .map((r) => `${csvCell(r.file)},${csvCell(r.url)},${csvCell(r.status)}`)
      .join("\n");
  await writeFile("cdn-urls.csv", csv, "utf8");

  const ok = results.filter((r) => r.status === "ok").length;
  console.log(`\nDone: ${ok}/${results.length} uploaded. Saved cdn-urls.csv`);
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
