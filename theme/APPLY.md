# How to Apply This Package to the Draft Theme

Target: **draft** theme `Copy of Copy of Live theme` (theme store ID = Dawn).
**Never apply to the live theme.** Preview everything before publishing.

> ⚠️ The provided JSON templates use **standard Dawn section types**, so they're safe on a
> Dawn-based theme. If your draft theme has heavily customized/renamed sections, reconcile
> section keys after import (the editor will flag anything it doesn't recognize).

---

## Order of operations
1. **Metafields first** — follow `theme/SETUP-METAFIELDS.md` (templates reference them).
2. **Brand settings** — apply `theme/BRAND-SETTINGS.md` in the theme editor.
3. **Templates** — install `theme/templates/index.json`, `product.json`, `collection.json`.
4. **Collection handles** — open `index.json`, set the empty `"collection": ""` values to your
   real collection handles (best sellers, new arrivals, and the 4 "shop by category" tiles).
5. **Search & Discovery** — install Shopify's free **Search & Discovery** app → enable
   filters (price, availability, `custom.style`) and **product recommendations** (related +
   complementary). This powers the dynamic filtering and the "You may also like" / "Pairs
   well with" blocks already in `product.json`.
6. **Smart collections** — create automated collections: Best Sellers, New Arrivals
   (created in last 30 days), On Sale, and style-based ones driven by tags/`custom.style`.
7. **Preview** the draft theme on desktop + mobile, iterate, then **publish on sign-off**.

---

## Three ways to install the template JSON

### A. Admin (no tools) — easiest
Online Store → Themes → `Copy of Copy of Live theme` → **⋯ → Edit code** →
open `templates/index.json` (and `product.json`, `collection.json`) → paste the file
contents from this repo → Save. Then open **Customize** to fine-tune visually.

### B. Shopify CLI (developer)
```bash
shopify theme pull --theme "Copy of Copy of Live theme"   # back up first
cp theme/templates/*.json <pulled-theme>/templates/
shopify theme push --theme "Copy of Copy of Live theme" --only templates/index.json templates/product.json templates/collection.json
```

### C. Assistant via Shopify MCP (a Shopify-connected Claude session)
Ask the assistant to run `themeFilesUpsert` against the draft theme's GID for each template:
```graphql
mutation upsert($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $themeId, files: $files) {
    upsertedThemeFiles { filename }
    userErrors { filename code message }
  }
}
```
…with `filename: "templates/index.json"` and `body: { value: <file contents> }` per file.
The draft theme GID is resolved from `themes(roles:[UNPUBLISHED])` by matching the name.

---

## Resume prompt (paste into a Shopify-connected session)
> "Apply the iMosaicArt theme package in `theme/` to the DRAFT theme 'Copy of Copy of Live
> theme' using themeFilesUpsert: create the metafields in SETUP-METAFIELDS.md, upsert the
> three templates, then set the collection handles in index.json. Never touch the live theme.
> Give me a preview link when done; publish only on my approval."
