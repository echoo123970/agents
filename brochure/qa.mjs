/* ============================================================
   LAYOUT QA — flags content that overflows its page or collides
   with the folio. Catches what eyeballing 24 pages misses.
     node qa.mjs
   ============================================================ */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dirname, "src");
const tmp = join(SRC, ".qa.html");
writeFileSync(tmp, readFileSync(join(SRC, "index.html"), "utf8").replace("<!--PHOTO_INJECT-->", ""));

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto("file://" + tmp, { waitUntil: "load" });
await page.emulateMedia({ media: "print" });
await page.evaluate(() => document.fonts.ready);

const report = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".page").forEach((pg, i) => {
    const box = pg.getBoundingClientRect();
    const folio = pg.querySelector(".folio");
    const limit = folio ? folio.getBoundingClientRect().top : box.bottom;
    const issues = [];

    for (const el of pg.querySelectorAll("*")) {
      if (!el.textContent.trim() && !el.classList.contains("photo")) continue;
      if (el.classList.contains("folio") || el.closest(".folio")) continue;
      const r = el.getBoundingClientRect();
      if (r.height === 0 || r.width === 0) continue;
      const label = (el.className || el.tagName).toString().slice(0, 40);
      if (r.bottom > box.bottom + 1) issues.push(`off page bottom by ${Math.round(r.bottom - box.bottom)}px — ${label}`);
      else if (r.bottom > limit + 1 && !el.closest(".bleed")) issues.push(`overlaps folio by ${Math.round(r.bottom - limit)}px — ${label}`);
      if (r.right > box.right + 1) issues.push(`off page right by ${Math.round(r.right - box.right)}px — ${label}`);
    }
    // de-duplicate parents reporting the same overflow as their children
    const seen = new Set(), unique = issues.filter((s) => !seen.has(s) && seen.add(s));
    if (unique.length) out.push({ page: i + 1, issues: unique.slice(0, 4) });
  });
  return out;
});

await browser.close();
rmSync(tmp, { force: true });

if (!report.length) console.log("layout: all pages clear");
else for (const { page: n, issues } of report) {
  console.log(`page ${String(n).padStart(2, "0")}:`);
  for (const i of issues) console.log(`   ${i}`);
}
