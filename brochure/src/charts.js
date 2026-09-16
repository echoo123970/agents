/* ============================================================
   COLOUR CHARTS

   Each row is ["Name", "reference", "#base"]. The swatch is drawn
   as real tesserae — a small field of hand-cut squares with the
   tonal variation natural stone actually has — rather than a flat
   block of colour.

   To use photographed samples instead, replace the chip markup in
   paint() with a background-image.
   ============================================================ */

/* 42 natural marbles, numbered as in the studio palette */
const MARBLE = [
  ["Nero Marquina",     "01", "#1A1A1C"],
  ["Bardiglio Gray",    "02", "#8A8C8E"],
  ["Thassos White",     "03", "#F2F0EB"],
  ["Carrara White",     "04", "#E4E0D6"],
  ["Giallo Siena",      "05", "#D9A02E"],
  ["Rosso Verona",      "06", "#A8431F"],
  ["Giallo Reale",      "07", "#C97E27"],
  ["Rojo Alicante",     "08", "#8E2C1E"],
  ["Emperador Dark",    "09", "#3B2418"],
  ["Emperador Red",     "10", "#4A1E16"],
  ["Crema Marfil",      "11", "#E2CFAA"],
  ["Pink Rose",         "12", "#C79184"],
  ["Lilac",             "13", "#9E9298"],
  ["Perlatto Royal",    "14", "#BFB5A6"],
  ["Honey Onyx",        "15", "#C98B2C"],
  ["Beige Marfil",      "16", "#D7BC90"],
  ["Rojo Valencia",     "17", "#B4562A"],
  ["Toast Beige",       "18", "#C29A73"],
  ["Noce",              "19", "#7A5231"],
  ["Amarillo Triana",   "20", "#C08B34"],
  ["Marron Emperador",  "21", "#3D2A18"],
  ["Walnut",            "22", "#6E4B31"],
  ["Light Taupe",       "23", "#9A8874"],
  ["Silver Grey",       "24", "#A9A9A6"],
  ["Light Beige",       "25", "#DCC49A"],
  ["Ivory Cream",       "26", "#E6D6B6"],
  ["Snow White",        "27", "#EFEEE9"],
  ["Bianco Thassos",    "28", "#F4F3EF"],
  ["Bianco Carrara",    "29", "#E9E8E3"],
  ["Cloud Grey",        "30", "#B8BAB8"],
  ["Lavender",          "31", "#9B8F93"],
  ["Grey Marble",       "32", "#8E8E8C"],
  ["Tundra Grey",       "33", "#5F6058"],
  ["Graphite",          "34", "#3A3E3C"],
  ["Dark Grey",         "35", "#4B4E4C"],
  ["Black Absolute",    "36", "#121212"],
  ["Sahara Verde",      "37", "#A38A5C"],
  ["Verde Alpi",        "38", "#2C4032"],
  ["Verde Oliva",       "39", "#4A4F32"],
  ["Verde Guatemala",   "40", "#24402F"],
  ["Verde Suez",        "41", "#2A3A2C"],
  ["Verde Imperiale",   "42", "#33463A"],
];

/* 6 engineered stones */
const ENGINEERED = [
  ["Cream",       "43", "#D9B98A"],
  ["Ruby Red",    "44", "#9B1020"],
  ["Sky Blue",    "45", "#3E7F9E"],
  ["Ocean Blue",  "46", "#134A6B"],
  ["Turquoise",   "47", "#128494"],
  ["Cobalt Blue", "48", "#0B4EA0"],
];

/* Hand-poured glass and metal leaf — indicative range */
const GLASS = [
  ["Oro 24k",       "24k gold leaf",    "#C9A458"],
  ["Oro Bianco",    "white gold leaf",  "#C6C4BC"],
  ["Rame",          "copper leaf",      "#A05C31"],
  ["Gold Fleck",    "fleck glass",      "#8B6527"],
  ["Bianco Latte",  "opaque",           "#F4F2EC"],
  ["Avorio",        "opaque",           "#EADEC6"],
  ["Sabbia",        "opaque",           "#D6C4A2"],
  ["Miele",         "transparent",      "#D9AA55"],
  ["Ambra",         "transparent",      "#C4862C"],
  ["Corallo",       "opaque",           "#D06C4C"],
  ["Rubino",        "transparent",      "#951A2A"],
  ["Melograno",     "opaque",           "#77192C"],
  ["Rosa Antico",   "opaque",           "#DCB0A7"],
  ["Lilla",         "opaque",           "#B2A1BB"],
  ["Violetto",      "transparent",      "#4D2C62"],
  ["Turchese",      "opaque",           "#4EA5A3"],
  ["Acquamarina",   "transparent",      "#88C1C9"],
  ["Blu Turchino",  "opaque",           "#256C89"],
  ["Blu Cobalto",   "transparent",      "#1A4084"],
  ["Blu Notte",     "opaque",           "#16223C"],
  ["Verde Salvia",  "opaque",           "#849979"],
  ["Verde Smeraldo","transparent",      "#145A45"],
  ["Grigio Perla",  "opaque",           "#C9C6BF"],
  ["Antracite",     "opaque",           "#2F2F31"],
  ["Nero Specchio", "mirror glass",     "#232327"],
  ["Iridescente",   "surface-fired",    "#C9D5D6"],
  ["Terracotta",    "opaque",           "#B3613D"],
  ["Bronzo",        "metallic",         "#8B7044"],
  ["Verde Menta",   "opaque",           "#9FC0AC"],
  ["Ghiaccio",      "transparent",      "#CBDCE1"],
];

/* ---- colour helpers -------------------------------------------------- */
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
const tesserae = (hex, seed, cols = 7, rows = 4) => {
  const [h, s, l] = hexToHsl(hex);
  const rand = rng(seed);
  let out = "";
  for (let i = 0; i < cols * rows; i++) {
    const r = rand();
    const vein = r > 0.88;                                  // the occasional bright vein
    const dl = vein ? 9 + rand() * 7 : (rand() - 0.5) * 9;  // tonal spread
    const dh = (rand() - 0.5) * 6;
    const ds = (rand() - 0.5) * 8;
    out += `<i style="background:hsl(${(h + dh + 360) % 360} ${Math.max(0, Math.min(100, s + ds))}% ${
      Math.max(2, Math.min(98, l + dl))}%)"></i>`;
  }
  return out;
};

function paint(id, rows, cols) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = rows
    .map(([name, note, hex], i) => `
      <div class="sw">
        <div class="chip tess" style="--cols:${cols}">${tesserae(hex, i * 7919 + 13, cols)}</div>
        <div class="nm">${name}</div>
        <div class="mt">${note}</div>
      </div>`)
    .join("");
}

paint("marble-chart", MARBLE, 7);
paint("engineered-chart", ENGINEERED, 7);
paint("glass-chart", GLASS, 7);

/* ============================================================
   COLLECTIONS — pulled from the studio's live catalogue.
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
  ["Studio specials","studio-specials",        "one-of-a-kind"],
];

function paintCollections(id) {
  const host = document.getElementById(id);
  if (!host) return;
  host.innerHTML = COLLECTIONS.map(([title, handle, note]) => `
    <div class="sw">
      <div class="photo coll" data-slot="collection-${handle}">
        <div class="slotinfo"><div class="desc" style="font-size:7.5pt">${title}</div></div>
      </div>
      <div class="nm" style="font-size:8pt">${title}</div>
      <div class="mt">${note}</div>
    </div>`).join("");
}

paintCollections("collections-grid");

/* ---- folio numbers ---------------------------------------------------
   Page numbers follow document order, so inserting or reordering a page
   never leaves a stale number behind.                                    */
document.querySelectorAll(".page").forEach((page, i) => {
  const folio = page.querySelector(".folio");
  if (folio) folio.lastElementChild.textContent = String(i + 1).padStart(2, "0");
});
