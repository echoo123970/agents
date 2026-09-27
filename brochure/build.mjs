/* ============================================================
   BUILD — renders src/index.html, or src/price-list.html with
   --price, to a print-ready PDF.

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
// A frame marked data-res="hi" is held at the higher pair in every tier: the
// bench work and the table tops are the detail pages, and they have to read as
// sharp even in the copy that is sent by mail.
const { dpi: DPI, quality: QUALITY, hiDpi: HI_DPI, hiQuality: HI_QUALITY, suffix: SUFFIX } = {
  full:  { dpi: 260, quality: 0.92, hiDpi: 300, hiQuality: 0.94, suffix: "" },
  light: { dpi: 200, quality: 0.84, hiDpi: 260, hiQuality: 0.90, suffix: "-light" },
  mail:  { dpi: 100, quality: 0.58, hiDpi: 190, hiQuality: 0.76, suffix: "-mail" },
}[TIER];
// Both documents share tokens.css, styles.css and the fonts; --price just
// points the same pipeline at the other source file.
const PRICE = process.argv.includes("--price");
const SOURCE = PRICE ? "price-list.html" : "index.html";
const OUT = join(DIST, PRICE
  ? `bespoke-mosaic-price-list${SUFFIX}.pdf`
  : CLEAN ? `bespoke-mosaic-portfolio-client${SUFFIX}.pdf` : "bespoke-mosaic-portfolio.pdf");
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

const html = readFileSync(join(SRC, SOURCE), "utf8").replace(
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
  const shrunk = await page.evaluate(async ([dpi, quality, hiDpi, hiQuality]) => {
    const PX_PER_MM = 96 / 25.4;             // CSS px in a millimetre
    const nodes = [...document.querySelectorAll("[data-slot]")].filter(
      (n) => getComputedStyle(n).backgroundImage !== "none"
    );
    // where a percentage in background-position puts the image
    const frac = (v, over) =>
      v.endsWith("%") ? parseFloat(v) / 100 : over ? parseFloat(v) / over : 0.5;
    let count = 0, before = 0, after = 0;
    for (const node of nodes) {
      const cs = getComputedStyle(node);
      const url = cs.backgroundImage.slice(5, -2);
      if (!url.startsWith("file://")) continue;
      try {
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = url;
        });
        const r = node.getBoundingClientRect();
        const hi = node.dataset.res === "hi";
        const targetDpi = hi ? hiDpi : dpi;
        // What the frame actually shows. Under `cover` the image is scaled to
        // fill the frame and the overflowing edge is clipped away, so only the
        // part inside the frame is worth carrying: cropping to it here is what
        // lets a 720px file read as sharp instead of being spent on pixels the
        // reader never sees. Under `contain` the whole image is visible.
        const contain = cs.backgroundSize === "contain";
        const s = contain
          ? Math.min(r.width / img.width, r.height / img.height)
          : Math.max(r.width / img.width, r.height / img.height);
        const vw = Math.min(img.width, r.width / s);
        const vh = Math.min(img.height, r.height / s);
        const [px, py] = cs.backgroundPosition.split(" ");
        const sx = Math.max(0, Math.min(img.width - vw, (img.width - vw) * frac(px, img.width * s - r.width)));
        const sy = Math.max(0, Math.min(img.height - vh, (img.height - vh) * frac(py, img.height * s - r.height)));
        // the printed size of that visible part, and the pixels it can show
        const mmW = Math.min(r.width, img.width * s) / PX_PER_MM;
        const mmH = Math.min(r.height, img.height * s) / PX_PER_MM;
        const want = Math.round((Math.max(mmW, mmH) / 25.4) * targetDpi);
        // the floor is on the short edge: a tall frame asked for 320px across
        // its height would come out under 260px wide, which is where the walls
        // page lost its sharpness
        const scale = Math.min(1, Math.max(want / Math.max(vw, vh), 320 / Math.min(vw, vh)));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(vw * scale));
        c.height = Math.max(1, Math.round(vh * scale));
        c.getContext("2d").drawImage(img, sx, sy, vw, vh, 0, 0, c.width, c.height);
        before += img.width * img.height;
        after += c.width * c.height;
        node.style.setProperty("background-image", `url("${c.toDataURL("image/jpeg", hi ? hiQuality : quality)}")`, "important");
        // the crop now matches the frame, so nothing is left to position
        if (!contain) {
          node.style.setProperty("background-position", "center", "important");
          node.style.setProperty("background-size", "cover", "important");
        }
        count++;
      } catch { /* leave the original in place */ }
    }
    return { count, saved: before ? Math.round((1 - after / before) * 100) : 0 };
  }, [DPI, QUALITY, HI_DPI, HI_QUALITY]);
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
