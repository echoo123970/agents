#!/usr/bin/env node
/**
 * Bulk-upload a folder of images to Shopify (Content > Files) and print/save
 * the resulting CDN URLs.  Cross-platform: works on Windows, macOS, Linux.
 *
 * Flow per file:  stagedUploadsCreate  ->  upload bytes to staged target
 *                 ->  fileCreate       ->  poll until READY  ->  CDN url
 *
 * ── Requirements ─────────────────────────────────────────────────────────
 *   • Node.js 18 or newer.  Check with:   node --version
 *     (Download from https://nodejs.org if you don't have it.)
 *   • A Shopify Admin API access token with the `write_files` and
 *     `read_files` scopes:
 *       Shopify admin > Settings > Apps and sales channels > Develop apps
 *       > Create an app > Configuration > Admin API scopes: enable
 *       write_files + read_files > Save > Install app
 *       > API credentials > reveal/copy "Admin API access token" (shpat_...)
 *
 * ── How to run (Windows PowerShell) ───────────────────────────────────────
 *   1. Open PowerShell and change into the folder that holds this script:
 *          cd C:\path\to\scripts
 *   2. Run it:
 *          node upload-images-to-shopify.mjs "C:\path\to\your\image\folder"
 *   3. If you didn't set the env vars below, it will simply ASK you for the
 *      store domain and the token (token input is hidden). That's it.
 *
 *   (macOS / Linux is identical, just with forward-slash paths.)
 *
 * ── Optional: skip the prompts by setting env vars first ──────────────────
 *   PowerShell:
 *          $env:SHOPIFY_STORE="your-store.myshopify.com"
 *          $env:SHOPIFY_ADMIN_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxx"
 *          node upload-images-to-shopify.mjs "C:\path\to\images"
 *   macOS/Linux:
 *          export SHOPIFY_STORE="your-store.myshopify.com"
 *          export SHOPIFY_ADMIN_TOKEN="shpat_xxxxxxxxxxxxxxxxxxxx"
 *          node upload-images-to-shopify.mjs /path/to/images
 *
 * Output: prints a table and writes cdn-urls.csv in the current folder.
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, basename, extname, resolve } from "node:path";
import readline from "node:readline";

// ── Config from env (may be filled in by prompts below) ─────────────────────
let STORE = process.env.SHOPIFY_STORE;
let TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || "2025-01";
let IMAGE_DIR = process.argv[2] || process.env.SHOPIFY_IMAGE_DIR || "";

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".tiff"]);
const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".bmp": "image/bmp", ".tiff": "image/tiff",
};

// ── Interactive prompt helpers (used only if a value is missing) ─────────────
function prompt(query, { hidden = false } = {}) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      rl.stdoutMuted = false;
      rl._writeToOutput = (s) => { if (!rl.stdoutMuted) process.stdout.write(s); };
    }
    rl.question(query, (ans) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      res(ans.trim());
    });
    if (hidden) rl.stdoutMuted = true; // mute echo AFTER the query prints
  });
}

async function ensureConfig() {
  if (!STORE) {
    STORE = await prompt("Shopify store domain (e.g. your-store.myshopify.com): ");
  }
  // normalise: strip protocol / trailing slash, tolerate bare handle
  STORE = STORE.replace(/^https?:\/\//, "").replace(/\/.*$/, "").trim();
  if (STORE && !STORE.includes(".")) STORE = `${STORE}.myshopify.com`;

  if (!TOKEN) {
    TOKEN = await prompt("Admin API access token (shpat_...): ", { hidden: true });
  }
  if (!IMAGE_DIR) {
    IMAGE_DIR = await prompt("Path to the image folder: ");
  }
  IMAGE_DIR = IMAGE_DIR.replace(/^["']|["']$/g, ""); // strip quotes if pasted

  if (!STORE || !TOKEN || !IMAGE_DIR) {
    console.error("\nERROR: store, token and folder are all required.");
    process.exit(1);
  }
}

// ── GraphQL helper ──────────────────────────────────────────────────────────
async function gql(query, variables) {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(`auth failed (${res.status}) — check the store domain and that the token has write_files scope`);
  }
  const json = await res.json();
  if (json.errors) throw new Error("GraphQL: " + JSON.stringify(json.errors));
  return json.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createStagedTarget(filename, mimeType, fileSize) {
  const data = await gql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
       stagedUploadsCreate(input: $input) {
         stagedTargets { url resourceUrl parameters { name value } }
         userErrors { field message }
       }
     }`,
    { input: [{ filename, mimeType, resource: "FILE", fileSize: String(fileSize), httpMethod: "POST" }] }
  );
  const errs = data.stagedUploadsCreate.userErrors;
  if (errs.length) throw new Error("stagedUploadsCreate: " + JSON.stringify(errs));
  return data.stagedUploadsCreate.stagedTargets[0];
}

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

async function waitForCdnUrl(fileId, { tries = 30, delayMs = 2000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const data = await gql(
      `query($id: ID!) { node(id: $id) { ... on MediaImage { id fileStatus image { url } } } }`,
      { id: fileId }
    );
    const node = data.node;
    if (node?.fileStatus === "READY" && node.image?.url) return node.image.url;
    if (node?.fileStatus === "FAILED") throw new Error("file processing FAILED");
    await sleep(delayMs);
  }
  throw new Error("timed out waiting for CDN url");
}

function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  await ensureConfig();

  const dirStat = await stat(IMAGE_DIR).catch(() => null);
  if (!dirStat?.isDirectory()) {
    console.error(`\nERROR: "${IMAGE_DIR}" is not a folder.`);
    process.exit(1);
  }

  const entries = await readdir(IMAGE_DIR);
  const files = entries.filter((f) => IMAGE_EXTS.has(extname(f).toLowerCase())).sort();
  if (!files.length) {
    console.error(`\nNo images found in "${IMAGE_DIR}".`);
    process.exit(1);
  }

  console.log(`\nStore:  ${STORE}`);
  console.log(`Folder: ${resolve(IMAGE_DIR)}`);
  console.log(`Found ${files.length} image(s).\n`);

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
      console.log(`OK  ${label}\n    ${url}`);
      results.push({ file: name, url, status: "ok" });
    } catch (err) {
      console.error(`ERR ${label}\n    ${err.message}`);
      results.push({ file: name, url: "", status: "error: " + err.message });
    }
  }

  const csv = "filename,cdn_url,status\n" +
    results.map((r) => `${csvCell(r.file)},${csvCell(r.url)},${csvCell(r.status)}`).join("\n");
  await writeFile("cdn-urls.csv", csv, "utf8");

  const ok = results.filter((r) => r.status === "ok").length;
  console.log(`\nDone: ${ok}/${results.length} uploaded. Saved cdn-urls.csv in ${resolve(".")}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
