# iMosaicArt — Whole-Store Design Upgrade & "Dynamic" Optimization Plan

**Store:** iMosaicArt (`www.imosaicart.com`) · Shopify Basic · USD · EDT
**Catalog:** ~1,530 products · 26 collections · sells mosaic / wall art
**Live theme:** "Copy of Live theme" (Dawn-based, OS 2.0) — **DO NOT EDIT**
**Work theme (draft):** **"Copy of Copy of Live theme"** — all changes happen here
**Approach:** Path A — customize within Shopify on the draft theme, publish only after sign-off.

> This is the execution blueprint. Run each step in a session with the **Shopify connector active**.
> Every change is previewed on the draft theme; the live store is never touched until Step 8.

---

## Step 1 — Verify & prep the draft theme
- [ ] Confirm theme **"Copy of Copy of Live theme"** exists and is **UNPUBLISHED**.
- [ ] Confirm it is OS 2.0 (JSON templates under `templates/*.json`, sections support).
- [ ] Snapshot current state: list `templates/`, `sections/`, `config/settings_data.json`.
- [ ] Clean up the ~9 stale draft themes once the keeper is confirmed (ask first).

## Step 2 — Brand foundation (`config/settings_data.json`)
Make every page visually cohesive before touching layout.
- [ ] **Color schemes:** define 3–4 schemes (light, dark/accent, muted) with consistent
      background / text / button / border tokens. Mosaic art benefits from a neutral
      gallery backdrop (off-white / warm grey) so the artwork pops.
- [ ] **Typography:** one display font for headings, one readable sans for body. Set
      heading scale and base body size (16px+).
- [ ] **Logo & favicon:** confirm high-res logo, set header logo width, set favicon.
- [ ] **Buttons & corners:** consistent radius, border thickness, hover style.
- [ ] **Spacing:** page width, section vertical spacing, grid gaps — set globally.

## Step 3 — Homepage redesign (dynamic OS 2.0 sections) `templates/index.json`
Rebuild from reorderable sections (drag-and-drop = the "dynamic" part):
1. [ ] **Hero** — image or video banner, clear value prop + CTA ("Shop Wall Art").
2. [ ] **Featured / seasonal collections** — `featured-collection` section(s).
3. [ ] **Shop by category** — `collection-list` block linking your top collections.
4. [ ] **Best sellers** — `featured-collection` bound to a bestseller collection (see Step 5).
5. [ ] **Social proof** — reviews / testimonials / trust badges.
6. [ ] **Brand story** — short "about the art" section with image.
7. [ ] **Email capture** — newsletter section (wired to Klaviyo signup).

## Step 4 — Product pages + metafields `templates/product.json`
Make all 1,530 product pages show structured, dynamic specs automatically.
- [ ] **Define metafields** (Settings → Custom data → Products):
  - `custom.material` (single line) — e.g. glass, ceramic, stone
  - `custom.dimensions` (single line) — e.g. 24" × 36"
  - `custom.frame_type` (single line / list)
  - `custom.artist` (single line)
  - `custom.care_instructions` (multi-line)
  - `custom.style` (list) — for filtering (abstract, landscape, religious, etc.)
- [ ] **Bind to template:** add metafield blocks to `main-product` so specs render via
      dynamic sources (shows only when a product has the value).
- [ ] **Gallery:** enable thumbnails / zoom; ensure consistent image aspect ratios.
- [ ] **Trust block:** shipping, returns, secure-checkout badges under add-to-cart.
- [ ] **Cross-sell:** complementary + related products (Step 6).

## Step 5 — Collections, filtering & search `templates/collection.json`
Critical at 1,530 products.
- [ ] **Smart (automated) collections:** create rule-based collections that self-populate:
      e.g. **Bestsellers**, **New Arrivals** (created in last 30 days), **On Sale**,
      plus style-based collections driven by the `custom.style` / tags.
- [ ] **Filtering:** enable Shopify Search & Discovery app filters — by price, availability,
      `custom.style`, size/dimensions, color. (You already trialed Searchanise in one draft;
      pick one filtering solution, not both.)
- [ ] **Grid & sorting:** 3–4 columns desktop / 2 mobile, enable sort (price, newest, best
      selling), and set products-per-page sensibly for fast loads.

## Step 6 — Personalization & recommendations
- [ ] Enable **related products** on `product.json` (Shopify Search & Discovery → Recommendations).
- [ ] Add **complementary products** ("Pairs well with") block.
- [ ] Add **recently viewed** section (product + cart pages).

## Step 7 — Mobile polish + speed
- [ ] Audit every section's **mobile** layout (stacking, font sizes, tap targets).
- [ ] Ensure images are responsive + lazy-loaded; remove oversized hero images.
- [ ] Audit installed apps — remove/!defer unused scripts (biggest Basic-plan speed killer).
- [ ] Run Shopify's built-in speed report + Lighthouse; record before/after.

## Step 8 — Final review & publish
- [ ] Generate a **preview link** for the draft theme; you review on desktop + mobile.
- [ ] Iterate on feedback.
- [ ] **Publish only after explicit sign-off.** Keep the previous live theme as a backup.

---

## How to resume (paste into a fresh session with Shopify connected)
> "Resume the iMosaicArt design upgrade per `imosaicart-redesign-plan.md` — Path A on draft
> theme 'Copy of Copy of Live theme', whole store. Start at Step 1 (verify draft theme),
> then work through the steps in order. Never touch the live theme; publish only on my sign-off."
