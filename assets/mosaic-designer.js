(() => {
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
// The design frame in pixels: the longer side is 1000, the other follows the mosaic's shape.
let W = 1000, H = 750, N = W * H;
const TILE = 320;           // texture tile size in px
const PATTERN_SCALE = 1.35; // how large the veining reads on the slab

/* ---------------- Storage (best effort) ---------------- */
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

/* ---------------- Material chart ---------------- */
// iMosaicArt color palette (imosaicart.com/pages/color-palette). Stones get their real swatch photo
// and its average color from IMOSAIC_SWATCHES. Glass is left out for now (photos kept in glass/).
const SAMPLE_CHART = [
  { id: 'm01', name: 'Nero Marquina', code: '01', type: 'marble', style: 'veined', base: '#1c1c1e', vein: '#e4e4e4' },
  { id: 'm02', name: 'Bardiglio Gray', code: '02', type: 'marble', style: 'veined', base: '#7d8288', vein: '#4a4f56' },
  { id: 'm03', name: 'Thassos White', code: '03', type: 'marble', style: 'mottled', base: '#f6f6f3', vein: '#dedcd6' },
  { id: 'm04', name: 'Carrara White', code: '04', type: 'marble', style: 'veined', base: '#e8e7e3', vein: '#8e9195' },
  { id: 'm05', name: 'Giallo Siena', code: '05', type: 'marble', style: 'web', base: '#d9b45e', vein: '#a9772f' },
  { id: 'm06', name: 'Rosso Verona', code: '06', type: 'marble', style: 'mottled', base: '#b0533c', vein: '#e2a07e' },
  { id: 'm07', name: 'Giallo Reale', code: '07', type: 'marble', style: 'veined', base: '#d8bf8a', vein: '#b08e55' },
  { id: 'm08', name: 'Rojo Alicante', code: '08', type: 'marble', style: 'web', base: '#9a3b2c', vein: '#d9b9a5' },
  { id: 'm09', name: 'Emperador Dark', code: '09', type: 'marble', style: 'web', base: '#563b2b', vein: '#c9a888' },
  { id: 'm10', name: 'Imperador Red', code: '10', type: 'marble', style: 'web', base: '#7f3a2c', vein: '#c9957a' },
  { id: 'm11', name: 'Crema Marfil', code: '11', type: 'marble', style: 'mottled', base: '#e2d1b1', vein: '#c3a982' },
  { id: 'm12', name: 'Pink Rose', code: '12', type: 'marble', style: 'mottled', base: '#d9a7a0', vein: '#f1d9d3' },
  { id: 'm13', name: 'Lilac', code: '13', type: 'marble', style: 'mottled', base: '#b7a1bf', vein: '#e2d7e6' },
  { id: 'm14', name: 'Perlato Royal', code: '14', type: 'marble', style: 'mottled', base: '#d6c3a2', vein: '#b9a27c' },
  { id: 'm15', name: 'Honey Onyx', code: '15', type: 'marble', style: 'bold', base: '#d39a45', vein: '#f1d08a' },
  { id: 'm16', name: 'Beige Marfil', code: '16', type: 'marble', style: 'mottled', base: '#d8c6a4', vein: '#bba277' },
  { id: 'm17', name: 'Rojo Valencia', code: '17', type: 'marble', style: 'web', base: '#a4513f', vein: '#d8a48c' },
  { id: 'm18', name: 'Trani Beige', code: '18', type: 'marble', style: 'mottled', base: '#cdb894', vein: '#a88e66' },
  { id: 'm19', name: 'Noce', code: '19', type: 'marble', style: 'mottled', base: '#8a6447', vein: '#b78f6c' },
  { id: 'm20', name: 'Amarillo Triana', code: '20', type: 'marble', style: 'mottled', base: '#e1c46a', vein: '#b48b33' },
  { id: 'm21', name: 'Marron Emperador', code: '21', type: 'marble', style: 'web', base: '#6b4a34', vein: '#c4a283' },
  { id: 'm22', name: 'Walnut', code: '22', type: 'marble', style: 'mottled', base: '#6a4a33', vein: '#8f6a4c' },
  { id: 'm23', name: 'Light Taupe', code: '23', type: 'marble', style: 'mottled', base: '#b7a594', vein: '#d4c6b8' },
  { id: 'm24', name: 'Silver Grey', code: '24', type: 'marble', style: 'veined', base: '#b9bcbf', vein: '#8a8e93' },
  { id: 'm25', name: 'Light Beige', code: '25', type: 'marble', style: 'mottled', base: '#e3d6bf', vein: '#c9b69a' },
  { id: 'm26', name: 'Ivory Cream', code: '26', type: 'marble', style: 'mottled', base: '#efe6d2', vein: '#d8c9ab' },
  { id: 'm27', name: 'Snow White', code: '27', type: 'marble', style: 'solid', base: '#fbfbf9', vein: '#ececea' },
  { id: 'm28', name: 'Bianco Thassos', code: '28', type: 'marble', style: 'mottled', base: '#f5f5f2', vein: '#e0e0dc' },
  { id: 'm29', name: 'Bianco Carrara', code: '29', type: 'marble', style: 'veined', base: '#e6e6e2', vein: '#9a9da1' },
  { id: 'm30', name: 'Cloud Grey', code: '30', type: 'marble', style: 'mottled', base: '#c9cbcd', vein: '#a3a7ab' },
  { id: 'm31', name: 'Lavender', code: '31', type: 'marble', style: 'mottled', base: '#a99bc0', vein: '#d8d0e4' },
  { id: 'm32', name: 'Grey Marble', code: '32', type: 'marble', style: 'veined', base: '#8f9397', vein: '#d6d8da' },
  { id: 'm33', name: 'Tundra Grey', code: '33', type: 'marble', style: 'veined', base: '#7f8183', vein: '#c9c9c6' },
  { id: 'm34', name: 'Graphite', code: '34', type: 'marble', style: 'mottled', base: '#4a4c50', vein: '#6d7075' },
  { id: 'm35', name: 'Dark Grey', code: '35', type: 'marble', style: 'mottled', base: '#3a3c40', vein: '#5a5d61' },
  { id: 'm36', name: 'Black Absolute', code: '36', type: 'marble', style: 'solid', base: '#141416', vein: '#26272a' },
  { id: 'm37', name: 'Sahara Verde', code: '37', type: 'marble', style: 'web', base: '#6f8a5a', vein: '#b6c49b' },
  { id: 'm38', name: 'Verde Alpi', code: '38', type: 'marble', style: 'web', base: '#2d4a3c', vein: '#9fb7a6' },
  { id: 'm39', name: 'Verde Oliva', code: '39', type: 'marble', style: 'mottled', base: '#6f7a45', vein: '#a8b07c' },
  { id: 'm40', name: 'Verde Guatemala', code: '40', type: 'marble', style: 'web', base: '#203f35', vein: '#c4d4c9' },
  { id: 'm41', name: 'Verde Aver', code: '41', type: 'marble', style: 'web', base: '#3f5a3c', vein: '#9fb59a' },
  { id: 'm42', name: 'Verde Imperiale', code: '42', type: 'marble', style: 'web', base: '#1f4a3a', vein: '#b9d1c2' },
  { id: 'e43', name: 'Cream', code: '43', type: 'engineered', style: 'mottled', base: '#ece2cc', vein: '#ddd0b4' },
  { id: 'e44', name: 'Ruby Red', code: '44', type: 'engineered', style: 'mottled', base: '#a3192c', vein: '#c43a4b' },
  { id: 'e45', name: 'Sky Blue', code: '45', type: 'engineered', style: 'mottled', base: '#8fc0e0', vein: '#b7d8ee' },
  { id: 'e46', name: 'Ocean Blue', code: '46', type: 'engineered', style: 'mottled', base: '#2d6ea8', vein: '#5a94c7' },
  { id: 'e47', name: 'Turquoise', code: '47', type: 'engineered', style: 'mottled', base: '#2fa7a7', vein: '#7cd0cc' },
  { id: 'e48', name: 'Cobalt Blue', code: '48', type: 'engineered', style: 'mottled', base: '#1e3f9e', vein: '#3d61bd' },
];
for (const m of SAMPLE_CHART) Object.assign(m, (window.IMOSAIC_SWATCHES || {})[m.id]);
const TYPE_LABEL = { marble: 'Marble', engineered: 'Engineered stone', glass: 'Glass' };
const STYLES = {
  engineered: [['mottled', 'Speckled'], ['solid', 'Solid'], ['veined', 'Veined']],
  marble: [['veined', 'Veined'], ['bold', 'Bold veins'], ['web', 'Web / breccia'], ['mottled', 'Mottled'], ['solid', 'Solid']],
  glass: [['cathedral', 'Cathedral (rippled)'], ['opal', 'Opalescent (streaky)'], ['clear', 'Smooth']],
};
let chart = store.get('mosaic.chart.v7') || SAMPLE_CHART.map(m => ({ ...m }));
let chartIsSample = !store.get('mosaic.chart.v7');
const matById = id => chart.find(m => m.id === id);

/* ---------------- Procedural textures ---------------- */
function hash(x, y, s) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, P, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const x0 = ((xi % P) + P) % P, y0 = ((yi % P) + P) % P, x1 = (x0 + 1) % P, y1 = (y0 + 1) % P;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(x0, y0, s), b = hash(x1, y0, s), c = hash(x0, y1, s), d = hash(x1, y1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Tileable fractal noise over the unit square.
function fbm(nx, ny, P, oct, s) {
  let sum = 0, amp = .5, p = P, norm = 0;
  for (let o = 0; o < oct; o++) { sum += amp * vnoise(nx * p, ny * p, p, s + o * 31); norm += amp; amp *= .5; p *= 2; }
  return sum / norm;
}
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const strSeed = s => { let h = 7; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return Math.abs(h) % 9973; };

const tileCache = new Map();
const photoImgs = new Map();
function tileKey(m) { return [m.id, m.type, m.style, m.base, m.vein, m.photo ? m.photo.length + m.photo.slice(-24) : ''].join('|'); }

function makeTile(m) {
  const c = document.createElement('canvas'); c.width = c.height = TILE;
  const ctx = c.getContext('2d');
  if (m.photo) {
    const img = photoImgs.get(m.photo);
    if (img && img.complete && img.naturalWidth) {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, TILE, TILE);
      return c;
    }
  }
  const id = ctx.createImageData(TILE, TILE), d = id.data;
  const [br, bg, bb] = hexRgb(m.base), [vr, vg, vb] = hexRgb(m.vein || m.base);
  const seed = strSeed(m.id + m.base);
  for (let y = 0; y < TILE; y++) {
    const ny = y / TILE;
    for (let x = 0; x < TILE; x++) {
      const nx = x / TILE;
      let shade = 1, t = 0, hi = 0;
      if (m.type === 'marble') {
        const n = fbm(nx, ny, 3, 5, seed);
        shade = 1 + (fbm(nx, ny, 5, 3, seed + 7) - .5) * .14;
        if (m.style === 'veined' || m.style === 'bold') {
          const bold = m.style === 'bold';
          const p1 = 2 * nx + 1 * ny + n * (bold ? 2.4 : 3.2);
          const v1 = Math.pow(1 - Math.abs(Math.sin(Math.PI * p1)), bold ? 5 : 14);
          const n2 = fbm(nx, ny, 4, 4, seed + 99);
          const p2 = 1 * nx - 3 * ny + n2 * 4;
          const v2 = Math.pow(1 - Math.abs(Math.sin(Math.PI * p2)), 26) * .55;
          t = Math.min(1, v1 * (bold ? .95 : .8) + v2);
        } else if (m.style === 'web') {
          const r1 = 1 - Math.abs(2 * fbm(nx, ny, 4, 5, seed + 3) - 1);
          const r2 = 1 - Math.abs(2 * fbm(nx, ny, 8, 3, seed + 17) - 1);
          t = Math.min(1, Math.pow(r1, 16) * .95 + Math.pow(r2, 22) * .5);
        } else if (m.style === 'mottled') {
          t = Math.max(0, (fbm(nx, ny, 6, 5, seed + 5) - .42) * 1.6);
          t += (hash(x, y, seed) - .5) * .08;
        } else {
          shade = 1 + (n - .5) * .05;
        }
      } else { // glass
        const n = fbm(nx, ny, 4, 4, seed);
        if (m.style === 'cathedral') {
          const ripple = Math.sin(Math.PI * 2 * (3 * nx + 2 * ny + n * 2.5));
          shade = .84 + n * .32 + ripple * .06;
          hi = Math.pow(Math.max(0, ripple), 14) * .14;
        } else if (m.style === 'opal') {
          const p = 1 * nx + 2 * ny + fbm(nx, ny, 3, 5, seed + 9) * 3;
          t = Math.pow(1 - Math.abs(Math.sin(Math.PI * p)), 2.5) * .7;
          shade = .95 + n * .1;
        } else {
          shade = .9 + n * .16;
          hi = Math.pow(Math.max(0, 1 - Math.abs(nx - ny - .1) * 6), 3) * .18;
        }
      }
      const i = (y * TILE + x) * 4;
      t = Math.max(0, Math.min(1, t));
      let r = br * shade * (1 - t) + vr * t, g = bg * shade * (1 - t) + vg * t, b = bb * shade * (1 - t) + vb * t;
      r += (255 - r) * hi; g += (255 - g) * hi; b += (255 - b) * hi;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  if (m.type === 'glass' && m.style === 'cathedral') { // seed bubbles
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let k = 0; k < 18; k++) {
      const bx = hash(k, 1, seed) * TILE, by = hash(k, 2, seed) * TILE, r = .6 + hash(k, 3, seed) * 1.4;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
    }
  }
  return c;
}
function getTile(m) {
  const k = tileKey(m);
  let t = tileCache.get(k);
  if (!t) { t = makeTile(m); tileCache.set(k, t); }
  return t;
}
function loadPhoto(src) {
  return new Promise(res => {
    if (photoImgs.has(src)) return res(photoImgs.get(src));
    const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null);
    if (/^(https?:)?\/\//.test(src)) img.crossOrigin = 'anonymous'; // store photos from the theme's CDN stay readable
    img.src = src;
    photoImgs.set(src, img);
  });
}
// Two tabs, Marble (42) and Engineered (6); 'stone' means both and is what color matching uses.
const inTab = (m, f = state.filter) => f === 'stone' ? m.type !== 'glass' : f === 'all' || m.type === f;
const flatView = () => state.look === 'flat' && state.mode !== 'mosaic';
function drawThumb(canvas, m) {
  const ctx = canvas.getContext('2d');
  if (!m) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
  if (flatView()) { ctx.fillStyle = m.base; ctx.fillRect(0, 0, canvas.width, canvas.height); return; }
  const img = m.photo && photoImgs.get(m.photo);
  if (img && img.naturalWidth) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    return;
  }
  ctx.drawImage(getTile(m), 0, 0, TILE * .6, TILE * .6, 0, 0, canvas.width, canvas.height);
}

/* ---------------- Canvases ---------------- */
const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const view = $('#view'), overlay = $('#overlay');
const vctx = view.getContext('2d'), octx = overlay.getContext('2d');
const ink = mk(), ictx = ink.getContext('2d', { willReadFrequently: true });
const fillsLayer = mk(), fctx = fillsLayer.getContext('2d');
const tint = mk(), tctx = tint.getContext('2d');
const maskC = mk(), mctx = maskC.getContext('2d');
const work = mk(), wctx = work.getContext('2d');
const mosaicLayer = mk(), mosctx = mosaicLayer.getContext('2d');

/* ---------------- State ---------------- */
const state = {
  mode: 'color',
  tool: { sketch: 'pen', color: 'fill' },
  weight: 3, gap: 2, joint: '#8a8782',
  selected: 'm04', filter: 'marble', query: '',
  sizeW: 36, sizeH: 27, unit: 'in', // finished size of the mosaic
  look: 'stone', // how the Color step shows materials: stone textures or plain colors
  tileIn: 0.5,   // mosaic tile size in inches
  mosaicFrom: 'picture',
  sourceKind: 'color', // what the last upload was: bw, color or mosaic // with an uploaded picture: tile it directly, or tile the colored areas
  fills: [], // immutable entries: { x, y, mat, rot }
};
let inkVer = 0;
const frameFor = (w, h) => { const r = Math.max(.25, Math.min(4, h / w)); return r <= 1 ? [1000, Math.round(1000 * r)] : [Math.round(1000 / r), 1000]; };
// Changes the frame to a new shape, keeping the drawing and its colors centered and in proportion.
function resizeFrame(newW, newH) {
  if (newW === W && newH === H) return;
  if (typeof sel !== 'undefined' && sel) finishSel(true);
  const old = mk(); old.getContext('2d').drawImage(ink, 0, 0);
  const oW = W, oH = H, s = Math.min(newW / oW, newH / oH), ox = (newW - oW * s) / 2, oy = (newH - oH * s) / 2;
  W = newW; H = newH; N = W * H; stack = new Int32Array(N);
  for (const c of [ink, fillsLayer, tint, maskC, work, mosaicLayer, view, overlay]) { c.width = W; c.height = H; }
  ictx.drawImage(old, ox, oy, oW * s, oH * s);
  state.fills = state.fills.map(f => ({ ...f, x: Math.min(W - 1, Math.round(ox + f.x * s)), y: Math.min(H - 1, Math.round(oy + f.y * s)) }));
  if (importedImg && sourceData) { const m = sourceData.mosaic, ph = sourceData.photo; sourceData = drawImported(); sourceData.mosaic = m; sourceData.photo = ph; }
  currentInk = ictx.getImageData(0, 0, W, H); inkVer++;
  history.length = 0; future.length = 0; // earlier steps belong to the old shape
  fitSlab();
}
function fitSlab() {
  const slab = $('#slab');
  slab.style.aspectRatio = `${W} / ${H}`;
  slab.style.width = `min(100%, calc(70vh * ${W / H}))`;
  slab.style.marginInline = 'auto';
}

/* ---------------- Region detection ---------------- */
// Every closed area of the sketch gets a label; a fill points at its area through a seed point.
let barrier = null, barrierKey = '';
function dilate(src, r, w = W, h = H) {
  if (r <= 0) return src;
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h);
  const pre = new Int32Array(Math.max(w, h) + 1);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + src[o + x];
    for (let x = 0; x < w; x++) tmp[o + x] = pre[Math.min(w, x + r + 1)] - pre[Math.max(0, x - r)] > 0 ? 1 : 0;
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) pre[y + 1] = pre[y] + tmp[y * w + x];
    for (let y = 0; y < h; y++) out[y * w + x] = pre[Math.min(h, y + r + 1)] - pre[Math.max(0, y - r)] > 0 ? 1 : 0;
  }
  return out;
}
function getBarrier() {
  const key = inkVer + '|' + state.gap;
  if (barrier && barrierKey === key) return barrier;
  const d = ictx.getImageData(0, 0, W, H).data;
  const b = new Uint8Array(N);
  for (let i = 0; i < N; i++) b[i] = d[i * 4 + 3] > 100 ? 1 : 0;
  barrier = dilate(b, state.gap); barrierKey = key;
  return barrier;
}
let stack = new Int32Array(N);
let labels = null, labelKey = '', regions = [null]; // regions[L] = { area, x0, y0, x1, y1, seed }
function getLabels() {
  const key = inkVer + '|' + state.gap;
  if (labels && labelKey === key) return labels;
  const b = getBarrier(), lab = new Int32Array(N);
  regions = [null];
  for (let s = 0; s < N; s++) {
    if (b[s] || lab[s]) continue;
    const L = regions.length;
    let sp = 0, area = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    stack[sp++] = s; lab[s] = L;
    while (sp) {
      const p = stack[--sp], px = p % W, py = (p - px) / W;
      area++;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      if (px > 0 && !lab[p - 1] && !b[p - 1]) { lab[p - 1] = L; stack[sp++] = p - 1; }
      if (px < W - 1 && !lab[p + 1] && !b[p + 1]) { lab[p + 1] = L; stack[sp++] = p + 1; }
      if (p >= W && !lab[p - W] && !b[p - W]) { lab[p - W] = L; stack[sp++] = p - W; }
      if (p < N - W && !lab[p + W] && !b[p + W]) { lab[p + W] = L; stack[sp++] = p + W; }
    }
    regions.push({ area, x0, y0, x1, y1, seed: s });
  }
  labels = lab; labelKey = key;
  return labels;
}
const labelOf = f => getLabels()[f.y * W + f.x];
function fillAt(idx) {
  const L = getLabels()[idx];
  if (!L) return -1;
  for (let i = state.fills.length - 1; i >= 0; i--) if (labelOf(state.fills[i]) === L) return i;
  return -1;
}
// Draws the alpha mask of area L, grown by pad px, into maskC and returns where it sits.
function maskRegion(L, pad) {
  const r = regions[L], lab = getLabels();
  const x = Math.max(0, r.x0 - pad), y = Math.max(0, r.y0 - pad);
  const w = Math.min(W, r.x1 + pad + 1) - x, h = Math.min(H, r.y1 + pad + 1) - y;
  let m = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) { const o = (y + j) * W + x; for (let i = 0; i < w; i++) m[j * w + i] = lab[o + i] === L ? 1 : 0; }
  m = dilate(m, pad, w, h);
  maskC.width = w; maskC.height = h;
  const id = mctx.createImageData(w, h);
  for (let i = 0, k = 3; i < w * h; i++, k += 4) id.data[k] = m[i] ? 255 : 0;
  mctx.putImageData(id, 0, 0);
  return { x, y, w, h };
}
const tilePx = () => state.tileIn * W / (state.unit === 'in' ? state.sizeW : state.sizeW / 2.54);
// Tiles laid in area L: every grid cell that any of five sample points falls in.
function tileCount(L) {
  const r = regions[L], t = Math.max(4, tilePx()), lab = getLabels();
  let n = 0;
  for (let ty = Math.floor(r.y0 / t); ty * t <= r.y1; ty++) for (let tx = Math.floor(r.x0 / t); tx * t <= r.x1; tx++) {
    for (const [fx, fy] of [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]]) {
      const px = Math.floor((tx + fx) * t), py = Math.floor((ty + fy) * t);
      if (px < W && py < H && lab[py * W + px] === L) { n++; break; }
    }
  }
  return n;
}

/* ---------------- Color matching ---------------- */
function srgbToLab(r, g, b) {
  const f = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
  const R = f(r), G = f(g), B = f(b);
  const t = v => v > .008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;
  const X = t((R * .4124 + G * .3576 + B * .1805) / .95047), Y = t(R * .2126 + G * .7152 + B * .0722), Z = t((R * .0193 + G * .1192 + B * .9505) / 1.08883);
  return [116 * Y - 16, 500 * (X - Y), 200 * (Y - Z)];
}
function labToSrgb(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const t = v => v ** 3 > .008856 ? v ** 3 : (v - 16 / 116) / 7.787;
  const X = t(fx) * .95047, Y = t(fy), Z = t(fz) * 1.08883;
  const g = c => { c = c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055; return Math.max(0, Math.min(255, Math.round(c * 255))); };
  return [g(X * 3.2406 - Y * 1.5372 - Z * .4986), g(-X * .9689 + Y * 1.8758 + Z * .0415), g(X * .0557 - Y * .2040 + Z * 1.0570)];
}
const labCache = new Map();
const matLab = m => { let v = labCache.get(m.base); if (!v) { v = srgbToLab(...hexRgb(m.base)); labCache.set(m.base, v); } return v; };
function nearestMat(lab, list) {
  let best = null, bd = Infinity;
  for (const m of list) { const q = matLab(m), d = (q[0] - lab[0]) ** 2 + (q[1] - lab[1]) ** 2 + (q[2] - lab[2]) ** 2; if (d < bd) { bd = d; best = m; } }
  return best;
}
// Colors are matched against all 48 stones, whichever tab is open.
const matchList = () => {
  const l = chart.filter(m => inTab(m, 'stone') && (m.type !== 'glass' || m.code));
  return l.length ? l : chart;
};

/* ---------------- Rendering ---------------- */
// One of our own mosaics ("Change the colors"): the customer sees the real piece, and an area given
// another stone is recolored in place, so its tiles, cuts and grout stay exactly as they are.
// After "Remove all colors and repaint" the customer paints the outline as usual, and the Mosaic
// step shows the real piece again with their stones (sourceData.photo === 'final').
const photoLook = () => !!(sourceData && sourceData.photo === true);
const photoFinal = () => !!(sourceData && sourceData.photo);
function renderPhotoFills(ctx = fctx) {
  const lab = getLabels(), src = sourceData.data, n = regions.length;
  const want = new Int32Array(n).fill(-1), mats = [];
  for (const f of state.fills) {
    const L = labelOf(f); if (!L || f.orig === f.mat) continue;
    const m = matById(f.mat); if (!m) continue;
    let k = mats.indexOf(m); if (k < 0) { mats.push(m); k = mats.length - 1; }
    want[L] = k;
  }
  // the lines between areas belong to the nearest area, so no seam of the old color is left
  const own = new Int32Array(N);
  for (let p = 0; p < N; p++) {
    let L = lab[p];
    if (!L) { const x = p % W; for (let r = 1; r <= 4 && !L; r++) L = (x >= r && lab[p - r]) || (x + r < W && lab[p + r]) || (p >= r * W && lab[p - r * W]) || (p + r * W < N && lab[p + r * W]) || 0; }
    own[p] = L;
  }
  // each recolored area's own average color (in Lab), from the pixels close to it
  const sum = new Float64Array(n * 4), pl = new Float32Array(N * 3);
  for (let p = 0; p < N; p++) {
    const L = own[p]; if (!L || want[L] < 0) continue;
    const v = srgbToLab(src[p * 4], src[p * 4 + 1], src[p * 4 + 2]);
    pl[p * 3] = v[0]; pl[p * 3 + 1] = v[1]; pl[p * 3 + 2] = v[2];
    sum[L * 4] += v[0]; sum[L * 4 + 1] += v[1]; sum[L * 4 + 2] += v[2]; sum[L * 4 + 3]++;
  }
  const out = new ImageData(new Uint8ClampedArray(src), W, H), o = out.data;
  for (let p = 0; p < N; p++) {
    const L = own[p]; if (!L || want[L] < 0) continue;
    const c = sum[L * 4 + 3], mL = sum[L * 4] / c, ma = sum[L * 4 + 1] / c, mb = sum[L * 4 + 2] / c;
    const t = matLab(mats[want[L]]);
    const l = pl[p * 3], a = pl[p * 3 + 1], b = pl[p * 3 + 2];
    // grout and shadows (far from the area's color) keep most of their look
    const d2 = (l - mL) ** 2 + (a - ma) ** 2 + (b - mb) ** 2, w = Math.exp(-d2 / 900);
    const rgb = labToSrgb(l + (t[0] - mL) * (.35 + .65 * w), a + (t[1] - ma) * w, b + (t[2] - mb) * w);
    o[p * 4] = rgb[0]; o[p * 4 + 1] = rgb[1]; o[p * 4 + 2] = rgb[2];
  }
  ctx.putImageData(out, 0, 0);
}
function renderFills() {
  fctx.clearRect(0, 0, W, H);
  if (photoLook()) return renderPhotoFills();
  getLabels();
  for (const f of state.fills) {
    const m = matById(f.mat), L = labelOf(f);
    if (!m || !L) continue;
    if (state.look === 'flat') {
      const { x, y, w, h } = maskRegion(L, state.gap + 1); // tuck the fill under the line
      work.width = w; work.height = h;
      wctx.fillStyle = m.base; wctx.fillRect(0, 0, w, h);
      wctx.globalCompositeOperation = 'destination-in'; wctx.drawImage(maskC, 0, 0); wctx.globalCompositeOperation = 'source-over';
      fctx.drawImage(work, x, y);
    } else tileArea(fctx, f, m, L, state.gap + 1, state.joint); // the area as mosaic tiles cut from the swatch photo
  }
}
// Lays every colored area with square tiles of its stone, each showing a different part of the
// stone and cut off where the area ends; the lines and the gaps between tiles show as grout.
// Fills one mosaic tile with its stone: for a stone with a swatch photo, a random small piece of
// that photo (about one swatch tile across); otherwise the generated texture.
function paintTile(ctx, m, pat, rx, ry, sz, tx, ty, seed) {
  tilePath(ctx, rx, ry, sz, tx, ty, seed);
  const img = m.photo && photoImgs.get(m.photo);
  if (img && img.naturalWidth) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    let cs, sx, sy;
    if (m.type === 'glass') {
      // glass photos show a 2x2 block: take the middle of one of the four pieces
      cs = side * .26;
      const q = Math.floor(hash(tx, ty, seed + 2) * 4), qx = q % 2 ? .75 : .25, qy = q > 1 ? .75 : .25;
      sx = (img.naturalWidth - side) / 2 + side * qx - cs / 2; sy = (img.naturalHeight - side) / 2 + side * qy - cs / 2;
    } else {
      cs = side / 9;
      sx = (img.naturalWidth - side) / 2 + hash(tx, ty, seed + 2) * (side - cs); sy = (img.naturalHeight - side) / 2 + hash(tx, ty, seed + 3) * (side - cs);
    }
    ctx.save(); ctx.clip(); ctx.drawImage(img, sx, sy, cs, cs, rx - sz * .1, ry - sz * .1, sz * 1.2, sz * 1.2); ctx.restore();
  } else {
    pat.setTransform(new DOMMatrix().translate(rx - hash(tx, ty, seed + 2) * TILE, ry - hash(tx, ty, seed + 3) * TILE).scale(PATTERN_SCALE * .8));
    ctx.fillStyle = pat; ctx.fill();
  }
}
// A hand-cut tile: a square whose corners are nudged a little, so no two tiles are identical.
function tilePath(ctx, x0, y0, sz, tx, ty, seed) {
  const j = sz * .09, c = k => (hash(tx * 8 + k, ty, seed) - .5) * 2 * j;
  ctx.beginPath();
  ctx.moveTo(x0 + c(0), y0 + c(1)); ctx.lineTo(x0 + sz + c(2), y0 + c(3));
  ctx.lineTo(x0 + sz + c(4), y0 + sz + c(5)); ctx.lineTo(x0 + c(6), y0 + sz + c(7));
  ctx.closePath();
}
let sourceData = null;        // the uploaded picture on the slab, as pixels
let sourceRect = { x: 0, y: 0, w: W, h: H }; // where the picture sits on the slab
let pictureCounts = new Map(); // material id -> tiles, from the last picture mosaic
const usePicture = () => !!sourceData && state.mosaicFrom === 'picture';
// Tiles the whole picture: each tile gets the chart stone closest to the picture under it. The
// color error is carried to the neighboring tiles, so gradients like skin and sky read smoothly.
function renderPictureMosaic() {
  const t = Math.max(4, tilePx()), gap = Math.max(1, t * .12), d = sourceData.data, list = matchList();
  const R = sourceRect, inside = (tx, ty) => { const cx = (tx + .5) * t, cy = (ty + .5) * t; return cx >= R.x && cx < R.x + R.w && cy >= R.y && cy < R.y + R.h; };
  mosctx.fillStyle = '#ffffff'; mosctx.fillRect(0, 0, W, H);
  const gx0 = Math.floor(R.x / t + .5) * t, gy0 = Math.floor(R.y / t + .5) * t;
  mosctx.fillStyle = state.joint; mosctx.fillRect(gx0, gy0, Math.min(W, Math.ceil((R.x + R.w) / t - .5) * t) - gx0, Math.min(H, Math.ceil((R.y + R.h) / t - .5) * t) - gy0);
  const cols = Math.ceil(W / t), rows = Math.ceil(H / t), avg = new Float32Array(cols * rows * 3);
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    let r = 0, g = 0, b = 0, n = 0;
    const step = Math.max(1, Math.floor(t / 4)), rs = [], gs = [], bs = [];
    for (let y = Math.floor(ty * t); y < Math.min(H, (ty + 1) * t); y += step) for (let x = Math.floor(tx * t); x < Math.min(W, (tx + 1) * t); x += step) {
      const i = (y * W + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      if (sourceData.mosaic) { rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]); }
    }
    const k = (ty * cols + tx) * 3;
    if (sourceData.mosaic && n) { // a photo of a mosaic: the median ignores its grout lines
      const med = a => a.sort((p, q) => p - q)[a.length >> 1];
      avg[k] = med(rs); avg[k + 1] = med(gs); avg[k + 2] = med(bs);
    } else { avg[k] = r / n; avg[k + 1] = g / n; avg[k + 2] = b / n; }
  }
  // carry part of each tile's color error to its neighbors so photos blend; a mosaic photo is already
  // in tiles, so each tile simply takes its closest stone
  const blend = sourceData.mosaic ? 0 : .5;
  const cache = new Map(), pats = new Map(), rgbOf = new Map();
  pictureCounts = new Map();
  for (let ty = 0; ty < rows; ty++) for (let tx = 0; tx < cols; tx++) {
    if (!inside(tx, ty)) continue;
    const k = (ty * cols + tx) * 3;
    const r = Math.max(0, Math.min(255, avg[k])), g = Math.max(0, Math.min(255, avg[k + 1])), b = Math.max(0, Math.min(255, avg[k + 2]));
    const key = (r >> 2) << 12 | (g >> 2) << 6 | (b >> 2);
    let m = cache.get(key);
    if (!m) { m = nearestMat(srgbToLab(r, g, b), list); cache.set(key, m); }
    let base = rgbOf.get(m.id); if (!base) { base = hexRgb(m.base); rgbOf.set(m.id, base); }
    const spread = (dx, dy, w) => { const x = tx + dx, y = ty + dy; if (x < 0 || x >= cols || y >= rows) return; const q = (y * cols + x) * 3; for (let c = 0; c < 3; c++) avg[q + c] += ([r, g, b][c] - base[c]) * w * blend; };
    spread(1, 0, 7 / 16); spread(-1, 1, 3 / 16); spread(0, 1, 5 / 16); spread(1, 1, 1 / 16);
    let pat = pats.get(m.id); if (!pat) { pat = mosctx.createPattern(getTile(m), 'repeat'); pats.set(m.id, pat); }
    const rx = tx * t + gap / 2, ry = ty * t + gap / 2, sz = t - gap;
    paintTile(mosctx, m, pat, rx, ry, sz, tx, ty, 5);
    tilePath(mosctx, rx, ry, sz, tx, ty, 5);
    const v = (hash(tx, ty, 13) - .5) * .14;
    mosctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; mosctx.fill();
    pictureCounts.set(m.id, (pictureCounts.get(m.id) || 0) + 1);
  }
}
function renderMosaic() {
  if (usePicture()) return renderPictureMosaic();
  if (photoLook()) { mosctx.drawImage(fillsLayer, 0, 0); return; }
  if (photoFinal()) return renderPhotoFills(mosctx);
  mosctx.fillStyle = state.joint; mosctx.fillRect(0, 0, W, H);
  getLabels();
  for (const f of state.fills) {
    const m = matById(f.mat), L = labelOf(f);
    if (m && L) tileArea(mosctx, f, m, L, state.gap, null);
  }
}
// Lays area L with tiles of stone m at the chosen tile size and draws it onto ctx; with grout set,
// the gaps between tiles are painted in that color (the final mosaic paints its grout underneath).
function tileArea(ctx, f, m, L, pad, grout) {
  const t = Math.max(4, tilePx()), gap = Math.max(1, t * .1);
  {
    const { x, y, w, h } = maskRegion(L, pad);
    work.width = w; work.height = h;
    if (grout) { wctx.fillStyle = grout; wctx.fillRect(0, 0, w, h); }
    const pat = wctx.createPattern(getTile(m), 'repeat'), seed = L * 7919;
    for (let ty = Math.floor(y / t); ty * t < y + h; ty++) for (let tx = Math.floor(x / t); tx * t < x + w; tx++) {
      const jx = (hash(tx, ty, seed) - .5) * gap, jy = (hash(ty, tx, seed + 1) - .5) * gap;
      const rx = tx * t + gap / 2 + jx - x, ry = ty * t + gap / 2 + jy - y, sz = t - gap;
      paintTile(wctx, m, pat, rx, ry, sz, tx, ty, seed);
      tilePath(wctx, rx, ry, sz, tx, ty, seed);
      const v = (hash(tx, ty, seed + 4) - .5) * .16;
      wctx.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
      wctx.fill();
    }
    wctx.globalCompositeOperation = 'destination-in'; wctx.drawImage(maskC, 0, 0); wctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(work, x, y);
  }
}
function composite(target = vctx, mode = state.mode) {
  if (mode === 'mosaic') { target.drawImage(mosaicLayer, 0, 0); return; }
  target.fillStyle = '#ffffff';
  target.fillRect(0, 0, W, H);
  target.globalAlpha = mode === 'sketch' ? .3 : 1;
  target.drawImage(fillsLayer, 0, 0);
  target.globalAlpha = 1;
  if (mode === 'sketch') {
    if (target === vctx && pendingImg) { // a picked picture, shown until the customer chooses what to do with it
      const s = Math.min(W / pendingImg.naturalWidth, H / pendingImg.naturalHeight), w = pendingImg.naturalWidth * s, h = pendingImg.naturalHeight * s;
      target.drawImage(pendingImg, (W - w) / 2, (H - h) / 2, w, h); return;
    }
    if (target === vctx) drawTrace(target); target.drawImage(ink, 0, 0); return;
  }
  if (photoLook()) return;
  tctx.globalCompositeOperation = 'source-over';
  tctx.clearRect(0, 0, W, H);
  tctx.drawImage(ink, 0, 0);
  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = state.joint; tctx.fillRect(0, 0, W, H);
  tctx.globalCompositeOperation = 'source-over';
  target.drawImage(tint, 0, 0);
}
function busy(on) { $('#busy').hidden = !on; }
function refresh({ fills = true } = {}) {
  if (fills) renderFills();
  if (state.mode === 'mosaic') renderMosaic();
  composite();
  renderBom();
  updateHistoryButtons();
  scheduleSave();
}
// Heavy work (flood fills) runs after a paint so the "Cutting…" badge shows.
function heavy(fn) { busy(true); requestAnimationFrame(() => setTimeout(() => { try { fn(); } finally { busy(false); } }, 0)); }

/* ---------------- History ---------------- */
const history = [], future = [];
let currentInk = null;
function snapshot() { return { ink: currentInk, fills: state.fills.slice() }; }
function commit(inkChanged) {
  history.push(snapshot());
  if (history.length > 30) history.shift();
  future.length = 0;
  if (inkChanged) { currentInk = ictx.getImageData(0, 0, W, H); inkVer++; }
}
function restore(s) {
  if (s.ink !== currentInk) {
    currentInk = s.ink;
    if (s.ink) ictx.putImageData(s.ink, 0, 0); else ictx.clearRect(0, 0, W, H);
    inkVer++;
  }
  state.fills = s.fills.slice();
  heavy(() => refresh());
}
function undo() { if (sel) { cancelSel(); return; } if (!history.length) return; future.push(snapshot()); restore(history.pop()); }
function redo() { if (sel) cancelSel(); if (!future.length) return; history.push(snapshot()); restore(future.pop()); }
function updateHistoryButtons() { $('#undo').disabled = !history.length; $('#redo').disabled = !future.length; }

/* ---------------- Drawing ---------------- */
// Zoom and pan: the canvases sit in #slab-inner, scaled and moved with a CSS transform. pos() reads
// the transformed box, so pointer math stays in design pixels at any zoom.
const view_ = { z: 1, x: 0, y: 0 };
function applyView() {
  const r = $('#slab').getBoundingClientRect();
  view_.z = Math.max(1, Math.min(8, view_.z));
  view_.x = Math.min(0, Math.max(r.width - r.width * view_.z, view_.x));
  view_.y = Math.min(0, Math.max(r.height - r.height * view_.z, view_.y));
  $('#slab-inner').style.transform = `translate(${view_.x}px, ${view_.y}px) scale(${view_.z})`;
  $('#zoom-fit').textContent = Math.round(view_.z * 100) + '%';
}
function zoomAt(factor, cx, cy) {
  const r = $('#slab').getBoundingClientRect();
  if (cx == null) { cx = r.width / 2; cy = r.height / 2; }
  const z = Math.max(1, Math.min(8, view_.z * factor));
  view_.x = cx - (cx - view_.x) * z / view_.z; view_.y = cy - (cy - view_.y) * z / view_.z; view_.z = z;
  applyView(); drawOverlay();
}
$('#zoom-in').addEventListener('click', () => zoomAt(1.5));
$('#zoom-out').addEventListener('click', () => zoomAt(1 / 1.5));
$('#zoom-fit').addEventListener('click', () => { view_.z = 1; view_.x = view_.y = 0; applyView(); drawOverlay(); });
$('#slab').addEventListener('wheel', e => {
  if (!e.ctrlKey && !e.metaKey && view_.z === 1) return; // plain scrolling keeps scrolling the page until zoomed in
  e.preventDefault();
  const r = $('#slab').getBoundingClientRect();
  if (e.ctrlKey || e.metaKey) zoomAt(Math.exp(-e.deltaY * .0025), e.clientX - r.left, e.clientY - r.top);
  else { view_.x -= e.deltaX; view_.y -= e.deltaY; applyView(); }
}, { passive: false });
window.addEventListener('resize', applyView);

function pos(e, clamp = true) {
  const r = overlay.getBoundingClientRect();
  const x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  return clamp ? { x: Math.max(0, Math.min(W - 1, x)), y: Math.max(0, Math.min(H - 1, y)) } : { x, y };
}
// Snap a point to the grid, or to the center lines when close.
function snap(p) {
  if (!$('#snap').checked) return p;
  let { x, y } = p;
  const g = +$('#grid').value;
  if (g) { x = Math.round(x / g) * g; y = Math.round(y / g) * g; }
  if (Math.abs(x - W / 2) < 8) x = W / 2;
  if (Math.abs(y - H / 2) < 8) y = H / 2;
  return { x, y };
}
// Symmetry: every stroke is repeated around the center, turned and mirrored like a kaleidoscope.
function symMatrices() {
  const k = +$('#symmetry').value, out = [];
  if (!k) return [new DOMMatrix()];
  for (let i = 0; i < k; i++) for (const flip of [1, -1]) {
    out.push(new DOMMatrix().translate(W / 2, H / 2).rotate(360 * i / k).scale(flip, 1).translate(-W / 2, -H / 2));
  }
  return out;
}
function withSym(ctx, draw) {
  for (const m of symMatrices()) { ctx.save(); ctx.setTransform(m); draw(); ctx.restore(); }
}
function strokeStyle(ctx, eraser) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = eraser ? state.weight * 4 + 6 : state.weight;
  ctx.strokeStyle = '#000';
  ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
}
// Outline of a shape tool between two corners of its box.
function shapePath(ctx, tool, a, b, shift) {
  let { x: x2, y: y2 } = b;
  const dx = x2 - a.x, dy = y2 - a.y;
  ctx.beginPath();
  if (tool === 'line') {
    if (shift) {
      const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.hypot(dx, dy);
      x2 = a.x + Math.cos(ang) * len; y2 = a.y + Math.sin(ang) * len;
    }
    ctx.moveTo(a.x, a.y); ctx.lineTo(x2, y2);
    return;
  }
  let w = dx, h = dy;
  if (shift || tool === 'polygon' || tool === 'star') { const s = Math.max(Math.abs(w), Math.abs(h)); w = Math.sign(w || 1) * s; h = Math.sign(h || 1) * s; }
  const cx = a.x + w / 2, cy = a.y + h / 2, rx = Math.abs(w / 2), ry = Math.abs(h / 2), n = +$('#sides').value;
  if (tool === 'rect') ctx.rect(a.x, a.y, w, h);
  else if (tool === 'ellipse') ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  else if (tool === 'polygon' || tool === 'star') {
    const pts = tool === 'star' ? n * 2 : n;
    for (let i = 0; i < pts; i++) {
      const ang = -Math.PI / 2 + i * 2 * Math.PI / pts, r = tool === 'star' && i % 2 ? .45 : 1;
      const px = cx + Math.cos(ang) * rx * r, py = cy + Math.sin(ang) * ry * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  } else if (tool === 'heart') {
    const x0 = Math.min(a.x, a.x + w), y0 = Math.min(a.y, a.y + h), W2 = Math.abs(w), H2 = Math.abs(h);
    ctx.moveTo(x0 + W2 / 2, y0 + H2 * .28);
    ctx.bezierCurveTo(x0 + W2 / 2, y0, x0, y0, x0, y0 + H2 * .32);
    ctx.bezierCurveTo(x0, y0 + H2 * .62, x0 + W2 / 2, y0 + H2 * .78, x0 + W2 / 2, y0 + H2);
    ctx.bezierCurveTo(x0 + W2 / 2, y0 + H2 * .78, x0 + W2, y0 + H2 * .62, x0 + W2, y0 + H2 * .32);
    ctx.bezierCurveTo(x0 + W2, y0, x0 + W2 / 2, y0, x0 + W2 / 2, y0 + H2 * .28);
    ctx.closePath();
  }
}
const SHAPES = ['line', 'rect', 'ellipse', 'polygon', 'star', 'heart'];

// A floating selection: lifted (or pasted) pixels with a center, scale, flip and rotation. It is
// stamped onto the drawing when finished, so it can be moved and transformed freely until then.
let sel = null, clip = null;
function selMatrix(s = sel) {
  return new DOMMatrix().translate(s.cx, s.cy).rotate(s.rot).scale(s.sx, s.sy).translate(-s.img.width / 2, -s.img.height / 2);
}
function selCorners() {
  const m = selMatrix(), w = sel.img.width, h = sel.img.height;
  return [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => m.transformPoint(new DOMPoint(x, y)));
}
function selRotHandle() {
  const [a, b] = selCorners(), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = (b.y - a.y) / len, ny = -(b.x - a.x) / len;
  const flip = sel.sy < 0 ? -1 : 1, d = 28 / view_.z;
  return { x: mx + nx * d * flip, y: my + ny * d * flip };
}
function selHit(p) {
  if (!sel) return null;
  const hs = 12 / view_.z, rh = selRotHandle();
  if (Math.hypot(p.x - rh.x, p.y - rh.y) < hs) return 'rotate';
  if (selCorners().some(c => Math.hypot(p.x - c.x, p.y - c.y) < hs)) return 'scale';
  const q = selMatrix().inverse().transformPoint(new DOMPoint(p.x, p.y));
  return q.x >= 0 && q.y >= 0 && q.x <= sel.img.width && q.y <= sel.img.height ? 'move' : null;
}
function liftRect(a, b) {
  const x = Math.floor(Math.min(a.x, b.x)), y = Math.floor(Math.min(a.y, b.y));
  const w = Math.ceil(Math.abs(b.x - a.x)), h = Math.ceil(Math.abs(b.y - a.y));
  if (w < 3 || h < 3) return;
  const img = document.createElement('canvas'); img.width = w; img.height = h;
  img.getContext('2d').drawImage(ink, x, y, w, h, 0, 0, w, h);
  ictx.clearRect(x, y, w, h);
  sel = { img, cx: x + w / 2, cy: y + h / 2, sx: 1, sy: 1, rot: 0 };
  showSelActions(); composite(); drawOverlay();
}
function floatCanvas(img, cx = W / 2, cy = H / 2) {
  sel = { img, cx, cy, sx: 1, sy: 1, rot: 0 };
  showSelActions(); composite(); drawOverlay();
}
function finishSel(keep = true) {
  if (!sel) return;
  if (keep) { ictx.save(); ictx.setTransform(selMatrix()); ictx.drawImage(sel.img, 0, 0); ictx.restore(); }
  sel = null; showSelActions(); drawOverlay();
  commit(true); refresh();
}
function cancelSel() { // put the lifted pixels back
  if (!sel) return;
  sel = null; if (currentInk) ictx.putImageData(currentInk, 0, 0); else ictx.clearRect(0, 0, W, H);
  showSelActions(); composite(); drawOverlay();
}
function showSelActions() { $('#sel-actions').hidden = !sel; }
$$('#sel-actions [data-sel]').forEach(b => b.addEventListener('click', () => {
  if (!sel) return;
  const a = b.dataset.sel;
  if (a === 'flipx') sel.sx *= -1;
  else if (a === 'flipy') sel.sy *= -1;
  else if (a === 'rot') sel.rot = (sel.rot + 90) % 360;
  else if (a === 'dup') { // stamp a copy where it is and keep moving the other one
    ictx.save(); ictx.setTransform(selMatrix()); ictx.drawImage(sel.img, 0, 0); ictx.restore();
    sel.cx += 24; sel.cy += 24;
  } else if (a === 'del') { finishSel(false); return; }
  else if (a === 'done') { finishSel(true); return; }
  composite(); drawOverlay();
}));
function selectionImage() { // the selection as it currently looks, for copying
  const c = document.createElement('canvas'); c.width = sel.img.width; c.height = sel.img.height;
  c.getContext('2d').drawImage(sel.img, 0, 0); return c;
}
function textCanvas() {
  const txt = $('#text-input').value.trim();
  if (!txt) { toast('Type the text first.'); return null; }
  const size = Math.max(20, Math.min(400, +$('#text-size').value || 120));
  const font = $('#text-font').value.replace('{s}', size);
  const m = document.createElement('canvas').getContext('2d'); m.font = font;
  const pad = state.weight * 2 + 6, c = document.createElement('canvas');
  c.width = Math.ceil(m.measureText(txt).width + pad * 2); c.height = Math.ceil(size * 1.25 + pad * 2);
  const x = c.getContext('2d');
  x.font = font; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = state.weight; x.strokeStyle = '#000';
  x.strokeText(txt, pad, c.height / 2);
  return c;
}

// Overlay: grid, symmetry guides, previews and the selection frame, redrawn on every change.
let preview = null, pathPts = null;
function drawOverlay(hover) {
  octx.setTransform(1, 0, 0, 1, 0, 0);
  octx.clearRect(0, 0, W, H);
  if (state.mode !== 'sketch') return;
  const lw = 1 / view_.z, g = +$('#grid').value;
  if (g) {
    octx.strokeStyle = 'rgba(43,123,232,.18)'; octx.lineWidth = lw; octx.beginPath();
    for (let x = g; x < W; x += g) { octx.moveTo(x, 0); octx.lineTo(x, H); }
    for (let y = g; y < H; y += g) { octx.moveTo(0, y); octx.lineTo(W, y); }
    octx.stroke();
  }
  const k = +$('#symmetry').value;
  if (k) {
    octx.strokeStyle = 'rgba(43,123,232,.45)'; octx.lineWidth = lw; octx.setLineDash([6 / view_.z, 6 / view_.z]); octx.beginPath();
    for (let i = 0; i < k; i++) { // mirror axes through the center
      const ang = Math.PI / 2 + Math.PI * i / k, r = W;
      octx.moveTo(W / 2 - Math.cos(ang) * r, H / 2 - Math.sin(ang) * r); octx.lineTo(W / 2 + Math.cos(ang) * r, H / 2 + Math.sin(ang) * r);
    }
    octx.stroke(); octx.setLineDash([]);
  }
  if (preview) {
    strokeStyle(octx, false); octx.strokeStyle = '#2B7BE8';
    withSym(octx, () => { shapePath(octx, preview.tool, preview.a, preview.b, preview.shift); octx.stroke(); });
  }
  if (pathPts) {
    strokeStyle(octx, false); octx.strokeStyle = '#2B7BE8';
    const pts = hover ? [...pathPts, hover] : pathPts;
    withSym(octx, () => { octx.beginPath(); pts.forEach((p, i) => i ? octx.lineTo(p.x, p.y) : octx.moveTo(p.x, p.y)); octx.stroke(); });
    octx.fillStyle = '#2B7BE8'; octx.beginPath(); octx.arc(pathPts[0].x, pathPts[0].y, 6 / view_.z, 0, 7); octx.fill();
  }
  if (drag?.marquee) {
    const { a, b } = drag.marquee;
    octx.strokeStyle = '#2B7BE8'; octx.lineWidth = lw; octx.setLineDash([5 / view_.z, 4 / view_.z]);
    octx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y); octx.setLineDash([]);
  }
  if (sel) {
    octx.save(); octx.setTransform(selMatrix()); octx.drawImage(sel.img, 0, 0); octx.restore();
    const c = selCorners(), rh = selRotHandle(), hs = 5 / view_.z;
    octx.strokeStyle = '#2B7BE8'; octx.lineWidth = 1.5 * lw; octx.setLineDash([5 / view_.z, 4 / view_.z]);
    octx.beginPath(); c.forEach((p, i) => i ? octx.lineTo(p.x, p.y) : octx.moveTo(p.x, p.y)); octx.closePath(); octx.stroke(); octx.setLineDash([]);
    octx.fillStyle = '#fff';
    for (const p of c) { octx.fillRect(p.x - hs, p.y - hs, hs * 2, hs * 2); octx.strokeRect(p.x - hs, p.y - hs, hs * 2, hs * 2); }
    const top = { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2 };
    octx.beginPath(); octx.moveTo(top.x, top.y); octx.lineTo(rh.x, rh.y); octx.stroke();
    octx.beginPath(); octx.arc(rh.x, rh.y, hs * 1.3, 0, 7); octx.fill(); octx.stroke();
  }
}

// Pointer handling. Two fingers (or the Move view tool, Space, or the middle button) pan and zoom.
let drag = null, spaceDown = false;
const touches = new Map();
let pinch = null;
function startPan(e) { drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: view_.x, vy: view_.y }; $('#slab').classList.add('panning'); }
overlay.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { // second finger: switch to pinch, dropping any stroke in progress
      if (drag && !drag.pan && (drag.tool === 'pen' || drag.tool === 'eraser') && currentInk) ictx.putImageData(currentInk, 0, 0);
      drag = null; preview = null;
      const [a, b] = [...touches.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, z: view_.z, x: view_.x, y: view_.y };
      composite(); drawOverlay(); return;
    }
  }
  if (e.button === 1 || (e.button === 0 && (spaceDown || (state.mode === 'sketch' && state.tool.sketch === 'hand')))) {
    overlay.setPointerCapture(e.pointerId); startPan(e); return;
  }
  if (e.button !== 0) return;
  const p = pos(e);
  if (state.mode !== 'sketch') { colorClick(p); return; }
  overlay.setPointerCapture(e.pointerId);
  const tool = state.tool.sketch;
  if (tool === 'select') {
    const hit = selHit(pos(e, false));
    if (hit) { drag = { tool, hit, start: pos(e, false), s0: { ...sel } }; return; }
    if (sel) finishSel(true);
    drag = { tool, marquee: { a: p, b: p } }; return;
  }
  if (sel) finishSel(true);
  if (tool === 'text') { const c = textCanvas(); if (c) { floatCanvas(c, p.x, p.y); setTool('select'); } return; }
  if (tool === 'path') {
    const q = snap(p);
    if (!pathPts) pathPts = [q];
    else if (pathPts.length > 2 && Math.hypot(q.x - pathPts[0].x, q.y - pathPts[0].y) < 10 / view_.z) { pathPts.push(pathPts[0]); finishPath(); return; }
    else pathPts.push(q);
    drawOverlay(); return;
  }
  drag = { tool, start: SHAPES.includes(tool) ? snap(p) : p, last: p, mid: p };
  if (tool === 'pen' || tool === 'eraser') {
    strokeStyle(ictx, tool === 'eraser');
    withSym(ictx, () => { ictx.beginPath(); ictx.moveTo(p.x, p.y); ictx.lineTo(p.x + .01, p.y); ictx.stroke(); });
    ictx.globalCompositeOperation = 'source-over';
    composite();
  }
});
overlay.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && touches.size === 2) {
    const [a, b] = [...touches.values()], r = $('#slab').getBoundingClientRect();
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const z = Math.max(1, Math.min(8, pinch.z * d / pinch.d)), cx = pinch.mx - r.left, cy = pinch.my - r.top;
    view_.z = z; view_.x = cx - (cx - pinch.x) * z / pinch.z + (mx - pinch.mx); view_.y = cy - (cy - pinch.y) * z / pinch.z + (my - pinch.my);
    applyView(); drawOverlay(); return;
  }
  if (pathPts && !drag) { drawOverlay(snap(pos(e))); return; }
  if (!drag) return;
  if (drag.pan) { view_.x = drag.vx + e.clientX - drag.sx; view_.y = drag.vy + e.clientY - drag.sy; applyView(); drawOverlay(); return; }
  const p = pos(e);
  if (drag.tool === 'select') {
    if (drag.marquee) { drag.marquee.b = p; drawOverlay(); return; }
    const q = pos(e, false), s0 = drag.s0;
    if (drag.hit === 'move') { const t = snap({ x: s0.cx + q.x - drag.start.x, y: s0.cy + q.y - drag.start.y }); sel.cx = t.x; sel.cy = t.y; }
    else if (drag.hit === 'scale') {
      const f = Math.max(.05, Math.hypot(q.x - s0.cx, q.y - s0.cy) / Math.max(1, Math.hypot(drag.start.x - s0.cx, drag.start.y - s0.cy)));
      sel.sx = s0.sx * f; sel.sy = s0.sy * f;
    } else if (drag.hit === 'rotate') {
      let r = s0.rot + (Math.atan2(q.y - s0.cy, q.x - s0.cx) - Math.atan2(drag.start.y - s0.cy, drag.start.x - s0.cx)) * 180 / Math.PI;
      if (e.shiftKey) r = Math.round(r / 15) * 15;
      sel.rot = r;
    }
    drawOverlay(); return;
  }
  if (drag.tool === 'pen' || drag.tool === 'eraser') {
    const mid = { x: (drag.last.x + p.x) / 2, y: (drag.last.y + p.y) / 2 }, d = drag;
    strokeStyle(ictx, d.tool === 'eraser');
    withSym(ictx, () => { ictx.beginPath(); ictx.moveTo(d.mid.x, d.mid.y); ictx.quadraticCurveTo(d.last.x, d.last.y, mid.x, mid.y); ictx.stroke(); });
    ictx.globalCompositeOperation = 'source-over';
    drag.last = p; drag.mid = mid;
    composite();
  } else {
    preview = { tool: drag.tool, a: drag.start, b: snap(p), shift: e.shiftKey };
    drawOverlay();
  }
});
function endDrag(e) {
  touches.delete(e.pointerId);
  if (pinch) { if (touches.size < 2) pinch = null; return; }
  if (!drag) return;
  const d = drag; drag = null;
  if (d.pan) { $('#slab').classList.remove('panning'); return; }
  const p = pos(e);
  if (d.tool === 'select') {
    if (d.marquee) liftRect(d.marquee.a, d.marquee.b);
    drawOverlay(); return;
  }
  preview = null;
  if (SHAPES.includes(d.tool)) {
    const b = snap(p);
    if (Math.hypot(b.x - d.start.x, b.y - d.start.y) < 2) { drawOverlay(); return; }
    strokeStyle(ictx, false);
    withSym(ictx, () => { shapePath(ictx, d.tool, d.start, b, e.shiftKey); ictx.stroke(); });
  } else {
    strokeStyle(ictx, d.tool === 'eraser');
    withSym(ictx, () => { ictx.beginPath(); ictx.moveTo(d.mid.x, d.mid.y); ictx.lineTo(p.x, p.y); ictx.stroke(); });
  }
  ictx.globalCompositeOperation = 'source-over';
  drawOverlay();
  commit(true);
  refresh();
}
overlay.addEventListener('pointerup', endDrag);
overlay.addEventListener('pointercancel', endDrag);
overlay.addEventListener('dblclick', () => { if (pathPts) finishPath(); });
function finishPath() {
  const pts = pathPts; pathPts = null;
  if (pts && pts.length > 1) {
    strokeStyle(ictx, false);
    withSym(ictx, () => { ictx.beginPath(); pts.forEach((p, i) => i ? ictx.lineTo(p.x, p.y) : ictx.moveTo(p.x, p.y)); ictx.stroke(); });
    commit(true); refresh();
  }
  drawOverlay();
}
// Keys for drawing: Space pans, Enter/Escape finish or cancel, Delete removes the selection, and
// Ctrl+C / Ctrl+X / Ctrl+V / Ctrl+A copy, cut, paste and select all.
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, dialog')) return;
  if (e.key === ' ' && !spaceDown) { spaceDown = true; $('#slab').classList.add('panning'); e.preventDefault(); return; }
  if (state.mode !== 'sketch') return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (k === 'enter') { if (pathPts) finishPath(); else if (sel) finishSel(true); }
  else if (k === 'escape') { if (pathPts) { pathPts = null; drawOverlay(); } else if (sel) cancelSel(); }
  else if ((k === 'delete' || k === 'backspace') && sel) { e.preventDefault(); finishSel(false); }
  else if (mod && k === 'c' && sel) { clip = selectionImage(); toast('Copied'); }
  else if (mod && k === 'x' && sel) { clip = selectionImage(); finishSel(false); }
  else if (mod && k === 'v' && clip) { e.preventDefault(); if (sel) finishSel(true); const c = document.createElement('canvas'); c.width = clip.width; c.height = clip.height; c.getContext('2d').drawImage(clip, 0, 0); floatCanvas(c, W / 2 + 20, H / 2 + 20); setTool('select'); }
  else if (mod && k === 'a') { e.preventDefault(); if (sel) finishSel(true); setTool('select'); liftRect({ x: 0, y: 0 }, { x: W, y: H }); }
  else if (!mod && (k === '+' || k === '=')) zoomAt(1.5);
  else if (!mod && k === '-') zoomAt(1 / 1.5);
  else if (!mod && k === '0') { view_.z = 1; view_.x = view_.y = 0; applyView(); drawOverlay(); }
});
document.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; $('#slab').classList.remove('panning'); } });
$('#symmetry').addEventListener('change', () => drawOverlay());
$('#grid').addEventListener('change', () => drawOverlay());
$('#sides').addEventListener('input', e => { $('#sides-val').textContent = e.target.value; });

// Trace over a photo: shown faintly under the drawing in the Sketch step, never part of the design.
let traceImg = null;
$('#trace-photo').addEventListener('click', () => $('#file-trace').click());
$('#file-trace').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const img = await loadPhoto(await fileToDataURL(f));
  if (!img) return toast('That file could not be read as an image.');
  traceImg = img; $('#trace-opts').hidden = false; $('#trace-on').checked = true;
  setMode('sketch'); setTool('pen'); composite();
  toast('Trace over the photo with the pen or shapes. It is only a guide and is not part of the design.');
});
$('#trace-on').addEventListener('change', () => composite());
$('#trace-alpha').addEventListener('input', e => { $('#trace-alpha-val').textContent = e.target.value; composite(); });
function drawTrace(target) {
  if (!traceImg || !$('#trace-on').checked) return;
  const s = Math.min(W / traceImg.naturalWidth, H / traceImg.naturalHeight), w = traceImg.naturalWidth * s, h = traceImg.naturalHeight * s;
  target.globalAlpha = +$('#trace-alpha').value / 100;
  target.drawImage(traceImg, (W - w) / 2, (H - h) / 2, w, h);
  target.globalAlpha = 1;
}

/* ---------------- Coloring ---------------- */
function colorClick(p) {
  const x = Math.round(p.x), y = Math.round(p.y), idx = y * W + x, tool = state.tool.color;
  heavy(() => {
    const hit = fillAt(idx);
    if (tool === 'pick') {
      if (hit < 0) return toast('That area has no material yet.');
      selectMat(state.fills[hit].mat); setTool('fill');
      return toast('Picked ' + (matById(state.selected)?.name || 'material'));
    }
    if (tool === 'remove') {
      if (hit < 0) return;
      commit(false); state.fills.splice(hit, 1); refresh(); return;
    }
    if (!matById(state.selected)) return toast('Choose a color from the chart first.');
    if (hit >= 0) {
      if (state.fills[hit].mat === state.selected) return;
      commit(false);
      state.fills[hit] = { ...state.fills[hit], mat: state.selected };
      refresh(); return;
    }
    const L = getLabels()[idx];
    if (!L) return toast('That spot is on a line. Tap inside an area.');
    commit(false);
    state.fills.push({ x, y, mat: state.selected, rot: Math.round(Math.random() * 360) });
    refresh();
    if (regions[L].area > N * .9) toast('The fill covered almost everything. Check for an open shape, or raise Gap closing.');
  });
}

/* ---------------- Materials used ---------------- */
function renderBom() {
  const groups = new Map();
  let total = 0;
  if (state.mode === 'mosaic' && usePicture()) {
    const t2 = Math.max(4, tilePx()) ** 2;
    for (const [id, n] of pictureCounts) if (matById(id)) { groups.set(id, { pieces: null, px: n * t2, tiles: n }); total += n * t2; }
  } else for (const f of state.fills) {
    const L = labelOf(f);
    if (!L || !matById(f.mat)) continue;
    const g = groups.get(f.mat) || { pieces: 0, px: 0, tiles: 0 };
    g.pieces++; g.px += regions[L].area; g.tiles += tileCount(L); total += regions[L].area;
    groups.set(f.mat, g);
  }
  const imperial = state.unit === 'in';
  const pxPerUnit = W / state.sizeW;
  const toArea = px => { const a = px / (pxPerUnit * pxPerUnit); return imperial ? a / 144 : a / 10000; };
  $('#area-head').textContent = imperial ? 'Area (ft²)' : 'Area (m²)';
  $('#tiles-head').textContent = `Tiles (${$('#tile-size').selectedOptions[0].textContent.split(' (')[0]})`;
  $('#dims').textContent = `${fmt(state.sizeW)} × ${fmt(state.sizeH)} ${state.unit}`;
  const body = $('#bom-body'), foot = $('#bom-foot');
  body.textContent = ''; foot.textContent = '';
  if (!groups.size) {
    body.innerHTML = '<tr><td colspan="6" class="empty">No areas colored yet. Pick a color and tap the design.</td></tr>';
    return [];
  }
  const rows = [...groups].sort((a, b) => b[1].px - a[1].px).map(([id, g]) => ({ m: matById(id), ...g, area: toArea(g.px), share: g.px / total }));
  for (const r of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><div class="mat-cell"><canvas width="56" height="56"></canvas><div><div>${esc(r.m.name)}</div><div class="code">${esc(r.m.code || '')}</div></div></div></td>
      <td>${TYPE_LABEL[r.m.type] || 'Marble'}</td><td class="num">${r.pieces ?? '—'}</td><td class="num">${r.tiles.toLocaleString()}</td><td class="num">${Math.round(r.share * 100)}%</td><td class="num">${r.area.toFixed(2)}</td>`;
    drawThumb(tr.querySelector('canvas'), r.m);
    body.appendChild(tr);
  }
  const tA = rows.reduce((s, r) => s + r.area, 0), pcs = rows[0].pieces == null ? '—' : rows.reduce((s, r) => s + r.pieces, 0), tls = rows.reduce((s, r) => s + r.tiles, 0);
  foot.innerHTML = `<tr><td>Total</td><td></td><td class="num">${pcs}</td><td class="num">${tls.toLocaleString()}</td><td class="num">100%</td><td class="num">${tA.toFixed(2)}</td></tr>`;
  return rows;
}
const fmt = n => (Math.round(n * 10) / 10).toString();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- Chart UI ---------------- */
function renderChart() {
  const box = $('#swatches'); box.textContent = '';
  const q = state.query.trim().toLowerCase();
  const list = chart.filter(m => inTab(m) && (!q || (m.name + ' ' + (m.code || '')).toLowerCase().includes(q)));
  if (!list.length) box.innerHTML = '<p class="empty">No materials match.</p>';
  const thumbs = [];
  for (const m of list) {
    const b = document.createElement('div');
    b.className = 'swatch'; b.setAttribute('role', 'button'); b.tabIndex = 0; b.dataset.id = m.id;
    b.setAttribute('aria-pressed', String(m.id === state.selected));
    b.innerHTML = `<canvas width="120" height="120"></canvas><span class="sc">${esc(m.code || '')}</span><span class="sn">${esc(m.name)}</span><button class="edit" type="button" title="Edit ${esc(m.name)}" aria-label="Edit ${esc(m.name)}">✎</button>`;
    b.addEventListener('click', e => { if (e.target.closest('.edit')) return openMatDialog(m); selectMat(m.id); if (state.mode !== 'color') setMode('color'); setTool('fill'); });
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } });
    box.appendChild(b);
    thumbs.push([b.querySelector('canvas'), m]);
  }
  // Generate textures a few at a time so the page stays responsive.
  const step = () => { const t0 = performance.now(); while (thumbs.length && performance.now() - t0 < 30) drawThumb(...thumbs.shift()); if (thumbs.length) setTimeout(step, 0); };
  step();
  $('#sample-note').hidden = !chartIsSample;
  const label = { marble: 'Marble', engineered: 'Engineered' };
  $$('.tabs button').forEach(b => { b.textContent = `${label[b.dataset.filter]} ${chart.filter(m => inTab(m, b.dataset.filter)).length}`; });
}
function selectMat(id) {
  state.selected = id;
  const m = matById(id);
  $$('#swatches .swatch').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.id === id)));
  renderSelected(m);
}
function renderSelected(m) {
  drawThumb($('#sel-thumb'), m);
  $('#sel-name').textContent = m ? m.name : 'No material';
  $('#sel-code').textContent = m ? (m.code || '') : '';
  $('#sel-type').textContent = m ? (TYPE_LABEL[m.type] || 'Marble') : '';
  const sm = $('#status-mat'); if (sm) sm.textContent = m ? m.name : '—';
}
function saveChart() { chartIsSample = false; store.set('mosaic.chart.v7', chart); $('#sample-note').hidden = true; }

/* Material dialog */
let editing = null, editPhoto = null;
function fillStyles(type, val) {
  $('#m-style').innerHTML = STYLES[type].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
  $('#m-style').value = val && STYLES[type].some(s => s[0] === val) ? val : STYLES[type][0][0];
}
function draftMat() {
  return { id: editing ? editing.id : 'm-' + Date.now().toString(36), name: $('#m-name').value.trim() || 'Untitled', code: $('#m-code').value.trim(),
    type: $('#m-type').value, style: $('#m-style').value, base: $('#m-base').value, vein: $('#m-vein').value, ...(editPhoto ? { photo: editPhoto } : {}) };
}
function updateMatPreview() {
  $('#m-base-hex').textContent = $('#m-base').value; $('#m-vein-hex').textContent = $('#m-vein').value;
  const c = $('#mat-preview'), d = draftMat();
  const t = makeTile({ ...d, id: 'preview' + d.base });
  c.getContext('2d').drawImage(t, 0, 0, TILE * .6, TILE * .6, 0, 0, c.width, c.height);
  $('#m-photo-clear').hidden = !editPhoto;
}
let previewTimer = 0;
const queuePreview = () => { clearTimeout(previewTimer); previewTimer = setTimeout(updateMatPreview, 60); };
function openMatDialog(m) {
  editing = m || null; editPhoto = m?.photo || null;
  $('#mat-dlg-title').textContent = m ? 'Edit material' : 'Add material';
  $('#m-name').value = m?.name || ''; $('#m-code').value = m?.code || '';
  $('#m-type').value = m?.type || (['all', 'stone'].includes(state.filter) ? 'marble' : state.filter);
  fillStyles($('#m-type').value, m?.style);
  $('#m-base').value = m?.base || '#e9e8e4'; $('#m-vein').value = m?.vein || '#8f9295';
  $('#m-delete').hidden = !m;
  updateMatPreview();
  $('#mat-dlg').showModal();
}
$('#m-type').addEventListener('change', () => { fillStyles($('#m-type').value); queuePreview(); });
['#m-style', '#m-base', '#m-vein'].forEach(s => $(s).addEventListener('input', queuePreview));
$('#m-cancel').addEventListener('click', () => $('#mat-dlg').close());
$('#m-photo-btn').addEventListener('click', () => $('#file-photo').click());
$('#m-photo-clear').addEventListener('click', () => { editPhoto = null; updateMatPreview(); });
$('#file-photo').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const src = await fileToDataURL(f);
  const img = await loadPhoto(src);
  if (!img) return toast('That file could not be read as an image.');
  // Downscale so the chart stays small enough to store.
  const c = document.createElement('canvas'); const s = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight));
  c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  editPhoto = c.toDataURL('image/jpeg', .85);
  await loadPhoto(editPhoto);
  updateMatPreview();
});
$('#mat-form').addEventListener('submit', e => {
  e.preventDefault();
  const m = draftMat();
  if (editing) chart[chart.findIndex(x => x.id === editing.id)] = m; else chart.push(m);
  saveChart(); $('#mat-dlg').close();
  renderChart(); selectMat(m.id);
  heavy(() => refresh());
  toast(editing ? 'Material updated' : 'Material added to chart');
});
$('#m-delete').addEventListener('click', async () => {
  const m = editing; $('#mat-dlg').close();
  const used = state.fills.some(f => f.mat === m.id);
  if (!(await confirmBox('Delete ' + m.name + '?', used ? 'Areas colored with it will become uncolored.' : 'It will be removed from the chart.', 'Delete'))) return;
  chart = chart.filter(x => x.id !== m.id);
  if (used) { commit(false); state.fills = state.fills.filter(f => f.mat !== m.id); }
  saveChart(); if (state.selected === m.id) state.selected = chart[0]?.id;
  renderChart(); selectMat(state.selected); heavy(() => refresh());
});

/* ---------------- Mode & tools ---------------- */
function setMode(mode) {
  if (mode !== 'sketch') { if (sel) finishSel(true); if (pathPts) finishPath(); }
  state.mode = mode;
  for (const k of ['sketch', 'color', 'mosaic']) $('#step-' + k).setAttribute('aria-pressed', String(mode === k));
  $('#sketch-tools').hidden = mode !== 'sketch';
  $('#color-tools').hidden = mode !== 'color';
  $('#mosaic-tools').hidden = mode !== 'mosaic';
  $('#joint-group').hidden = mode === 'sketch';
  $('#slab').classList.toggle('mode-color', mode !== 'sketch');
  $('#status').innerHTML = {
    sketch: 'Draw or upload your design. Every closed shape becomes one piece you can fill with stone.',
    color: 'Pick a stone from the chart, then tap an area to fill it with <b id="status-mat"></b>.',
    mosaic: 'Your design as a hand-cut mosaic. Tap an area to change it to <b id="status-mat"></b>.',
  }[mode];
  $('#step-title').textContent = { sketch: 'Step 1 of 3 · Design', color: 'Step 2 of 3 · Color', mosaic: 'Step 3 of 3 · Mosaic' }[mode];
  $('#prev-step').hidden = mode === 'sketch';
  $('#prev-step').textContent = mode === 'mosaic' ? '← Back to colors' : '← Back to design';
  $('#next-step').textContent = { sketch: 'Next: Color it →', color: 'Next: See the mosaic →', mosaic: 'Export my design' }[mode];
  renderChart(); selectMat(state.selected); renderBom();
  markFrom();
  if (mode === 'mosaic') heavy(() => { renderMosaic(); composite(); renderBom(); });
  else composite();
  if (mode === 'sketch') setTool(state.tool.sketch);
  drawOverlay();
}
function markFrom() {
  $('#mosaic-from-group').hidden = !sourceData || photoFinal();
  $$('#mosaic-from-group .seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.from === state.mosaicFrom)));
  $('#mosaic-areas-hint').hidden = usePicture();
  if (state.mode === 'mosaic' && usePicture()) $('#status').textContent = 'Your picture as a hand-cut mosaic in our stones. Change the tile size or grout on the left.';
}
const TOOL_HINTS = {
  select: 'Drag a box around part of the drawing to move, resize, rotate, flip or copy it.',
  pen: 'Drag to draw freehand.', eraser: 'Drag over lines to erase them.',
  line: 'Drag to draw a line. Hold Shift for straight angles.',
  path: 'Click to add corners; click the first point, double-click or press Enter to finish.',
  rect: 'Drag to draw. Hold Shift for a square.', ellipse: 'Drag to draw. Hold Shift for a circle.',
  polygon: 'Drag to draw. Set the number of sides below.', star: 'Drag to draw. Set the number of points below.',
  heart: 'Drag to draw a heart.', text: 'Type below, then click the design to place it.',
  hand: 'Drag to move around when zoomed in. Pinch or Ctrl + scroll to zoom.',
};
function setTool(t) {
  if (state.mode === 'sketch' && t !== 'select' && sel) finishSel(true);
  if (pathPts && t !== 'path') finishPath();
  state.tool[state.mode] = t;
  if (state.mode === 'sketch') {
    $('#tool-hint').textContent = TOOL_HINTS[t] || '';
    $('#sides-field').hidden = !['polygon', 'star'].includes(t);
    $('#text-field').hidden = t !== 'text';
    $('#slab').className = $('#slab').className.replace(/\btool-\w+/g, '').trim() + ' tool-' + t;
  }
  $$('.tool').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === state.tool.sketch || b.dataset.tool === state.tool.color)));
}
$('#step-sketch').addEventListener('click', () => setMode('sketch'));
$('#step-color').addEventListener('click', () => setMode('color'));
$('#step-mosaic').addEventListener('click', () => setMode('mosaic'));
$('#prev-step').addEventListener('click', () => setMode(state.mode === 'mosaic' ? 'color' : 'sketch'));
$('#next-step').addEventListener('click', () => {
  if (state.mode === 'sketch') setMode('color');
  else if (state.mode === 'color') setMode('mosaic');
  else $('#export').click();
  $('#slab').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

/* ---------------- Start choices ---------------- */
function showStart(on) {
  $('#start').hidden = !on;
  if (on) $('#start').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  else store.set('mosaic.started', true);
}
$('#new-design').addEventListener('click', () => { $('#gallery').hidden = true; showStart(true); });
function showGallery() {
  renderGallery(); $('#gallery').hidden = false;
  $('#gallery').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
$('#gallery-close').addEventListener('click', () => { $('#gallery').hidden = true; });
$('#start-close').addEventListener('click', () => showStart(false));
$$('#start [data-start]').forEach(b => b.addEventListener('click', () => {
  const how = b.dataset.start;
  showStart(false);
  if (how === 'upload') { setMode('sketch'); $('#file-sketch').click(); }
  else if (how === 'describe') {
    setMode('sketch'); $('#ai-more').open = true;
    if (sampleFn) $('#ai-prompt').focus(); else toast('Describing a design works when this tool is opened in Claude. You can upload or draw instead.');
  } else if (how === 'draw') {
    heavy(() => {
      ictx.clearRect(0, 0, W, H); sourceData = null;
      commit(true); state.fills = [];
      setMode('sketch'); setTool('pen'); refresh();
      toast('A blank canvas is ready. Undo brings back your previous design.');
    });
  } else if (how === 'gallery') showGallery();
}));
$$('.tool').forEach(b => b.addEventListener('click', () => {
  const sketchTool = !!b.closest('#sketch-tools');
  if ((state.mode === 'sketch') !== sketchTool) setMode(sketchTool ? 'sketch' : 'color');
  setTool(b.dataset.tool);
}));
$('#weight').addEventListener('input', e => { state.weight = +e.target.value; $('#weight-val').textContent = e.target.value; });
$('#gap').addEventListener('input', e => { $('#gap-val').textContent = e.target.value; });
$('#gap').addEventListener('change', e => { state.gap = +e.target.value; heavy(() => refresh()); });
$$('.joint').forEach(b => b.addEventListener('click', () => {
  state.joint = b.dataset.joint; markJoint(); scheduleSave();
  heavy(() => refresh()); // the grout shows in the Color step's tiles too
}));
function markLook() { $$('#color-tools .seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.look === state.look))); }
$$('#mosaic-from-group .seg button').forEach(b => b.addEventListener('click', () => {
  state.mosaicFrom = b.dataset.from; markFrom(); scheduleSave();
  heavy(() => { renderMosaic(); composite(); renderBom(); });
}));
$$('#color-tools .seg button').forEach(b => b.addEventListener('click', () => {
  state.look = b.dataset.look; markLook();
  renderChart(); selectMat(state.selected); heavy(() => refresh());
}));
$('#tile-size').addEventListener('change', e => { state.tileIn = +e.target.value; heavy(() => refresh()); });
$('#any-color').addEventListener('input', e => {
  const m = nearestMat(srgbToLab(...hexRgb(e.target.value)), matchList());
  if (!m) return;
  selectMat(m.id); setTool('fill');
  $('#any-color-match').textContent = `Closest in our chart: ${m.code ? m.code + ' ' : ''}${m.name}`;
});
function markJoint() { $$('.joint').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.joint === state.joint))); }
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  state.filter = b.dataset.filter;
  $$('.tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderChart(); selectMat(state.selected);
}));
$('#search').addEventListener('input', e => { state.query = e.target.value; renderChart(); selectMat(state.selected); });
// Size: width × height in the chosen unit. The frame takes the mosaic's shape; tiles and areas follow.
function applySize(w, h) {
  if (!(w > 0 && h > 0)) return;
  state.sizeW = w; state.sizeH = h;
  $('#size-w').value = w; $('#size-h').value = h;
  const [nw, nh] = frameFor(w, h);
  heavy(() => { resizeFrame(nw, nh); refresh(); applyView(); drawOverlay(); });
}
$('#size-w').addEventListener('change', e => applySize(parseFloat(e.target.value), state.sizeH));
$('#size-h').addEventListener('change', e => applySize(state.sizeW, parseFloat(e.target.value)));
$('#size-preset').addEventListener('change', e => {
  if (!e.target.value) return;
  const [w, h] = e.target.value.split('x').map(Number);
  if (state.unit !== 'in') { state.unit = 'in'; $('#size-unit').value = 'in'; }
  applySize(w, h); e.target.value = '';
});
$('#size-unit').addEventListener('change', e => {
  const to = e.target.value; if (to === state.unit) return;
  const conv = v => to === 'cm' ? Math.round(v * 2.54) : Math.round(v / 2.54 * 2) / 2;
  state.unit = to; state.sizeW = conv(state.sizeW); state.sizeH = conv(state.sizeH);
  $('#size-w').value = state.sizeW; $('#size-h').value = state.sizeH; renderBom(); scheduleSave();
});
$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);
$('#clear-colors').addEventListener('click', async () => {
  if (!state.fills.length) return;
  if (!(await confirmBox('Clear all colors?', 'The sketch stays. You can undo this.', 'Clear colors'))) return;
  commit(false); state.fills = []; refresh();
});
$('#clear-sketch').addEventListener('click', async () => {
  if (!(await confirmBox('Clear the sketch?', 'This removes every line and color. You can undo this.', 'Clear sketch'))) return;
  ictx.clearRect(0, 0, W, H); sourceData = null; state.fills = []; commit(true); refresh();
});
$('#sample').addEventListener('click', () => { showStart(false); showGallery(); });
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, select, dialog')) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k === 'm') { setMode('mosaic'); return; }
  const map = { v: ['sketch', 'select'], b: ['sketch', 'pen'], l: ['sketch', 'line'], p: ['sketch', 'path'], r: ['sketch', 'rect'], o: ['sketch', 'ellipse'], g: ['sketch', 'polygon'], s: ['sketch', 'star'], k: ['sketch', 'heart'], t: ['sketch', 'text'], x: ['sketch', 'eraser'], h: ['sketch', 'hand'], f: ['color', 'fill'], i: ['color', 'pick'], d: ['color', 'remove'] };
  if (map[k]) { if (state.mode !== map[k][0]) setMode(map[k][0]); setTool(map[k][1]); }
});

/* ---------------- Import a drawing ---------------- */
let importedImg = null;
$('#import-sketch').addEventListener('click', () => $('#file-sketch').click());
$('#file-sketch').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  const img = await loadPhoto(await fileToDataURL(f));
  if (!img) return toast('That file could not be read as an image.');
  importedImg = img; importedFile = f; lastSvg = null;
  $('#ai-redraw').hidden = !sampleFn || !imagesOk;
  showStart(false);
  $('#up-thumb').src = img.src;
  $('#up-title').textContent = 'Your picture'; $('#up-link').hidden = true;
  upKind = isColorful(img) ? 'color' : 'bw'; upAction = null; upStore = false;
  showPending(img);
  renderUpload();
  $('#upload-panel').hidden = false;
  $('#up-actions').scrollIntoView({ behavior: 'smooth', block: 'center' });
});

/* ---------------- Upload journeys ---------------- */
// Three kinds of upload, each with its own ways forward:
//   black & white drawing -> keep its lines -> color with stones -> mosaic
//   colored picture/photo -> outline to color yourself | outline already colored | straight to a mosaic
//   photo of a mosaic     -> rebuild it tile by tile in our stones | outline already colored
let upKind = 'color', pendingImg = null;
function showPending(img) { pendingImg = img; setMode('sketch'); composite(); }
function clearPending() { if (pendingImg) { pendingImg = null; composite(); } }
const UP_ACTIONS = {
  bw: [['lines', 'Color it with our stones', 'We keep your black lines. Then you fill each area with a stone and see it as a mosaic.']],
  color: [
    ['outline', 'Make an outline I color myself', 'Your picture becomes a black & white outline. You can edit it, then fill each area with a stone.'],
    ['colors', 'Outline it and color it for me', 'We outline the picture and fill each area with the closest stone. You can change any of them.'],
    ['picture', 'Turn it straight into a mosaic', 'Every tile takes the closest stone to the picture under it, like our portraits. Best for photos.'],
  ],
  mosaic: [
    ['picture', 'Rebuild it in our stones', 'We read the mosaic tile by tile and remake it with the closest stones from our chart.'],
    ['colors', 'Outline it and color it for me', 'We turn the mosaic into clear areas filled with our stones, which you can adjust and redraw.'],
    ['outline', 'Make an outline I color myself', 'A black & white outline of the design that you can edit, then fill with stones. Best for simpler designs.'],
  ],
};
// A design picked from our shop is already one of our mosaics: customers either change its colors
// or clear them and repaint it themselves.
const STORE_ACTIONS = [
  ['colors', 'Change the colors', 'The design keeps its stones. Tap any area and pick a stone to change it.'],
  ['outline', 'Remove all colors and repaint', 'Fill a clean black & white outline of the design with your own stones. The Mosaic step shows the piece again in your colors.'],
];
let upAction = null; // the option shown on the canvas right now
let upStore = false; // true while the picture is a design from our shop
function renderUpload() {
  $$('.up-kind button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.kind === upKind)));
  $('#up-kind-label').hidden = $('.up-kind').hidden = $('#up-act-num').hidden = upStore;
  $('#up-actions').classList.toggle('two', upStore);
  $('#up-hint').textContent = upStore ? 'Change its colors, or clear them and paint it your way.' : "Tell us what it is and what you'd like, and we'll set it up.";
  const box = $('#up-actions'); box.textContent = '';
  for (const [how, title, text] of upStore ? STORE_ACTIONS : UP_ACTIONS[upKind]) {
    const b = document.createElement('button'); b.type = 'button';
    b.setAttribute('aria-pressed', String(how === upAction));
    b.innerHTML = `<b>${title}</b><span>${text}</span>`;
    b.addEventListener('click', () => applyUpload(how));
    box.appendChild(b);
  }
  $('#up-done').hidden = !upAction;
}
// Every choice takes effect at once and the panel stays open, so customers can compare.
function applyUpload(how) {
  upAction = how; renderUpload();
  const img = pendingImg || importedImg;
  heavy(() => {
    try { runUpload(how); }
    catch (err) {
      console.error(err);
      upAction = null; renderUpload(); showPending(img);
      toast('Sorry, that did not work with this picture. Please try another option or another picture.');
    }
  });
}
$$('.up-kind button').forEach(b => b.addEventListener('click', () => { upKind = b.dataset.kind; applyUpload(UP_ACTIONS[upKind][0][0]); }));
$('#up-close').addEventListener('click', () => { $('#upload-panel').hidden = true; clearPending(); });
$('#up-done').addEventListener('click', () => { $('#upload-panel').hidden = true; $('#slab').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
function runUpload(how) {
  pendingImg = null;
  state.sourceKind = upKind;
  $('#trace-mode').value = how === 'picture' ? 'colors' : how;
  showTraceFields();
  if (how === 'picture') {
    // outline and color it too, so every step shows the design; the Mosaic step tiles the picture
    runTrace(true);
    state.mosaicFrom = 'picture';
    state.tileIn = upKind === 'mosaic' ? .375 : .25; $('#tile-size').value = String(state.tileIn);
    if (state.joint === '#1b1a19') { state.joint = '#8a8782'; markJoint(); }
    setMode('mosaic');
    toast(upKind === 'mosaic' ? 'Rebuilt in our stones. Change the tile size or grout on the left, or go back to adjust colors.' : 'Your picture as a mosaic in our stones. Smaller tiles show more detail.');
  } else runTrace();
}
function showTraceFields() {
  $('#trace-field').hidden = false;
  $('#colors-field').hidden = $('#trace-mode').value === 'lines';
  $('#threshold-field').hidden = $('#trace-mode').value !== 'lines';
}
$('#trace-mode').addEventListener('change', () => { showTraceFields(); if (importedImg) heavy(runTrace); });
$('#threshold').addEventListener('input', e => { $('#threshold-val').textContent = e.target.value; });
$('#threshold').addEventListener('change', () => { if (importedImg) heavy(runTrace); });
$('#colors').addEventListener('input', e => { $('#colors-val').textContent = e.target.value; });
$('#colors').addEventListener('change', () => { if (importedImg) heavy(runTrace); });
function runTrace(quiet) {
  sourceData = drawImported();
  state.mosaicFrom = 'areas';
  if (state.sourceKind === 'mosaic') sourceData.mosaic = true;
  if (upStore) sourceData.photo = $('#trace-mode').value === 'colors' ? true : 'final';
  if ($('#trace-mode').value === 'outline') {
    traceColors(); // draws the outline where the picture's colors meet
    commit(true);
    state.fills = [];
    setMode('sketch');
    refresh();
    toast('Your picture is now an outline. Edit it if you like, then press Next: Color it.');
  } else if ($('#trace-mode').value === 'colors') {
    const { idx, mats } = traceColors();
    commit(true);
    autoFill(idx, mats);
    setMode('color');
    refresh();
    if (!quiet) toast(`Colored with ${new Set(state.fills.map(f => f.mat)).size} stones from our chart. Tap any area to change it.`);
  } else {
    traceImage();
    sourceData = null;
    commit(true);
    state.fills = [];
    setMode('color');
    refresh();
    toast('Your drawing is ready. Pick a stone and tap each area. If lines are missing, adjust Ink threshold in step 1.');
  }
}
// The uploaded picture fitted onto a white slab, as pixels.
function drawImported() {
  const img = importedImg, s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  work.width = W; work.height = H;
  wctx.fillStyle = '#fff'; wctx.fillRect(0, 0, W, H);
  wctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  sourceRect = { x: (W - w) / 2, y: (H - h) / 2, w, h };
  return wctx.getImageData(0, 0, W, H);
}
function isColorful(img) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, 64, 64);
  const d = x.getImageData(0, 0, 64, 64).data;
  let colored = 0;
  for (let i = 0; i < d.length; i += 4) if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 40) colored++;
  return colored > 64 * 64 * .08;
}
function traceImage() {
  const src = drawImported(), out = ictx.createImageData(W, H);
  const thr = +$('#threshold').value / 100 * 255;
  for (let i = 0; i < N * 4; i += 4) {
    const lum = .299 * src.data[i] + .587 * src.data[i + 1] + .114 * src.data[i + 2];
    if (lum < thr) out.data[i + 3] = 255;
  }
  ictx.putImageData(out, 0, 0);
}
function boxBlur(ch, r) {
  const tmp = new Float32Array(N), d = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    const o = y * W; let acc = 0;
    for (let x = -r; x <= r; x++) acc += ch[o + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) { tmp[o + x] = acc / d; acc += ch[o + Math.min(W - 1, x + r + 1)] - ch[o + Math.max(0, x - r)]; }
  }
  for (let x = 0; x < W; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) { ch[y * W + x] = acc / d; acc += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; }
  }
}
// Turns a colored picture into outlined areas: groups its colors, matches each group to the
// closest chart color, merges specks too small to cut, and draws lines where colors meet.
function traceColors() {
  const d = drawImported().data;
  const ch = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
  for (let i = 0; i < N; i++) { ch[0][i] = d[i * 4]; ch[1][i] = d[i * 4 + 1]; ch[2][i] = d[i * 4 + 2]; }
  for (const c of ch) boxBlur(c, sourceData?.mosaic ? 5 : 2); // a mosaic photo's grout lines blur away
  const lab = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const v = srgbToLab(ch[0][i], ch[1][i], ch[2][i]); lab[i * 3] = v[0]; lab[i * 3 + 1] = v[1]; lab[i * 3 + 2] = v[2]; }
  const dist = (i, c) => (lab[i * 3] - c[0]) ** 2 + (lab[i * 3 + 1] - c[1]) ** 2 + (lab[i * 3 + 2] - c[2]) ** 2;
  // k-means on a sample of pixels, seeded with spread-out colors
  const K = +$('#colors').value, sample = [];
  for (let i = 0; i < N; i += 29) sample.push(i);
  const centers = [[lab[sample[0] * 3], lab[sample[0] * 3 + 1], lab[sample[0] * 3 + 2]]];
  const minD = new Float32Array(sample.length).fill(Infinity);
  while (centers.length < K) {
    let far = 0;
    sample.forEach((p, j) => { minD[j] = Math.min(minD[j], dist(p, centers[centers.length - 1])); if (minD[j] > minD[far]) far = j; });
    const p = sample[far]; centers.push([lab[p * 3], lab[p * 3 + 1], lab[p * 3 + 2]]);
  }
  const nearestCenter = i => { let b = 0, bd = Infinity; for (let c = 0; c < centers.length; c++) { const v = dist(i, centers[c]); if (v < bd) { bd = v; b = c; } } return b; };
  for (let it = 0; it < 8; it++) {
    const sum = centers.map(() => [0, 0, 0, 0]);
    for (const p of sample) { const s = sum[nearestCenter(p)]; s[0] += lab[p * 3]; s[1] += lab[p * 3 + 1]; s[2] += lab[p * 3 + 2]; s[3]++; }
    sum.forEach((s, c) => { if (s[3]) centers[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  const list = matchList(), mats = [];
  const cmap = centers.map(c => { const m = nearestMat(c, list); let k = mats.indexOf(m); if (k < 0) { mats.push(m); k = mats.length - 1; } return k; });
  let idx = new Uint8Array(N);
  for (let i = 0; i < N; i++) idx[i] = cmap[nearestCenter(i)];
  // smooth ragged edges
  const M = mats.length, cnt = new Uint16Array(M);
  for (let pass = 0; pass < 2; pass++) {
    const out = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      cnt.fill(0);
      for (let dy = -1; dy <= 1; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -1; dx <= 1; dx++) { const xx = x + dx; if (xx >= 0 && xx < W) cnt[idx[yy * W + xx]]++; } }
      let b = idx[y * W + x]; for (let k = 0; k < M; k++) if (cnt[k] > cnt[b]) b = k;
      out[y * W + x] = b;
    }
    idx = out;
  }
  // merge specks smaller than about two tiles into their most common neighbor
  const minA = Math.max(150, (tilePx() * 1.5) ** 2), seen = new Uint8Array(N), comp = new Int32Array(N), nb = new Uint32Array(M);
  const near = (p, px) => [px > 0 ? p - 1 : -1, px < W - 1 ? p + 1 : -1, p >= W ? p - W : -1, p < N - W ? p + W : -1];
  for (let s0 = 0; s0 < N; s0++) {
    if (seen[s0]) continue;
    const k = idx[s0]; let sp = 0, n = 0;
    stack[sp++] = s0; seen[s0] = 1;
    while (sp) {
      const p = stack[--sp]; comp[n++] = p;
      for (const q of near(p, p % W)) if (q >= 0 && idx[q] === k && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
    }
    if (n >= minA) continue;
    nb.fill(0);
    for (let j = 0; j < n; j++) for (const q of near(comp[j], comp[j] % W)) if (q >= 0 && idx[q] !== k) nb[idx[q]]++;
    let b = -1; for (let m = 0; m < M; m++) if (m !== k && nb[m] && (b < 0 || nb[m] > nb[b])) b = m;
    if (b >= 0) for (let j = 0; j < n; j++) idx[comp[j]] = b;
  }
  // lines where two colors meet
  let line = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    const px = p % W;
    if ((px < W - 1 && idx[p] !== idx[p + 1]) || (p < N - W && idx[p] !== idx[p + W])) line[p] = 1;
  }
  line = dilate(line, 1);
  const out = ictx.createImageData(W, H);
  for (let i = 0; i < N; i++) if (line[i]) out.data[i * 4 + 3] = 255;
  ictx.putImageData(out, 0, 0);
  return { idx, mats };
}
// Colors every outlined area with the chart color most of its pixels were matched to.
function autoFill(idx, mats) {
  const lab = getLabels(), M = mats.length, votes = new Uint32Array(regions.length * M);
  for (let i = 0; i < N; i++) { const L = lab[i]; if (L) votes[L * M + idx[i]]++; }
  const fills = [];
  for (let L = 1; L < regions.length; L++) {
    let b = 0; for (let k = 1; k < M; k++) if (votes[L * M + k] > votes[L * M + b]) b = k;
    const s = regions[L].seed;
    fills.push({ x: s % W, y: (s - s % W) / W, mat: mats[b].id, orig: mats[b].id, rot: Math.round(hash(L, 3, 7) * 360) });
  }
  state.fills = fills;
}

/* ---------------- Ready designs ---------------- */
// Real iMosaicArt marble pieces to start from: the marble best sellers of each store collection, read live
// from the store (templates/collection.mosaic-designs.liquid answers
// /collections/<handle>?view=mosaic-designs&sort_by=best-selling with up to 20 marble products as JSON;
// glass pieces are left out). Categories without marble pieces are hidden.
// A chosen piece goes through the "photo of a mosaic" journey.
const DESIGN_CATS = [
  ['Abstract', ['abstract']], ['Animals', ['animal-mosaics']], ['Birds', ['bird-mosaics']],
  ['Flowers', ['flower-mosaics']], ['Geometric', ['geometric-mosaics']], ['Landscapes', ['landscape-mosaics']],
  ['Nautical', ['nautical-mosaics']], ['Trees', ['tree-mosaics']], ['Roman', ['roman-mosaics']],
  ['Religious', ['religious-mosaics']], ['Portraits', ['portrait-mosaics']], ['Van Gogh', ['van-gogh-mosaics']],
  ['Patterns', ['patterns-mosaics']], ['Landmarks', ['landmark-mosaics']], ['Food', ['food-mosaics']],
  ['Backsplash & table tops', ['mosaic-tile-backsplash', 'table-countertop-mosaics']],
];
const designCache = new Map(); // category name -> items
let designCat = DESIGN_CATS[0][0];
async function loadDesigns(name) {
  if (designCache.has(name)) return designCache.get(name);
  const handles = DESIGN_CATS.find(c => c[0] === name)[1], per = Math.floor(20 / handles.length);
  const lists = await Promise.all(handles.map(h =>
    fetch(`/collections/${h}?view=mosaic-designs&sort_by=best-selling`, { credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(t => JSON.parse(t).slice(0, per))));
  // Serve photos from this site's own /cdn/shop/ path: a photo from another host can be shown but
  // not read back by the canvas, which the outline and rebuild steps need.
  const local = u => String(u || '').replace(/^(https?:)?\/\/cdn\.shopify\.com\/s\/files\/\d+\/\d+\/\d+\/\d+\//, '/cdn/shop/')
    .replace(/^(https?:)?\/\/[^/]+(\/cdn\/shop\/)/, '$2');
  const items = lists.flat().filter(p => p && p.img).map(p => ({ ...p, th: local(p.th), img: local(p.img) }));
  designCache.set(name, items);
  return items;
}
let tabsChecked = false;
function renderGallery() {
  const tabs = $('#gallery-tabs');
  if (!tabs.childElementCount) for (const [name] of DESIGN_CATS) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = name;
    b.addEventListener('click', () => { designCat = name; renderGallery(); });
    tabs.append(b);
  }
  if (!tabsChecked) { // load every category once and hide the ones with no marble pieces
    tabsChecked = true;
    Promise.all(DESIGN_CATS.map(([name]) => loadDesigns(name).then(items => [name, items.length]).catch(() => [name, -1]))).then(res => {
      for (const [name, n] of res) { const b = [...tabs.children].find(x => x.textContent === name); if (b) b.hidden = n === 0; }
      const first = res.find(([, n]) => n > 0);
      if (first && res.find(([name]) => name === designCat)[1] === 0) { designCat = first[0]; renderGallery(); }
    });
  }
  $$('#gallery-tabs button').forEach(b => b.setAttribute('aria-pressed', String(b.textContent === designCat)));
  const box = $('#gallery-grid'), want = designCat;
  box.innerHTML = '<p class="hint">Loading designs…</p>';
  loadDesigns(want).then(items => {
    if (designCat !== want) return;
    box.textContent = '';
    if (!items.length) { box.innerHTML = '<p class="hint">No designs in this category yet.</p>'; return; }
    for (const p of items) {
      const b = document.createElement('button'); b.type = 'button'; b.title = p.t;
      b.innerHTML = `<img loading="lazy" alt="" src="${esc(p.th)}"><span>${esc(p.t)}</span>`;
      b.addEventListener('click', () => pickDesign(p));
      box.append(b);
    }
  }).catch(() => {
    if (designCat !== want) return;
    box.innerHTML = '<p class="hint">Our ready designs load on the iMosaicArt website. Please open this tool at imosaicart.com/pages/mosaic-designer, or upload a picture instead.</p>';
  });
}
async function pickDesign(p) {
  $('#gallery').hidden = true;
  busy(true);
  const img = await loadPhoto(p.img);
  busy(false);
  if (!img) return toast('That design could not be loaded. Please try another one.');
  importedImg = img; importedFile = null; lastSvg = null; sourceData = null;
  $('#ai-redraw').hidden = true;
  // the mosaic takes the piece's proportions at the chosen width
  const h = Math.round(state.sizeW * img.naturalHeight / img.naturalWidth * 2) / 2;
  if (h > 0 && h !== state.sizeH) { state.sizeH = h; $('#size-h').value = h; const [fw, fh] = frameFor(state.sizeW, h); resizeFrame(fw, fh); refresh(); }
  // a piece from our shop opens with its areas already filled; customers can change the colors
  // or clear them and repaint
  $('#up-thumb').src = img.src;
  $('#up-title').textContent = p.t;
  $('#up-link').href = p.u; $('#up-link').hidden = !p.u;
  upKind = 'mosaic'; upStore = true;
  $('#upload-panel').hidden = false;
  applyUpload('colors');
  $('#upload-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------- Save / open / export ---------------- */
let pictureCache = { data: null, url: null };
function pictureURL() {
  if (pictureCache.data !== sourceData) {
    const c = mk(); c.getContext('2d').putImageData(sourceData, 0, 0);
    pictureCache = { data: sourceData, url: c.toDataURL('image/jpeg', .85) };
  }
  return pictureCache.url;
}
function designJSON() {
  const used = [...new Set(state.fills.map(f => f.mat))].map(matById).filter(Boolean);
  return { app: 'imosaicart-design', version: 1, sketch: ink.toDataURL('image/png'),
    fills: state.fills.map(({ x, y, mat, rot, orig }) => ({ x, y, mat, rot, orig })), photoLook: sourceData ? sourceData.photo || false : false,
    gap: state.gap, joint: state.joint, sizeW: state.sizeW, sizeH: state.sizeH, unit: state.unit, look: state.look, tileIn: state.tileIn, mosaicFrom: state.mosaicFrom,
    picture: sourceData ? pictureURL() : null, pictureRect: sourceData ? sourceRect : null, materials: used };
}
let saveTimer = 0;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('mosaic.design', designJSON()), 600); }
async function applyDesign(d, withHistory) {
  if (!d || !d.sketch) throw new Error('bad file');
  for (const m of d.materials || []) {
    if (!matById(m.id)) { chart.push(m); chartIsSample = false; }
    if (m.photo) await loadPhoto(m.photo);
  }
  const img = await loadPhoto(d.sketch);
  const pic = d.picture ? await loadPhoto(d.picture) : null;
  if (pic) { const c = mk(), x = c.getContext('2d'); x.drawImage(pic, 0, 0, W, H); sourceData = x.getImageData(0, 0, W, H); sourceData.photo = d.photoLook === 'final' ? 'final' : !!d.photoLook; sourceRect = d.pictureRect || { x: 0, y: 0, w: W, h: H }; } else sourceData = null;
  state.mosaicFrom = d.mosaicFrom === 'areas' ? 'areas' : 'picture';
  if (withHistory) { history.push(snapshot()); future.length = 0; }
  ictx.clearRect(0, 0, W, H);
  if (img) ictx.drawImage(img, 0, 0, W, H);
  currentInk = ictx.getImageData(0, 0, W, H); inkVer++;
  state.fills = (d.fills || []).filter(f => Number.isFinite(f.x) && Number.isFinite(f.y));
  Object.assign(state, { gap: d.gap ?? 2, joint: d.joint || state.joint, sizeW: d.sizeW || 36, unit: d.unit === 'cm' ? 'cm' : 'in', tileIn: +d.tileIn || .5 });
  state.sizeH = d.sizeH || state.sizeW * .75;
  const [fw, fh] = frameFor(state.sizeW, state.sizeH); resizeFrame(fw, fh);
  $('#tile-size').value = String(state.tileIn); if (!$('#tile-size').value) { state.tileIn = .5; $('#tile-size').value = '0.5'; } markLook();
  $('#gap').value = state.gap; $('#gap-val').textContent = state.gap;
  $('#size-w').value = state.sizeW; $('#size-h').value = state.sizeH; $('#size-unit').value = state.unit; markJoint();
}
$('#save-design').addEventListener('click', () => {
  showJSON('Save design', 'Keep this file to reopen the design later, or send it to a customer so they can color it. It includes the materials it uses.', designJSON(), 'mosaic-design.json');
});
$('#open-design').addEventListener('click', () => $('#file-design').click());
$('#file-design').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    await applyDesign(JSON.parse(await f.text()), true);
    renderChart(); selectMat(state.selected); setMode('color');
    heavy(() => refresh()); toast('Design opened');
  } catch { toast('That file is not an iMosaicArt mosaic design file.'); }
});
$('#export-chart').addEventListener('click', () => showJSON('Export chart', 'Share this file with your team or load it on another device with Import chart.', { app: 'imosaicart-chart', version: 1, materials: chart }, 'material-chart.json'));
$('#import-chart').addEventListener('click', () => $('#file-chart').click());
$('#file-chart').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    const list = Array.isArray(d) ? d : d.materials;
    if (!Array.isArray(list) || !list.length) throw 0;
    const clean = list.filter(m => m && m.name && /^#[0-9a-f]{6}$/i.test(m.base || '') || m?.photo).map((m, i) => ({
      id: String(m.id || 'imp-' + i + '-' + Date.now().toString(36)), name: String(m.name), code: String(m.code || ''),
      type: TYPE_LABEL[m.type] ? m.type : 'marble', style: m.style || (m.type === 'glass' ? 'cathedral' : 'veined'),
      base: m.base || '#cccccc', vein: m.vein || m.base || '#999999', ...(m.photo ? { photo: m.photo } : {}) }));
    for (const m of clean) if (m.photo) await loadPhoto(m.photo);
    // Keep materials the current design still uses.
    const keep = chart.filter(m => state.fills.some(f => f.mat === m.id) && !clean.some(c => c.id === m.id));
    chart = [...clean, ...keep]; saveChart(); tileCache.clear();
    state.selected = chart[0].id; renderChart(); selectMat(state.selected); heavy(() => refresh());
    toast(`Imported ${clean.length} materials`);
  } catch { toast('That file is not a material chart. Use a file made with Export chart.'); }
});
$('#reset-chart').addEventListener('click', async () => {
  if (!(await confirmBox('Reset to the sample chart?', 'Your added materials will be removed. Export your chart first if you want to keep it.', 'Reset chart'))) return;
  chart = SAMPLE_CHART.map(m => ({ ...m })); chartIsSample = true;
  try { localStorage.removeItem('mosaic.chart.v7'); } catch {}
  tileCache.clear(); renderChart(); selectMat(chart[0].id); heavy(() => refresh());
});
$('#export').addEventListener('click', () => heavy(() => {
  const rows = renderBom();
  const rowH = 46, pad = 32, legendH = rows.length ? 70 + rows.length * rowH + 36 : 0;
  const c = document.createElement('canvas'); c.width = W; c.height = H + legendH;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  if (state.mode === 'mosaic') renderMosaic();
  composite(ctx, state.mode === 'mosaic' ? 'mosaic' : 'color');
  if (rows.length) {
    let y = H + 50;
    ctx.fillStyle = '#16335E'; ctx.font = '600 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('iMosaicArt · Materials', pad, y);
    ctx.font = '13px "Hanken Grotesk", sans-serif'; ctx.fillStyle = '#4A5468'; ctx.textAlign = 'right';
    ctx.fillText(`${fmt(state.sizeW)} × ${fmt(state.sizeH)} ${state.unit}`, W - pad, y);
    ctx.textAlign = 'left'; y += 22;
    const unit = state.unit === 'in' ? 'ft²' : 'm²';
    for (const r of rows) {
      if (flatView()) { ctx.fillStyle = r.m.base; ctx.fillRect(pad, y, 34, 34); }
      else ctx.drawImage(getTile(r.m), 0, 0, TILE * .6, TILE * .6, pad, y, 34, 34);
      ctx.strokeStyle = '#DFE4EC'; ctx.strokeRect(pad + .5, y + .5, 33, 33);
      ctx.fillStyle = '#16335E'; ctx.font = '500 16px "Hanken Grotesk", system-ui, sans-serif';
      ctx.fillText(r.m.name, pad + 48, y + 16);
      ctx.fillStyle = '#4A5468'; ctx.font = '12px "Hanken Grotesk", sans-serif';
      ctx.fillText(`${r.m.code || ''}  ${TYPE_LABEL[r.m.type] || 'Marble'}`, pad + 48, y + 32);
      ctx.textAlign = 'right'; ctx.fillStyle = '#16335E'; ctx.font = '14px "Hanken Grotesk", sans-serif';
      ctx.fillText(`${r.pieces == null ? '' : r.pieces + ' pc   '}${r.tiles.toLocaleString()} tiles   ${Math.round(r.share * 100)}%   ${r.area.toFixed(2)} ${unit}`, W - pad, y + 22);
      ctx.textAlign = 'left'; y += rowH;
    }
  }
  lastExport = c;
  const url = c.toDataURL('image/png');
  $('#export-img').src = url; $('#export-dl').href = url;
  $('#export-dlg').showModal();
}));
$('#export-close').addEventListener('click', () => $('#export-dlg').close());

function showJSON(title, hint, obj, filename) {
  const text = JSON.stringify(obj, null, 1);
  $('#json-title').textContent = title; $('#json-hint').textContent = hint;
  $('#json-text').value = text;
  const dl = $('#json-dl');
  if (dl.dataset.url) URL.revokeObjectURL(dl.dataset.url);
  dl.dataset.url = dl.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  dl.download = filename;
  $('#json-dlg').showModal();
}
$('#json-close').addEventListener('click', () => $('#json-dlg').close());
$('#json-copy').addEventListener('click', () => {
  const t = $('#json-text');
  navigator.clipboard?.writeText(t.value).then(() => toast('Copied'), () => { t.select(); toast('Press Ctrl+C to copy'); }) ?? (t.select(), toast('Press Ctrl+C to copy'));
});

/* ---------------- Small helpers ---------------- */
function fileToDataURL(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3200); }
function confirmBox(title, body, ok) {
  const d = $('#confirm-dlg');
  $('#confirm-title').textContent = title; $('#confirm-body').textContent = body; $('#confirm-ok').textContent = ok;
  d.returnValue = '';
  d.showModal();
  return new Promise(res => d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true }));
}

/* ---------------- Draw from a description (Claude) ---------------- */
let lastExport = null, sampleFn = null, imagesOk = false, downloadsApi = null, aiCtl = null, lastSvg = null, importedFile = null;
const svgRules = () => `You draw black-and-white line art that will be cut from marble and glass (waterjet stone inlay, mosaic, stained glass).
Reply with only one SVG document and no other text.
Rules:
- Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">.
- Use only path, line, polyline, polygon, rect, circle, ellipse and g. No text, images, gradients, patterns, filters, CSS or scripts.
- Every shape has fill="none" stroke="#000" stroke-width="3".
- Outlines only. Every area that will be one piece of material must be a fully closed region: lines meet exactly, with no gaps.
- No hatching, shading, texture strokes or details smaller than about 14px; shapes must be bold and practical to cut.
- Keep everything inside x 30-${W - 30}, y 30-${H - 30}. Draw an outer border so the background is a region too. Aim for about 15-90 regions.`;

function svgFromText(text) {
  const m = text.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  const doc = new DOMParser().parseFromString(m[0], 'image/svg+xml');
  const root = doc.documentElement;
  if (root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return null;
  const allowed = new Set(['svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse']);
  for (const el of [...root.querySelectorAll('*')]) {
    if (!allowed.has(el.nodeName.toLowerCase())) { el.remove(); continue; }
    for (const a of [...el.attributes]) if (/^on|href|style|class|filter|mask|clip/i.test(a.name)) el.removeAttribute(a.name);
    if (el.nodeName !== 'g') { el.setAttribute('fill', 'none'); el.setAttribute('stroke', '#000'); el.setAttribute('stroke-width', '3'); el.setAttribute('stroke-linejoin', 'round'); }
  }
  root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!root.getAttribute('viewBox')) root.setAttribute('viewBox', `0 0 ${W} ${H}`);
  root.setAttribute('width', String(W)); root.setAttribute('height', String(H));
  return new XMLSerializer().serializeToString(root);
}
const AI_ERRORS = {
  rate_limited: 'Too many requests right now. Try again in a minute.',
  refused: 'Claude would not draw that. Try describing it differently.',
  session_expired: 'Sign in to Claude again, then retry.',
  image_rejected: 'That image could not be sent. Try a smaller JPG or PNG.',
  empty_completion: 'No drawing came back. Try a simpler description.',
};
async function runAI(kind) {
  const desc = $('#ai-prompt').value.trim();
  let input, opts = {};
  if (kind === 'redraw') {
    input = `${svgRules()}\n\nThe attached image is a customer's design. Redraw it as clean outline line art that follows the rules, keeping its composition and main shapes. Ignore its colors; only the shapes matter.${desc ? '\nAlso apply these changes: ' + desc : ''}`;
    opts.images = [importedFile];
  } else {
    if (!desc) { $('#ai-prompt').focus(); return toast('Describe the design first.'); }
    if ($('#ai-edit').checked) {
      if (lastSvg) input = `${svgRules()}\n\nHere is the current design:\n${lastSvg}\n\nChange it as follows and return the full updated SVG: ${desc}`;
      else if (imagesOk) {
        input = `${svgRules()}\n\nThe attached image is the current design. Redraw it as outline line art, keeping it as close as possible, with these changes: ${desc}`;
        opts.images = [await new Promise(r => { const c = mk(); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(ink, 0, 0); c.toBlob(r, 'image/png'); })];
      } else input = `${svgRules()}\n\nDesign: ${desc}`;
    } else input = `${svgRules()}\n\nDesign: ${desc}`;
  }
  aiCtl = new AbortController();
  const status = $('#ai-status'), go = $('#ai-go'), redraw = $('#ai-redraw');
  go.disabled = redraw.disabled = true; $('#ai-stop').hidden = false;
  status.textContent = 'Thinking…';
  try {
    const { text } = await sampleFn(input, { ...opts, signal: aiCtl.signal, cache: false,
      onText: ({ text }) => { status.textContent = `Drawing… ${(text.length / 1000).toFixed(1)}k`; } });
    const svg = svgFromText(text);
    if (!svg) { status.textContent = 'The drawing came back incomplete. Try again or simplify the description.'; return; }
    const img = await loadPhoto('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    if (!img) { status.textContent = 'The drawing could not be read. Try again.'; return; }
    lastSvg = svg; importedImg = img; sourceData = null; $('#trace-field').hidden = true;
    heavy(() => { state.fills = []; traceImage(); commit(true); refresh(); });
    status.textContent = 'Done. Fix any lines by hand, or describe a change and tick "Change the current sketch".';
    $('#ai-edit').checked = true;
  } catch (e) {
    if (e?.code === 'cancelled') { status.textContent = 'Stopped.'; return; }
    if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e?.code)) {
      $('#ai-box').hidden = true; $('#ai-redraw').hidden = true; $('#ai-off').hidden = false; return;
    }
    status.textContent = AI_ERRORS[e?.code] || 'Something went wrong while drawing. Try again.';
  } finally {
    go.disabled = redraw.disabled = false; $('#ai-stop').hidden = true; aiCtl = null;
  }
}
$('#ai-go').addEventListener('click', () => runAI('describe'));
$('#ai-redraw').addEventListener('click', () => runAI('redraw'));
$('#ai-stop').addEventListener('click', () => aiCtl?.abort());

/* ---------------- Real swatch photos ---------------- */
// The store's color-palette page shows sw-01.png ... sw-48.png from the live theme: 01-42 natural
// marble, 43-48 engineered stone. An editor imports them once through their Shopify connector; the
// photos are stored with this page and listed in the db doc below, so every viewer sees them.
const SWATCH_DOC = 'swatches/photos';
const swatchId = n => (n <= 42 ? 'm' : 'e') + String(n).padStart(2, '0');
// Average color of a photo's middle, so color matching follows the real stone.
function photoColor(img) {
  const c = document.createElement('canvas'); c.width = c.height = 24;
  const side = Math.min(img.naturalWidth, img.naturalHeight) / 2;
  const x = c.getContext('2d');
  x.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 24, 24);
  const d = x.getImageData(0, 0, 24, 24).data; let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4, h = v => Math.round(v / n).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}
async function applySwatchPhotos(map) {
  let n = 0;
  for (const [id, assetId] of Object.entries(map || {})) {
    const m = matById(id);
    if (!m || typeof assetId !== 'string' || !/^[0-9a-f]{32}$/.test(assetId)) continue;
    const src = '/_blob/' + assetId, img = await loadPhoto(src);
    if (!img) continue;
    m.photo = src; m.base = photoColor(img); n++;
  }
  if (!n) return;
  tileCache.clear(); labCache.clear();
  $('#sample-note').textContent = 'Stones show the real swatch photos from the iMosaicArt palette.';
  renderChart(); selectMat(state.selected); heavy(() => refresh());
}
async function importSwatches(mcp, assets, db) {
  const btn = $('#import-swatches'), status = $('#import-status');
  btn.disabled = true; status.hidden = false;
  const map = {}, failed = [];
  try {
    for (let start = 1; start <= 48; start += 3) {
      const names = [start, start + 1, start + 2].filter(n => n <= 48).map(n => `assets/sw-${String(n).padStart(2, '0')}.png`);
      status.textContent = `Importing swatch ${start} of 48…`;
      const res = await mcp.callTool('Shopify', 'graphql_query', {
        query: `query($names: [String!]) { themes(first: 1, roles: [MAIN]) { nodes { files(first: 3, filenames: $names) { nodes { filename body { ... on OnlineStoreThemeFileBodyBase64 { contentBase64 } } } } } } }`,
        variables: { names }, first: 1,
      }, { cache: false });
      const nodes = res.payload?.data?.themes?.nodes?.[0]?.files?.nodes || [];
      for (const name of names) {
        const node = nodes.find(f => f.filename === name), b64 = node?.body?.contentBase64;
        const num = +name.match(/sw-(\d+)/)[1];
        if (!b64) { failed.push(num); continue; }
        const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
        const up = await assets.upload(new Blob([bytes], { type: 'image/png' }), { type: 'image/png' });
        map[swatchId(num)] = up.id;
      }
    }
    await db.doc(SWATCH_DOC).set({ map, importedAt: new Date().toISOString() });
    await applySwatchPhotos(map);
    status.textContent = failed.length ? `Imported ${48 - failed.length} swatch photos. Not found in the theme: ${failed.join(', ')}.` : 'Imported all 48 swatch photos. Every visitor now sees them.';
  } catch (e) {
    const copy = {
      server_not_connected: 'Connect Shopify in claude.ai Settings → Connectors, then try again.',
      needs_reauth: 'Reconnect Shopify in claude.ai Settings → Connectors, then try again.',
      not_in_manifest: 'Shopify access is turned off for this page. Allow it from the page\'s Permissions menu, then try again.',
      approval_required: 'Importing needs your approval for Shopify. Click again and choose Allow.',
      quota_or_state: 'There is no room left to store the photos with this page.',
    };
    status.textContent = copy[e?.code] || 'The import stopped partway. Click the button to try again.';
  } finally { btn.disabled = false; }
}
async function initSwatches() {
  if (!window.claude?.use) return;
  const db = await claude.use('db').catch(() => null);
  if (db) {
    try { const snap = await db.doc(SWATCH_DOC).get(); if (snap.exists) await applySwatchPhotos(snap.data().map); } catch {}
  }
  const [mcp, assets] = await Promise.all([claude.use('mcp').catch(() => null), claude.use('assets').catch(() => null)]);
  if (!mcp || !assets || !db) return; // only editors with the Shopify connector can import
  $('#import-swatches').hidden = false;
  $('#import-swatches').addEventListener('click', () => importSwatches(mcp, assets, db));
}

async function initCapabilities() {
  initSwatches();
  $('#ai-box').hidden = true;
  if (!window.claude?.use) { // describing a design needs Claude; outside it, offer upload and drawing only
    $('#ai-more').hidden = true; $('[data-start="describe"]').hidden = true; return;
  }
  const [s, d] = await Promise.all([claude.use('sample').catch(() => null), claude.use('downloads').catch(() => null)]);
  downloadsApi = d;
  if (!s) { $('#ai-off').hidden = false; return; }
  sampleFn = s;
  imagesOk = !!(await s.limits().catch(() => null))?.images;
  $('#ai-box').hidden = false;
}
// Inside Claude the sandbox blocks plain download links; offer the file through the viewer instead.
async function offerDownload(e, filename, getData) {
  if (!downloadsApi) return; // plain <a download> works outside Claude
  e.preventDefault();
  try { await downloadsApi.save({ filename, data: await getData() }); toast('Saved'); }
  catch (err) { if (err?.code !== 'declined') toast('Saving is not available here. Right-click or long-press to save instead.'); }
}
$('#export-dl').addEventListener('click', e => offerDownload(e, 'mosaic-design.png', () => new Promise(r => lastExport.toBlob(r, 'image/png'))));
$('#json-dl').addEventListener('click', e => offerDownload(e, $('#json-dl').download, () => $('#json-text').value));

/* ---------------- Boot ---------------- */
async function boot() {
  await Promise.all(chart.filter(m => m.photo).map(async m => {
    const img = await loadPhoto(m.photo);
    // on the website the photos are the store's originals: match colors on the photo itself
    if (img && !m.photo.startsWith('data:')) try { m.base = photoColor(img); } catch {}
  }));
  labCache.clear();
  // every visit opens on a blank canvas with the start choices above it;
  // customers keep their work with Save design / Open design
  ictx.clearRect(0, 0, W, H); currentInk = ictx.getImageData(0, 0, W, H); inkVer++; state.fills = [];
  if (!matById(state.selected)) state.selected = chart[0]?.id;
  markJoint(); markLook(); state.mode = 'color'; setTool('fill');
  renderChart(); selectMat(state.selected); setMode('sketch'); // customers start at step 1, Design
  setTool('pen');
  heavy(() => refresh());
  fitSlab(); applyView();
  $('#start').hidden = false;
}
boot();
initCapabilities();
})();
