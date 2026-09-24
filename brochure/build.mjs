/* ============================================================
   BUILD — renders src/index.html to a print-ready PDF.

     node build.mjs            → dist/bespoke-mosaic-portfolio.pdf
     node build.mjs --png      → also writes dist/preview/page-NN.png
     node build.mjs --clean    → dist/…-client.pdf, no upload notes on
                                 frames that are still waiting on a photo

   PHOTOGRAPHY DROP-IN
   Any file placed in images/ whose name matches a slot is used
   automatically, and its placeholder note disappears. Slots:

     cover, craft-hands, craft-macro, custom-artwork, custom-result,
     layup, wip-01..04, done-01..03, installed-hero,
     app-01..04, closing

   e.g. images/cover.jpg, images/wip-02.png
   ============================================================ */
import { chromium } from "playwright";
import { readdirSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, resolve, extname, basename } from "node:path";
import { readFileSync } from "node:fs";

const ROOT = import.meta.dirname;
const SRC = join(ROOT, "src");
const IMAGES = join(ROOT, "images");
const DIST = join(ROOT, "dist");
const CLEAN = process.argv.includes("--clean");
// How hard the photography is re-encoded. --light is the screen copy; --mail
// trades visible sharpness for a file that opens on a phone, where anything
// much past 5MB has been refusing to.
const TIER = process.argv.includes("--mail") ? "mail" : process.argv.includes("--light") ? "light" : "full";
const { dpi: DPI, quality: QUALITY, suffix: SUFFIX } = {
  full:  { dpi: 260, quality: 0.92, suffix: "" },
  light: { dpi: 200, quality: 0.84, suffix: "-light" },
  mail:  { dpi: 120, quality: 0.66, suffix: "-mail" },
}[TIER];
const OUT = join(DIST, CLEAN ? `bespoke-mosaic-portfolio-client${SUFFIX}.pdf` : "bespoke-mosaic-portfolio.pdf");
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

mkdirSync(DIST, { recursive: true });
mkdirSync(IMAGES, { recursive: true });

// ---- collect supplied photography -------------------------------------
const found = readdirSync(IMAGES)
  .filter((f) => EXT.has(extname(f).toLowerCase()))
  .map((f) => ({ slot: basename(f, extname(f)), url: "file://" + resolve(IMAGES, f) }));

const css = found
  .map(
    ({ slot, url }) => `
[data-slot="${slot}"] { background-image: url("${url}") !important; }
[data-slot="${slot}"] .slotinfo { display: none !important; }
[data-slot="${slot}"]::after { border-color: rgba(255,255,255,.34) !important; }`
  )
  .join("\n");

const html = readFileSync(join(SRC, "index.html"), "utf8").replace(
  "<!--PHOTO_INJECT-->",
  css ? `<style>/* supplied photography */${css}\n</style>` : "<!-- no photography supplied yet -->"
);

const tmp = join(SRC, ".build.html");
writeFileSync(tmp, html);

// ---- render ------------------------------------------------------------
// The pre-installed Chromium may not match this Playwright build's expected
// revision, so point at it explicitly (PLAYWRIGHT_BROWSERS_PATH layout).
const CHROME = process.env.CHROME_PATH || "/opt/pw-browsers/chromium";
const FULL_RES = process.argv.includes("--full");
const browser = await chromium.launch({
  ...(existsSync(CHROME) ? { executablePath: CHROME } : {}),
  // lets the page read the local photography for downscaling
  args: ["--allow-file-access-from-files"],
});
const page = await browser.newPage({ viewport: { width: 1240, height: 1754 } });
await page.goto("file://" + tmp, { waitUntil: "load" });
await page.emulateMedia({ media: "print" });
await page.evaluate(() => document.fonts.ready);

// ---- downscale supplied photography ------------------------------------
// Camera files carry far more pixels than a frame can show, and WebP has no
// PDF equivalent, so every image is re-encoded. The target is set per frame
// from the size it is actually drawn at — a 41mm square needs a fraction of
// what a full-page photograph does — which is where the file size goes.
// Pass --full to embed the originals untouched.
// Most of the supplied photography is 720-800px on the short edge, so the
// min(1, …) cap leaves it at native size in the standard build: 260dpi is
// more than a 90mm frame can draw from a 720px file. 200dpi is the lowest
// that still reads as sharp on screen; --mail goes below that on purpose.
if (found.length && !FULL_RES) {
  const shrunk = await page.evaluate(async ([dpi, quality]) => {
    const PX_PER_MM = 96 / 25.4;             // CSS px in a millimetre
    const nodes = [...document.querySelectorAll("[data-slot]")].filter(
      (n) => getComputedStyle(n).backgroundImage !== "none"
    );
    let count = 0, before = 0, after = 0;
    for (const node of nodes) {
      const url = getComputedStyle(node).backgroundImage.slice(5, -2);
      if (!url.startsWith("file://")) continue;
      try {
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = url;
        });
        // the frame's printed size, and the pixels that size can actually show
        const r = node.getBoundingClientRect();
        const mm = Math.max(r.width, r.height) / PX_PER_MM;
        const want = Math.max(320, Math.round((mm / 25.4) * dpi));
        // background-size: cover means the long edge may be cropped away, so
        // scale on the short edge to keep the visible area at full quality
        const shortEdge = Math.min(img.width, img.height);
        const scale = Math.min(1, want / shortEdge);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        before += img.width * img.height;
        after += c.width * c.height;
        node.style.setProperty("background-image", `url("${c.toDataURL("image/jpeg", quality)}")`, "important");
        count++;
      } catch { /* leave the original in place */ }
    }
    return { count, saved: before ? Math.round((1 - after / before) * 100) : 0 };
  }, [DPI, QUALITY]);
  if (shrunk.count)
    console.log(`photography: ${shrunk.count} image(s) re-encoded to frame size (${shrunk.saved}% fewer pixels)`);
}

// ---- frames still waiting on photography -------------------------------
// The studio build keeps each empty frame's shot note: it is the shot list.
// --clean fills them with a quiet tessera field instead, so the document can
// go to a client today without reading as unfinished.
if (CLEAN) {
  const filled = await page.evaluate((tone) => window.fillEmptyFrames(tone), "#CBDACE");
  console.log(`unphotographed: ${filled} frame(s) filled with tesserae (--clean)`);
}

await page.waitForTimeout(400);

await page.pdf({
  path: OUT,
  width: "210mm",
  height: "297mm",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

if (process.argv.includes("--png")) {
  const PREV = join(DIST, "preview");
  rmSync(PREV, { recursive: true, force: true });
  mkdirSync(PREV, { recursive: true });
  const pages = await page.locator(".page").all();
  for (let i = 0; i < pages.length; i++) {
    await pages[i].screenshot({ path: join(PREV, `page-${String(i + 1).padStart(2, "0")}.png`) });
  }
  console.log(`preview: ${pages.length} page images → dist/preview/`);
}

await browser.close();
rmSync(tmp, { force: true });

console.log(`pdf: ${OUT}`);
console.log(
  found.length
    ? `photography: ${found.length} slot(s) filled → ${found.map((f) => f.slot).join(", ")}`
    : "photography: none supplied yet — placeholders shown with shot notes"
);
