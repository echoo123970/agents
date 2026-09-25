/* ============================================================
   TESSERAE

   A field of hand-cut squares in one tone, with the tonal
   variation stone actually has. It drew the colour-chart swatches
   until those pages came out; it now fills the frames that are
   still waiting on a photograph (see fillEmptyFrames below).
   ============================================================ */
const hexToHsl = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
};
/* deterministic jitter, so a rebuild always draws the same swatch */
const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

/* a field of hand-cut tesserae in one tone */
const tesserae = (hex, seed, cols = 7, rows = 4, amp = 1) => {
  const [h, s, l] = hexToHsl(hex);
  const rand = rng(seed);
  let out = "";
  for (let i = 0; i < cols * rows; i++) {
    const r = rand();
    const vein = r > 0.88;                                        // the occasional bright vein
    const dl = (vein ? 9 + rand() * 7 : (rand() - 0.5) * 9) * amp; // tonal spread
    const dh = (rand() - 0.5) * 6 * amp;
    const ds = (rand() - 0.5) * 8 * amp;
    out += `<i style="background:hsl(${(h + dh + 360) % 360} ${Math.max(0, Math.min(100, s + ds))}% ${
      Math.max(2, Math.min(98, l + dl))}%)"></i>`;
  }
  return out;
};

/* ============================================================
   COLLECTIONS — pulled from the atelier's live catalogue.
   ["Title", "handle", "range note"] — the handle is also the
   image slot, so images/collection-<handle>.jpg fills the frame.
   ============================================================ */
const COLLECTIONS = [
  ["Flower",        "flower-mosaics",          "450+ designs"],
  ["Geometric",     "geometric-mosaics",       "360+ designs"],
  ["Landscape",     "landscape-mosaics",       "290+ designs"],
  ["Bird",          "bird-mosaics",            "120+ designs"],
  ["Nautical",      "nautical-mosaics",        "110+ designs"],
  ["Religious",     "religious-mosaics",       "100+ designs"],
  ["Animal",        "animal-mosaics",          "85 designs"],
  ["Tree",          "tree-mosaics",            "80+ designs"],
  ["Portrait",      "portrait-mosaics",        "75 designs"],
  ["Roman",         "roman-mosaics",           "60+ designs"],
  ["Abstract",      "abstract",                "43 designs"],
  ["Food &amp; wine",   "food-mosaics",            "35 designs"],
  ["Landmark",      "landmark-mosaics",        "19 designs"],
  ["Pattern",       "patterns-mosaics",        "19 designs"],
  ["Van Gogh",      "van-gogh-mosaics",        "16 reproductions"],
  ["Glass mosaic art","glass-mosaic-art",      "1,600+ designs"],
  ["Backsplash",    "mosaic-tile-backsplash",  "100+ designs"],
  ["Table top",     "table-countertop-mosaics","89 designs"],
  ["Limited edition","limited-edition",        "hand-signed series"],
  ["Atelier specials","studio-specials",       "one-of-a-kind"],
];

/* Three of the twenty have photography. Rather than show seventeen blank
   frames, those three run as features across the top and the whole set is
   set as a typographic index beneath. */
const FEATURED = ["bird-mosaics", "mosaic-tile-backsplash", "table-countertop-mosaics"];

function paintCollections(id) {
  const host = document.getElementById(id);
  if (!host) return;
  const by = Object.fromEntries(COLLECTIONS.map((c) => [c[1], c]));
  const widths = { "bird-mosaics": "68mm", "mosaic-tile-backsplash": "1fr", "table-countertop-mosaics": "1fr" };

  host.innerHTML = `
    <div style="display:grid;grid-template-columns:${FEATURED.map((h) => widths[h]).join(" ")};gap:4mm;height:62mm">
      ${FEATURED.map((h) => `
        <div class="photo" data-slot="collection-${h}">
          <div class="slotinfo"><div class="desc" style="font-size:7pt">${by[h][0]}</div></div>
        </div>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6mm 6mm;margin-top:8mm">
      ${COLLECTIONS.map(([title, , note]) => `
        <div class="idx">
          <div class="nm">${title}</div>
          <div class="mt">${note}</div>
        </div>`).join("")}
    </div>`;
}

paintCollections("collections-grid");

/* ---- unphotographed frames -------------------------------------------
   With --clean, a frame still waiting on its photograph drops the upload
   note and fills with a quiet field of tesserae instead, so a document
   sent to a client reads as designed rather than unfinished. The atelier's
   own build keeps the notes — they are the shot list.                    */
window.fillEmptyFrames = (tone) => {
  let n = 0;
  document.querySelectorAll("[data-slot]").forEach((frame, i) => {
    if (getComputedStyle(frame).backgroundImage !== "none") return;
    // a full-bleed frame carries the page's type; leave it as flat ground
    if (frame.classList.contains("bleed")) { frame.replaceChildren(); frame.classList.add("tessblank"); n++; return; }
    const grid = document.createElement("div");
    grid.className = "tessfill";
    grid.style.setProperty("--cols", "16");
    grid.innerHTML = tesserae(tone, i * 7919 + 101, 16, 22, 0.45);
    frame.replaceChildren(grid);
    frame.classList.add("tessfilled");
    n++;
  });
  return n;
};
