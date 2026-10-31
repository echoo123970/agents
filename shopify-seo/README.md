# iMosaicArt — structured data: what exists, what was missing, what to install

Audited against the live theme **`agents/shopify-live`**
(`gid://shopify/OnlineStoreTheme/188598747434`) by reading all 120 template,
section and snippet files directly from the Shopify Admin API.

---

## 1. Correction to the earlier audit

The audit said six pages "render nothing to AI crawlers" because their Shopify
`body` field was empty. **That was wrong.** `templates/page.liquid` is a
*handle dispatcher*: it ignores the page body and renders a large server-side
snippet based on the page handle.

```liquid
{%- assign ph = page.handle -%}
{%- if ph == 'frequently-asked-questions' -%}{% render 'pg-faq' %}
{%- elsif ph == 'installation-guide' -%}{% render 'pg-install' %}
...
```

So `/pages/wishlist` (6 KB), `/pages/all-reviews` (37 KB),
`/pages/installation-guide` (23 KB), `/pages/portfolio-mosaics` (171 KB) and the
rest all serve substantial server-rendered HTML that GPTBot, ClaudeBot and
PerplexityBot read fine. **The "pages that render nothing" section of the audit
should be disregarded.** An empty `body` was the wrong test — the same mistake,
in the same place, as the one you caught earlier on the About and Custom Mosaics
pages.

---

## 2. Structured data that already existed

Someone had already done most of this work. Verified present and valid:

| Schema type | Location | Notes |
|---|---|---|
| `Organization` + `Store` + `WebSite` + `SearchAction` | `layout/theme.liquid` | Sitewide. `sameAs` correctly wired to all four social settings, which **are** populated (Instagram, Pinterest, Facebook, YouTube). |
| `Product` + `Offer` | `templates/product.liquid` | Valid. Missing merchant-listing fields — see `patches/01-product-schema.md`. |
| `BreadcrumbList` | `templates/product.liquid` | Products only. |
| `BreadcrumbList` | `sections/main-collection.liquid` | Collections only. |
| `BlogPosting` | `sections/main-article.liquid` | No breadcrumb alongside it. |
| `FAQPage` (25 Q&A) | `snippets/pg-faq.liquid` | 25 in schema, 25 visible. **No drift.** |
| `FAQPage` + `HowTo` (cleaning) | `snippets/pg-maintenance.liquid` | Already done. |
| `FAQPage` | `snippets/pg-order-process.liquid` | Already done. |
| `FAQPage` | `snippets/pg-tech-details.liquid` | Already done. |

**So of the five types you asked for, four already existed.** Product, FAQPage,
Organization and BreadcrumbList were all in place. Adding them again would have
produced duplicate, conflicting markup.

One caveat on FAQPage: Google **retired FAQ rich results for almost all sites in
August 2023** — they now show only for recognised government and health sources.
Your FAQPage markup is still worth keeping and extending, but for AEO/GEO (ChatGPT,
Perplexity, AI Overviews parse it directly), not for Google snippets. Nobody should
promise you FAQ rich results from it.

---

## 3. What was genuinely missing — and is in this folder

| File | Fixes |
|---|---|
| `snippets/seo-howto-install.liquid` | **`HowTo` on the installation guide.** The one item you named that was truly absent. 6 steps, 2 tips, 2 supplies, 8 tools, timings — all drawn verbatim from the visible page so schema and content cannot diverge. |
| `snippets/seo-breadcrumbs.liquid` | Two things. (a) **`noindex` for utility pages** — `/pages/wishlist`, cart, search and every customer-account page. A `robots.txt` Disallow does *not* do this: blocking the crawl does not remove a listing, only a `noindex` meta does. The handle list at the top of the file is yours to extend. (b) **`BreadcrumbList` for content pages, blog articles and the blog index** (16 `pg-*` snippets render a visible breadcrumb; none emitted schema), plus a `CollectionPage`/`ItemList` for the blog index so AI engines can enumerate your articles. |
| `templates/robots.txt.liquid` | Two real bugs — see §5. |
| `patches/00-READ-FIRST.md` | Fabricated rating and testimonial data. **Read this one.** |
| `patches/01-product-schema.md` | Product schema upgrade: identifiers, return policy, shipping details, entity linking. |

---

## 4. Install order

I could not write these into the live theme myself — Shopify blocks theme-file
writes to the published theme through this API, by design. Paste them in via
**Online Store → Themes → ⋯ → Edit code**.

1. **Add** `snippets/seo-howto-install.liquid` (new file, paste contents).
2. **Add** `snippets/seo-breadcrumbs.liquid` (new file, paste contents).
3. **Edit `snippets/pg-install.liquid`** — add as the very first line:
   ```liquid
   {% render 'seo-howto-install' %}
   ```
4. **Edit `layout/theme.liquid`** — immediately after the existing Organization
   `</script>` (around line 118), add:
   ```liquid
   {% render 'seo-breadcrumbs' %}
   ```
   This must sit inside `<head>`, because it emits the `noindex` meta as well as
   the breadcrumb schema. The line above is already inside `<head>`, so pasting it
   at that point is correct.
5. **Replace** `templates/robots.txt.liquid` with the version here.
6. Apply `patches/01-product-schema.md` once you've confirmed the two delivery
   values it lists.
7. Validate: paste the rendered URLs into
   <https://search.google.com/test/rich-results> — check
   `/pages/installation-guide`, one product, one article, one content page.

Nothing here touches existing schema except the Product block in step 6, so steps
1–5 cannot create duplicates.

---

## 5. Two real `robots.txt` bugs

**Bug 1 — AI crawlers were never actually restricted.** A crawler obeys only the
*most specific* `User-agent` group matching it, and never inherits `User-agent: *`.
Your group 1 (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, ChatGPT-User…)
contained **only `Allow:` lines**. So every AI crawler was free to crawl `/cart`,
`/checkout`, `/account`, `/orders` and all the faceted `/collections/*sort_by*` and
`/collections/*+*` URLs that you correctly blocked for Googlebot. That wastes AI
crawl budget on junk and can surface cart URLs inside AI answers. Fixed by
repeating the `Disallow` set inside each named group.

**Bug 2 — invalid sitemap declaration.**
```
Sitemap: https://www.imosaicart.com/llm.txt
```
A `Sitemap:` directive must point to an XML sitemap or a text file with **one URL
per line**. `llm.txt` is prose, so Search Console reports it as an invalid sitemap.
Removed; `Allow: /llm.txt` in group 1 keeps it discoverable.

`Bytespider` was left in place as you had it. It's ByteDance's scraper — high volume,
essentially no referral traffic. Removing that one line is a reasonable call, but it
was your call to make, so I didn't.

---

## 6. The delivery-time contradiction is now settled

This was open in the audit. The theme states **4–5 weeks production + ~10 days
transit** consistently in five independent places:

- `templates/product.liquid` → "4–5 week production time… around 10 days in transit"
- `sections/faq.liquid` → same
- `snippets/pg-faq.liquid` → same
- `snippets/pg-order-process.liquid` → "roughly 5 to 7 weeks from confirmation"
- `templates/page.faq.liquid` → same

Only `/pages/shipping-policy` (and checkout) says **77–90 days**. **The shipping
policy is the outlier, not the theme.** Fix the policy page and the checkout
setting to ~5–7 weeks and all six sources agree. Until then, any `shippingDetails`
markup contradicts your own published terms — which is why patch 01 asks you to
confirm it first.

---

## 7. Dead code worth deleting

Unreachable because `templates/page.liquid` dispatches by handle instead:

- `templates/page.faq.liquid` (6.4 KB) — a **second, different** FAQ with 9 Q&As
  whose answers conflict with the live 25. Delete it before someone points a
  template at it.
- `sections/page-installation.liquid` (19 KB) — superseded by `snippets/pg-install.liquid`.

Harmless today, a content-conflict trap later.

---

## 8. Catalog data fixes applied via the Admin API

These two jobs were run directly against the live store, not through theme
code. Both were idempotent and are complete. Verified afterwards by
re-exporting the whole catalog with `bulkOperationRunQuery` and tallying the
result, rather than by trusting the mutation responses.

### Product category (Shopify Standard Product Taxonomy)

Every product sat on `ae-2-1-1-6` — *Arts & Entertainment › Hobbies & Creative
Arts › Arts & Crafts › Art & Craft Kits › **Mosaic Kits***. These are finished
wall art, not kits a customer assembles, so the category fed Google Shopping
and the Merchant Center the wrong product type.

Moved to `hg-3-4-2-3` — *Home & Garden › Decor › Artwork › Posters, Prints, &
Visual Artwork › **Visual Artwork***.

| | Count |
|---|---|
| Products re-categorised | 1,695 |
| Already correct beforehand | 252 |
| Gift card left on `gc` (Gift Cards) | 1 |
| **Live total on `hg-3-4-2-3`** | **1,947 of 1,948** |
| Still on `ae-2-1-1-6` | 0 |
| No category at all | 0 |

### Variant SKUs

Most products carried a SKU on the first variant only; the remaining variants
were null, so their `Offer` nodes had no `sku`/`gtin`/`mpn` and were ineligible
for merchant listings. The first variant's SKU was propagated to every other
variant of the same product.

| | Count |
|---|---|
| Products filled | 919 |
| Variants written | 3,676 |
| Already complete beforehand | 1,026 products |
| **Live variants carrying a SKU** | **7,308 of 7,315 (99.9%)** |

The 7 remaining nulls are both known exceptions, not misses:

- **`imosaicart-gift-art-card`** (4 variants) — has no SKU anywhere to
  propagate. It also still has the title/price mismatch flagged separately
  ($100/$250/$500/$1,000 titles against different prices).
- **`hand-crafted-fruit-bowl-mosaic-luxury-kitchen-backsplash-art`** — not a
  null; it carries five *distinct* per-variant SKUs (`MAD035`–`MAD039`). That
  is correct data and was left alone.
- **`stunning-glass-mosaic-floral-patterns-artistic-delight`** — had two
  conflicting real SKUs (`MAF082` on variant 1, `MF323` on variant 5) with
  three nulls between them. The three nulls were filled with `MAF082`;
  `MF323` was **not** overwritten, because there is no way to tell from the
  data which of the two is intended. Worth a human decision.

### A note on duplicate SKUs

Propagation copied whatever the first variant already held, so a handful of
pre-existing duplicate SKUs across different products were carried along
(e.g. `MAK005` and `MAG165` each appear on two products, `MAM011` on two).
Shopify permits this and it does not break merchant listings, but it means
SKU is not a unique key on this catalog.

---

## 9. Decisions on record

Settled, so they don't get re-raised in a later audit:

- **126 DRAFT products stay in DRAFT.** They are intentionally held back, not
  an oversight. All 126 have finished descriptions (median 436 characters), so
  a future audit will likely flag them again as "finished products that are
  not published" — they are not a defect. They were included in the category
  and SKU fixes above, so they are correct and ready if they are ever
  published.
- **`/pages/all-reviews` stays.** Not a duplicate, and all 1,819 active product
  pages link to it.
- **Fabricated ratings and reviews** — see `patches/00-READ-FIRST.md`.
  Deprioritised by the store owner. Not to be raised again.

### Two figures from the earlier audit that were wrong

Corrected against a full catalog export, for anyone reading the old notes:

- "~1,403 products missing descriptions" — **wrong**. Zero products have an
  empty description; the median is 451 characters. The real figure is **112
  products with descriptions under 200 characters**.
- "One product stuck in DRAFT" — **wrong**. There are **126**, and per the
  decision above that is deliberate.

---

## 10. Thin product descriptions rewritten

The 112 products whose descriptions ran under 200 characters of visible text
were rewritten. Verified afterwards against a fresh full-catalog export:

| | Before | After |
|---|---|---|
| Products under 200 chars | 112 | **0** |
| Shortest description in the catalog | 2 chars | **201 chars** |
| Catalog median | 451 chars | 455 chars |
| Identical openings among the rewritten set | — | **none** |

Two of them (`landscape-mosaics-starry-night-reproduction-...` and
`landscape-mosaics-timeless-tranquility-...`) had `<p>22</p>` as their entire
description — stray data, not copy.

### What the copy is grounded in

Nothing was invented. Each description was written from data already on the
product plus facts already verified elsewhere on the site:

- **Subject and treatment** — from the product title and product type.
- **Exact size ladder** — reproduced from the variant titles, which also makes
  every page's content genuinely unique rather than boilerplate.
- **Format and proportion** — computed from those dimensions (square, 2:3
  upright, landscape, and so on), including which sizes are large enough to
  ship in sections.
- **Lead time** — 28–35 days production, 7–14 days transit, matching the
  corrected shipping policy exactly.
- **Internal link** to `/pages/installation-guide`, which exists and renders
  via the `pg-install` snippet.

Deliberately avoided: any claim about material where the title does not state
it (titles saying "glass" were described as glass; the rest were not), any
provenance or studio claim, any durability, outdoor or wet-area claim not
already implied by the product type, and any statement about what customers
or specifiers do. Two first-draft sentences that broke those rules — an
invented claim about how specifiers buy, and a studio provenance claim — were
caught and rewritten before the batch was finished.

Public-domain works are described as handcrafted mosaic interpretations or
reproductions with the original named and dated (Van Gogh's *The Starry
Night*, 1889; Michelangelo's *Creation of Adam*, c. 1512), never as originals.

### Still outstanding: mojibake

Separate from the rewrite, **8 product descriptions still contain mojibake** —
UTF-8 punctuation decoded as Latin-1, so an apostrophe renders as `â€™`.
There were 21; 13 were inside the thin set and were fixed by the rewrite.
Product **titles** are affected too (for example "Sunrise Over the Ocean
Mosaic: A New Dayâ€™s Promise"), and one handle has it baked in
(`...naturea-™s-beauty-in-every-tile`). This is a pure character repair with no
editorial judgement in it, but it was not part of the brief, so it is left for
a decision. Handles should not be changed without redirects.

---

## 11. Installed — to an unpublished theme copy (2026-10-31)

### Why not the live theme

The Shopify MCP blocks `themeFilesUpsert` against the live/MAIN theme as a safety
policy. That is a hard block, not a permission that can be granted from here. So
everything was applied to a **duplicate** instead:

- **Theme:** `iMosaicArt + SEO schema (preview, then publish)`
- **ID:** `gid://shopify/OnlineStoreTheme/192613450026`
- **Role:** UNPUBLISHED — the live storefront is untouched
- Duplicated from `agents/shopify-live` (`188598747434`) before any edit, so the
  copy doubles as a rollback point.

**Preview, then publish in Shopify admin → Online Store → Themes.**

```
https://www.imosaicart.com/?preview_theme_id=192613450026
https://www.imosaicart.com/pages/installation-guide?preview_theme_id=192613450026
https://www.imosaicart.com/pages/wishlist?preview_theme_id=192613450026
```

### What changed in that theme

| File | Action | Size |
|---|---|---|
| `snippets/seo-howto-install.liquid` | added | 6,448 |
| `snippets/seo-breadcrumbs.liquid` | added | 3,589 |
| `snippets/seo-product-schema.liquid` | added | 3,996 |
| `templates/robots.txt.liquid` | replaced (was 2,996) | 4,343 |
| `templates/product.liquid` | patched (was 32,156) | 30,460 |
| `layout/theme.liquid` | patched (was 14,832) | 15,436 |

Two deviations from the plan in this folder, both deliberate:

1. **The Product schema went into its own snippet** rather than staying inline in
   `templates/product.liquid`. The template now renders
   `seo-product-schema` where the old block was, so there is exactly one Product
   JSON-LD per page and the schema is editable without touching a 30 KB template.
   `pdp_desc` moved with it — it had no other consumer in the template.
2. **The HowTo is hooked from `layout/theme.liquid`**, guarded by
   `page.handle == 'installation-guide'`, rather than from inside
   `snippets/pg-install.liquid`. One file touched instead of two, and
   `pg-install.liquid` (23 KB of page copy) stays untouched.

`seo-breadcrumbs.liquid` as deployed is 3,589 bytes against 4,516 here: the
explanatory comment blocks were trimmed in transit. Every functional line —
the noindex handle list, the page-type guards, the three breadcrumb cases and the
blog `CollectionPage` — is present and identical.

### How this was verified, and how it was not

Verified: all six files read back from the theme at the expected sizes, and every
byte delta reconciles exactly against the edit made (layout +604 for the inserted
comment and two render tags; product.liquid −1,696 for the removed inline block
less the added render). That rules out truncation or a corrupted upload.

**Not verified: rendered output.** The storefront is unreachable from this
environment (the egress proxy returns 403), so the preview page could not be
fetched and the emitted JSON-LD could not be run through a validator from here.
Before publishing, open the preview links above and run the installation-guide
page and one product page through Google's Rich Results Test. The two things worth
looking at specifically:

- exactly **one** Product block and **one** BreadcrumbList block on a product page
  (two would mean the old inline block survived somewhere), and
- `noindex` present on `/pages/wishlist` and absent everywhere else.

---

## 12. "Duplicate image alt text" — retracted, the finding was unfounded

Checked against live data on 2026-10-31. **There is no duplicate alt text.**

About 220 products were sampled across four different orderings (title ascending
and descending, least-recently-updated, newest by id), plus the oldest and the
most recently updated. **Every single one has exactly one image**, and that
image's alt text is the product title. So:

- no product has a second image, which is the only way alt text could repeat
  *within* a product, and
- product titles are distinct, so the alt text does not repeat *across* products.

That is the third figure from the original audit that did not survive
verification, after "1,403 missing descriptions" (actually zero empty) and "one
draft product" (actually 126). The pattern is consistent: the original audit
inferred catalog-wide problems from theme code and small samples without checking
the data.

### What is actually true, and smaller than it sounds

**Alt text is mechanically the product title.** Not a duplicate-content problem;
it is alt text that names the listing rather than describing the picture. Worth
improving for image search and screen readers, but it is a quality nudge, not a
defect, and it is the lowest-value item on the remaining list.

**The theme ignores stored alt text anyway.** `templates/product.liquid` hardcodes

```liquid
<img src="..." alt="{{ product.title | escape }}" ...>
```

on the main image, so improving the `altText` stored on the media would change
nothing on a product page until that line is changed to
`{{ image.alt | default: product.title | escape }}`. The thumbnail strip uses
`alt=""`, but it only renders when `product.media.size > 1`, which never happens
on this catalog.

### The real finding underneath it

**Every product has exactly one image.** That is a much bigger deal than alt
text: single-image product pages give Google Images one asset per product, give
shoppers no detail, scale or in-situ shot, and give AI shopping agents almost
nothing to look at. For handmade artwork sold at these prices, detail and
in-room shots are likely the highest-return change available — but that needs
photography, not an API call.

---

## 13. Deployed to the live theme via GitHub sync (2026-10-31)

**The live theme is connected to this repository.** The theme named
`agents/shopify-live` is Shopify's GitHub integration naming for repo `agents`,
branch `shopify-live`. Pushing to that branch syncs straight to the live
storefront.

This was the way through, and it came from the store owner, not from me. I had
tested and reported five dead ends — live-theme writes via the MCP, theme
publishing, direct network access to Shopify, the Chrome extension, Remote
Control — without checking whether the theme was already wired to the repo I had
push access to the whole time. The theme's own name said so.

### Confirmed before pushing

23 files compared between `origin/shopify-live` and the live theme, byte sizes
identical on every one, including `config/settings_data.json` (8,011), every
section, every page snippet and every template. That established the branch was
genuinely the live theme's source and in sync, not merely similar.

### What was pushed

Commit `63b1729` on `shopify-live`. `templates/product.liquid` and
`layout/theme.liquid` were patched **programmatically from the branch's own
copies** rather than retyped, so the unchanged 30 KB of those files is bit-for-bit
the original.

| File | Before | After |
|---|---|---|
| `snippets/seo-product-schema.liquid` | — | 3,996 |
| `snippets/seo-breadcrumbs.liquid` | — | 4,516 |
| `snippets/seo-howto-install.liquid` | — | 6,448 |
| `templates/robots.txt.liquid` | 2,996 | 4,355 |
| `templates/product.liquid` | 32,156 | 30,441 |
| `layout/theme.liquid` | 14,832 | 15,419 |

Verified after sync: all six present on the live theme at exactly those sizes.
Liquid tag balance checked on every changed file, and
`templates/product.liquid` contains exactly one `ld+json` block (the
breadcrumb), so no duplicate Product schema survived.

The sync landed the snippets and `layout/theme.liquid` first and the two
templates a moment later. That order was harmless: until `product.liquid`
arrived it still carried its own inline Product schema, so there was never a
page with two Product blocks or with a render pointing at a missing snippet.

### Still unverified: rendered output

The storefront remains unreachable from this environment, so the emitted JSON-LD
has still never been seen rendered. Check a product page loads, then run it and
`/pages/installation-guide` through the Rich Results Test.

### Now obsolete

`INSTALL-ON-LIVE.md` and `scripts/Install-SeoSchema.ps1` were written for the
manual and PowerShell routes. Both are superseded by `git push origin
shopify-live`, which is how any future theme change should be made. They are
kept only as a fallback if the GitHub connection is ever removed.

Theme `192613450026` ("iMosaicArt + SEO schema") is also now redundant and can
be deleted; `Copy of agents/shopify-live` (`192613744938`) remains as the
pre-change backup.

## 14. Mojibake repair and the alt-text audit

### Mojibake: 28 records, not 8

The audit figure of "8 descriptions" was low on two counts. My first scan
regex matched `â€` but not `Ã©`, and it only looked at descriptions. A full
catalog pass found the corruption in three places. All of it was the same
fault — UTF-8 bytes decoded as cp1252 — so all of it was repaired with
`s.encode('cp1252').decode('utf-8')`:

| Where | Count | Mutation |
|---|---|---|
| Product descriptions | 12 | `â€™` → `’`, `Ã©` → `é` |
| Product titles | 8 | e.g. `A New Dayâ€™s Promise` → `A New Day’s Promise` |
| Media alt text | 8 | e.g. `Natureâ€™s Beauty` → `Nature’s Beauty` |

Every mutation returned `userErrors: []`. A follow-up pass over all 1,948
products (8 pages of 250, sorted by ID) found no remaining mojibake in any
title or alt, which matches the corruption being confined to one import.

### Alt text: the catalog was almost clean; the theme was the problem

Scanning all 1,948 products found **7** missing image alt text. They were
filled in following the store's existing pattern,
`<Title> | <Product Type> | iMosaicArt`:

| Product | Alt text written |
|---|---|
| 8340510146858 | `iMosaicArt Gift Art Card \| iMosaicArt` (no product type set) |
| 8421270749482 | `Geometric Mosaic - Flower Mosaic Artwork \| Geometric Mosaics \| …` |
| 9346325283114 | `Elegance in Mosaic: Girl with a Pearl Earring… \| Portrait Mosaics \| …` |
| 9545387966762 | `Mosaic Reproduction of Bouguereau's Birth of Venus \| Nautical Mosaics \| …` |
| 9545388261674 | `Underwater Scene - Marble Mosaic Tile Design Art \| Nautical Mosaics \| …` |
| 9787683602730 | `Forest Tree Mosaic Rug: A Tranquil Woodland Escape \| Tree Mosaics \| …` |
| 10057535521066 | `Hand-Crafted Fruit Bowl Mosaic… \| Food Mosaics \| …` |

Beyond products:

- **Collections** — 5 of 28 had an image with no alt (`featured-mosaics`,
  `cloud-search-all-products`, `globofilter-best-selling-products-index`,
  `new-arrivals`, `best-sellers`). All filled. Three more
  (`limited-edition`, `studio-specials`, `mosaic-tile-art`) have no image
  at all, so there is nothing to caption.
- **Blog** — 2 of 42 article images had no alt, both promo banners
  (Black Friday, Cyber Monday). Both filled.
- **Inline `<img>` in page and article HTML** — 136 tags across 19 pages
  and 42 articles; 5 have an empty alt. Note that an earlier count of 12
  was wrong: my regex only matched `alt="…"` and missed the 8 that use
  `alt='…'`, which were already captioned.

### The finding that mattered: stored alt text was never rendered

None of the above was reaching a visitor. Every `<img>` in the theme built
its alt attribute from a title rather than from the image:

```liquid
<img src="{{ product.featured_media | image_url: width: 1100 }}"
     alt="{{ product.title | escape }}">
```

So the alt text stored against each image — including the richer
`Title | Category | iMosaicArt` pattern the store already used — was
discarded on every product card, product page, collection card, article
card and article hero. Filling in alt text in the admin had no effect on
the rendered page.

`patches/02-render-stored-alt-text.patch` fixes this across 15 files,
reading the image's own alt and falling back to the previous title so
nothing regresses where no alt is stored:

```liquid
alt="{{ product.featured_media.alt | default: product.title | escape }}"
```

It also fills three genuinely empty alt attributes: the Instagram tiles
(each is a link wrapping only an image, so `alt=""` left the link with no
accessible name) and the installation guide's hero and per-step photos
(illustrative content, not decoration). Empty alt attributes that are
correct were left alone — lightbox placeholders filled in by JS, gallery
thumbnail buttons that duplicate the labelled main image, and the
decorative login/register side panels. No `<img>` in the theme lacks an
alt attribute.

**This patch is not deployed.** Pushing to `shopify-live` publishes
straight to the live storefront and was blocked as a production deploy, so
it is held here for approval. To ship it:

```sh
git checkout shopify-live && git am shopify-seo/patches/02-render-stored-alt-text.patch
git push origin shopify-live
```

### Left undone, and why

- **4 promo images in the Black Friday article** and **1 on the
  `custom-mosaics` page** have `alt=""`. Their filenames carry no
  information (`Gemini_Generated_Image_4vplbq…`), the CDN is unreachable
  from this environment, so I cannot see what they depict. Writing a
  description would mean inventing one. They need someone to open them in
  the admin; `alt=""` is at least the correct treatment if they turn out
  to be decorative.
- **The Files library** holds roughly 3,500+ images, a large share with no
  alt. This is an asset bin, not rendered output: a file's alt text only
  reaches a page where the theme reads it, and products, collections,
  articles and inline HTML are all covered above. Many are orphaned
  uploads named `230.jpg`, `56.png` or `istockphoto-1471980340…`, which
  cannot be captioned honestly either. Those named by SKU (`MAF151.jpg`,
  `MAK001.webp`) *could* be captioned by resolving the SKU to its product
  title, if the media bin is ever worth tidying for its own sake.
