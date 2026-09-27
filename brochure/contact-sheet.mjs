/* Builds dist/contact-sheet.png — every page at a glance, for quick review. */
import { chromium } from "playwright";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const PREV = join(import.meta.dirname, "dist", "preview");
const pages = readdirSync(PREV).filter((f) => f.endsWith(".png")).sort();

const html = `<!DOCTYPE html><meta charset="utf-8"><style>
  body { margin:0; background:#F4F6FA; font-family:system-ui,sans-serif; padding:28px; }
  .grid { display:grid; grid-template-columns:repeat(6,1fr); gap:18px; }
  figure { margin:0; }
  img { width:100%; display:block; border:1px solid #D2DCEB; background:#fff; }
  figcaption { font-size:11px; color:#47597A; letter-spacing:.08em; margin-top:6px; text-transform:uppercase; }
</style><div class="grid">
${pages.map((f, i) => `<figure><img src="file://${resolve(PREV, f)}"><figcaption>${String(i + 1).padStart(2, "0")}</figcaption></figure>`).join("")}
</div>`;

const tmp = join(import.meta.dirname, ".sheet.html");
writeFileSync(tmp, html);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1800, height: 1200 } });
await p.goto("file://" + tmp, { waitUntil: "load" });
await p.locator(".grid").screenshot({ path: join(import.meta.dirname, "dist", "contact-sheet.png") });
await b.close();
rmSync(tmp, { force: true });
console.log(`contact sheet: ${pages.length} pages`);
