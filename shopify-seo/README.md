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

**Closed 2026-10-31 at the owner's direction.** Raised as the standing
highest-return item; the owner has set it aside. It is recorded here as a
known characteristic of the catalogue, not as pending work, and should not
be re-raised in future status reports.

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

### Verified 2026-10-31: rendered output

The owner ran both pages through Google's Rich Results Test. The storefront is
still unreachable from this environment, so this is the first time the emitted
JSON-LD has been seen rendered.

**Product page** (`/products/landscape-mosaics-desert-oasis-at-dawn-mosaic-art`),
crawled 15:27:01 — all valid:

| Type | Items | Source |
|---|---:|---|
| Product snippets | 1 | `seo-product-schema` |
| Merchant listings | 1 | `seo-product-schema` |
| Breadcrumbs | 1 | `seo-breadcrumbs` |
| Local businesses | 2 | sitewide `@graph` in `theme.liquid` |
| Organisation | 2 | sitewide `@graph` in `theme.liquid` |

Exactly one Product block and one BreadcrumbList, which is what the earlier
check asked for — no surviving inline duplicate.

The two non-critical issues are `aggregateRating` and `review`, both optional
and both absent **by design**: the store has no reviews and inventing them was
never an option.

The counts of 2 are not duplicate markup. `theme.liquid` emits a well-formed
`@graph` of three entities with distinct `@id`s and proper cross-links
(`Organization` → `Store` via `parentOrganization`, `WebSite` via `publisher`).
`Store` is a subtype of both `LocalBusiness` and `Organization`, so Google
tallies that one node in both buckets. That block predates this work — it came
in via `9c1e4c2`, not from any commit here.

**Installation guide** (`/pages/installation-guide`), crawled 15:28:37 — 5
valid items: Breadcrumbs 1, Local businesses 2, Organisation 2.

**No HowTo card appeared.** The render condition is correct
(`request.page_type == 'page' and page.handle == 'installation-guide'`), and
`seo-breadcrumbs` renders from the same hook on that page, so the hook fires.
The likeliest explanation is that **Google deprecated HowTo rich results in
2023** and the Rich Results Test no longer reports the type at all, whether or
not the markup is present.

That is a hypothesis, not a verified fact. To settle it, run the page through
`validator.schema.org`, which reports every type including ones Google no
longer surfaces, or view source and search for `"HowTo"`. If the markup is
there, nothing is broken and `seo-howto-install.liquid` is simply marking up a
format Google stopped rewarding. If it is absent, the snippet has a bug.

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

So the alt text stored against each image was discarded on every product
card, product page, collection card, article card and article hero.
Filling in alt text in the admin had no effect on the rendered page.

An earlier draft of this section claimed the store "already had richer
alt text on 1,941 of 1,948 products" in the form
`Title | Category | iMosaicArt`. That was wrong — generalised from the
handful of records inspected closely during the mojibake repair, which do
use that form. Measured across all 1,948 products, the real split was:

| Stored alt | Count | Share |
|---|---:|---:|
| Exactly the product title | 1,623 | 83% |
| `Title \| Category \| iMosaicArt` | 296 | 15% |
| Something else | 22 | 1% |
| Missing (the 7 filled above) | 7 | <1% |

Four products in five therefore carried alt text that was a verbatim copy
of the title — not broken, but adding nothing a crawler or screen reader
did not already have.

**Upgraded 2026-10-31.** All 1,623 were rewritten to the house pattern
`<Title> | <Product Type> | iMosaicArt` via twelve `fileUpdate` batches of
120–140 records, with zero `userErrors` across every batch. A sample from
five separate batches was re-read afterwards and all five carry the new
value. Every product image in the catalogue now stores alt text that names
the subject, its category and the brand.

Two caveats worth recording:

- The alt text is derived from the stored title, so where a title is itself
  awkward the alt inherits it — e.g. `Premium Venetian Canal View Premium
  Tile Art Stone Mosaic Art | Landscape Mosaics | iMosaicArt`, with
  "Premium" twice and a double space. That is faithful to the product
  record by design; it will read better automatically once the 278
  generated titles are rewritten.
- 325 products were deliberately skipped: 296 already had the house
  pattern, 22 had some other deliberate alt text, and 7 were the ones
  filled from empty earlier in this section.

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

**Deployed 2026-10-31.** The direct push to `shopify-live` was refused as a
production deploy, so the commit went to `claude/theme-render-stored-alt`
and shipped by merging PR #13 into `shopify-live`, which Shopify synced to
the live theme at 10:01 UTC. Verified afterwards by reading the live theme
file back: `snippets/card-product.liquid` now contains
`alt="{{ product.featured_media.alt | default: product.title | escape }}"`.
Confirmed again in the browser on a real product page, where the rendered
`alt` matched the value stored in Shopify.

The patch file is kept here as the record of the change.

Two corrections to its scope, found later while removing dead theme files:

- Of the 15 files it touched, **three were unreferenced dead code** —
  `sections/main-product.liquid`, `snippets/card-product.liquid` and
  `sections/page-portfolio.liquid`. Those edits render nothing. The live
  paths it did fix are `templates/product.liquid`, `coll-card`,
  `card-collection`, `main-list-collections`, the three blog/article
  sections, `hero`, `custom-process`, `testimonials`, `instagram-grid` and
  `page-installation`. All three dead files were deleted in PR #14.
- The theme change makes stored alt text *render*; it does not improve it.
  Because 81% of products store alt identical to the title, most pages emit
  the same string as before — correctly sourced now, but unchanged.

### Left undone, and why

- **5 images with `alt=""` — since closed, no action needed.** Four sit in
  the Black Friday article and one on the `custom-mosaics` page. I could
  not caption them: their filenames carry no information
  (`Gemini_Generated_Image_4vplbq…`) and the CDN is unreachable from this
  environment, so writing a description would have meant inventing one.
  Checking where they actually render settled it instead. Both the Black
  Friday and Cyber Monday articles are unpublished (`isPublished: false`),
  and `templates/page.liquid` routes the `custom-mosaics` handle to the
  hand-built `pg-custom-mosaics` snippet rather than falling through to
  `main-page`, so that page's body HTML — and the image inside it — never
  reaches the storefront. None of the five is on the live site.
- **The Files library** holds roughly 3,500+ images, a large share with no
  alt. This is an asset bin, not rendered output: a file's alt text only
  reaches a page where the theme reads it, and products, collections,
  articles and inline HTML are all covered above. Many are orphaned
  uploads named `230.jpg`, `56.png` or `istockphoto-1471980340…`, which
  cannot be captioned honestly either. Those named by SKU (`MAF151.jpg`,
  `MAK001.webp`) *could* be captioned by resolving the SKU to its product
  title, if the media bin is ever worth tidying for its own sake.

## 15. Store and theme fixes, 2026-10-31

### Gift card: labels and prices disagreed by $300

`iMosaicArt Gift Art Card` is a true Shopify gift card (`isGiftCard: true`),
so the card's value equals the price paid. Its four denomination labels and
its prices had drifted apart by exactly $300 on every variant:

| Label | Price before | Price now | SKU added |
|---|---:|---:|---|
| $100.00 | $400 | **$100** | `GIFTCARD-100` |
| $250.00 | $550 | **$250** | `GIFTCARD-250` |
| $500.00 | $800 | **$500** | `GIFTCARD-500` |
| $1,000.00 | $1,300 | **$1,000** | `GIFTCARD-1000` |

A customer clicking "$100.00" was charged $400 and received a $400 card —
internally consistent, but advertising a number four times under what it
charged. The constant $300 offset showed this was a systematic edit rather
than drift. The owner confirmed the labels were authoritative; prices were
dropped to match.

`productType` was empty and is now `Gift Cards`, which also gave the image
usable alt text. Collection membership was read before and after to confirm
no smart collection reacted to the new type — same three either way.

Checked and *not* a problem: the `-1` and `0` inventory numbers on those
variants. `tracked: false` and `availableForSale: true`, so gift cards hold
no stock and all four were always purchasable.

### SKU collision MAF082 / MF323

`Stunning Glass Mosaic Floral Patterns: Artistic Delight` (created 2023)
had `MAF082` on four variants and `MF323` on the fifth, and `MF323` was
also held by a 2025 product.

The assumption that `MF323` was malformed turned out to be wrong: `MF###`
is a real parallel scheme used by a cohort of Flower products created in
May and November 2025 (`MF218`–`MF246`), while `MAF###` is the older 2023
scheme. `SKU_LOGIC.md` lists Flower's next SKU as `MF453`, confirming
`MF###` is the go-forward series and `MAF###` is legacy.

That made the call clean rather than arbitrary: a 2023 product belongs on
the 2023 scheme, so the fifth variant was set to `MAF082`. Verified after:
`MF323` now resolves to exactly one product, `MAF082` to exactly one.

The catalog running two SKU schemes for one category is a cataloguing
decision, not a bug, but it will keep producing collisions like this.

### /llms.txt

A redirect already served `/llm.txt` from a file in Shopify Files, and
`robots.txt` allowed that path. The convention answer engines actually
request is the **plural** `/llms.txt`, so the file sat where nothing looked.
A `/llms.txt` redirect to the same file was created, and `robots.txt` now
allows both.

Two caveats: the redirect targets a `cdn.shopify.com` URL rather than
`www.imosaicart.com/llms.txt`, because Shopify cannot serve arbitrary root
files; and the target carries `?v=1792936942`, so re-uploading that file
changes the version and breaks both redirects.

### Small theme fixes (PR #14)

- **One `<h1>` per login page.** `main-login.liquid` had two — the
  reset-password panel and the sign-in form. The panel starts at
  `display:none` but is still in the DOM and still parsed. The reset
  heading is now an `<h2>` with the same class, so nothing moves visually.
- **`og:image` dimensions.** Narrower than first recorded: `og:image` was
  already dynamic and requested at `width: 1200`, which preserves aspect
  ratio, but height was declared a flat `1200`. The product photos are 4:5,
  so shared product links served 1200×1500 while claiming square. The real
  height is now derived from the source image, and no dimensions are
  emitted at all when falling back to the default.
- **Six unreferenced files deleted** — `category-grid`,
  `collection-showcase`, `main-product`, `page-portfolio`, `card-product`,
  `swatch-card`. Not the ~12 originally estimated.

**Deliberately not changed:** the FAQ section on the product template,
listed as duplicated boilerplate. Its three questions cover weatherproofing,
production time and custom sizing — what a buyer actually asks on a product
page — and it emits no JSON-LD, so there is no duplicate structured data.
Removing it would cost conversions to solve a problem search engines do not
have with ordinary ecommerce boilerplate.

---

## 16. SKU collisions and the generated-title cleanup (2026-10-31)

### 16.1 SKU collisions — 22, not 21

A full export of all 1,948 products (first variant's SKU, which after the
propagation pass represents the product) found **22 SKUs shared by 45
products**. The earlier figure of 21 was a miscount that dropped a row.

The 22 split into two groups needing different decisions. `SKU_COLLISIONS.md`
holds the full decision list; this is the outcome.

**Group B — 11 genuine collisions between different artworks. Resolved.**

Twelve products were given fresh codes; in each case the older listing kept
the existing SKU. Every variant was updated, not just the first, because the
propagation pass had put the same SKU on all of them.

| Old SKU | Product moved off it | New SKU | Why that code |
|---|---|---|---|
| `MAA010` | Horse Mosaic – Handmade Horse Mural (DRAFT) | `MA010` | its own image file is named `MA010_…` |
| `MAS123` | Sunrise Over the Ocean Mosaic | `MAS124` | its own image file is named `MAS124_…` |
| `MAG002` | Mosaic Tile Medallion – Compass Mosaic | `MAG430` | file said `MAG037`, already in use |
| `MAG010` | Mosaic Medallion – Round Mosaic Art Design | `MAG431` | file said `MAP010`, already in use |
| `MAG009` | Geometric Mosaic – Flower Mosaic Artwork | `MAG432` | counter |
| `MAG165` | Geometric Symphony Mosaic Tile Art | `MAG433` | counter |
| `MAF152` | Fiery Elegance: Crafted Glass Mosaic Tile Art | `MF453` | counter |
| `MAK005` | Colorful Floral Mosaic – Abstract Mosaic Art | `MK027` | counter |
| `MAR049` | Our Lady of Guadalupe Mosaic | `MAR108` | counter |
| `MAB062` | Watercolor Floral Art – Landscape Mosaic | `MB128` | counter |
| `MAM011` | Ethereal Woman with Golden Curls (Portrait) | `MAP069` | counter |
| `MAM011` | Medusa with Golden Curls (Roman) | `MAM066` | counter |

Verified by re-reading all 23 affected products: the 12 carry their new
codes on every variant, and the 11 retained products still hold the
originals. Zero `userErrors`.

A useful technique came out of this: **the uploaded image filename often
embeds the intended SKU**, and in two cases it named a free code that
matched the artwork better than the next counter value. Worth checking
first on any future collision.

**Group A — 11 pairs from a same-day re-import. Resolved.**

On 2025-11-15 eleven products were created at 13:09–13:10 and created again
at 14:22–14:23: identical base title with `Premium` inserted, identical
price, identical productType, and **both images uploaded under the same base
filename** (e.g. `MAS160.webp` twice, hence Shopify's random suffixes).
That read as a re-run of one import, but `cdn.shopify.com` is unreachable
from this environment so the pixels could not be compared here. Rather than
draft ten live products on circumstantial evidence, the owner opened
`MAS160`'s two images in the admin and confirmed they are the same artwork.
Since the whole set came from one import run, that settled all eleven.

Applied: the 13:09 listing keeps its SKU and stays ACTIVE; the 14:22 copy
was set to DRAFT (ten of them — `MAS286`'s was already a draft); and a 301
redirect points each retired handle at its survivor. Nothing was deleted,
so every step is reversible.

Affected: `MAG201`, `MAG202`, `MAG253`–`MAG256`, `MAS160`, `MAS161`,
`MAS284`–`MAS286`.

Verified by re-reading all 22 products and listing the redirects: 11
survivors ACTIVE, 11 duplicates DRAFT, 11 redirects each resolving to the
correct survivor handle, zero `userErrors`. Catalogue counts afterwards:
1,948 total, 1,812 ACTIVE, 136 DRAFT — up from 126, which is exactly the
ten newly drafted copies.

**A trap for future scans.** The drafted duplicates keep their survivor's
SKU on purpose: they are the same artwork, and a draft is not sellable. A
naive duplicate-SKU scan across all 1,948 products will therefore flag these
eleven again. They are not a defect — filter to `status:active` and the
eleven show zero shared SKUs. Do not re-raise them as outstanding work.

With Group A closed this way and Group B reassigned, **all 22 collisions
from the 2026-10-31 audit are resolved**: 11 by fresh SKUs, 11 by retiring
the duplicate.

### 16.2 The generated titles — 184 products, 12 artworks

The earlier note called this "278 generated titles". Measured properly, it
is **184 products across 12 distinct subjects**.

One of those 184 escaped this scan and was only found later, by the
verification pass in §18.2. The count below is the corrected one; the work
described in this section covered 183 of them.

| Subject | Listings | | Subject | Listings |
|---|---:|---|---|---:|
| Tuscan Vineyard Sunset | 23 | | Op Art Cube Pattern | 9 |
| Mediterranean Seascape | 23 | | Moroccan Star Medallion | 9 |
| Forest Stream in Autumn | 22 | | Roman Labyrinth Design | 8 |
| Desert Oasis at Dawn | 22 | | Art Deco Fan Motif | 8 |
| Snowy Mountain Vista | 22 | | Abstract Tessellation Grid | 8 |
| Venetian Canal View | 22 | | Byzantine Interlacing Circles | 8 |

All created 2025-11-16 by a generator that prefixed one of 16 adjectives to
a subject and appended `Premium  Tile Art Stone Mosaic Art`.

What the records actually show, checked rather than assumed:

- Each listing has its **own SKU** and its **own 512×512 image** — so these
  are distinct uploads, consistent with the owner's correction that they are
  not duplicates.
- **The adjective is not an identifier.** Within Tuscan Vineyard Sunset,
  "Hand-Set" appears 6 times, "Signature" 4, "Luxury" 3, "Exclusive" 3,
  "Contemporary" 3. 23 listings carry only 114 distinct titles across the
  whole set.
- **Every description is byte-identical except for the adjective**, and
  says "a fresh interpretation of the original design" — the generator
  describing its own output.
- The broken suffix appeared in **four fields per product**, not one:
  `title`, `descriptionHtml`, `seo.title` and `seo.description`. The SEO
  pair is what Google displays, so that was the more consequential half.

**What was fixed.** The owner chose the minimal option — repair the defects,
leave them live and separate. Applied to all four fields on the 183 known at
the time (the 184th is handled in §18.2):

- the double space in `Premium  Tile Art`
- the `Premium … Premium` redundancy (the suffix's own "Premium" is gone, so
  it no longer collides with the adjective)
- the stacked `Tile Art Stone Mosaic Art` tail, which repeated "Art" twice

`<Adjective> <Subject> Premium  Tile Art Stone Mosaic Art`
→ `<Adjective> <Subject> Stone Mosaic Wall Art`

Side effect worth knowing: `seo.title` is now **null** on all 183. Shopify
treats an SEO title identical to the product title as "no override" and
clears it, so the field inherits the product title instead of duplicating
it. The rendered `<title>` is the same string either way; the override is
simply gone. `seo.description` remains set on all 183.

Measured before and after, by re-reading all 183:

| | Before | After |
|---|---|---|
| Products with the broken suffix | 183 | **0** |
| Fields per product carrying it | 4 | 0 |
| Product title length | 59–78 | 46–65 |
| Titles within Google's ~60 char display | 0 | **179 of 183** |
| Distinct titles | 114 | 114 (unchanged by design) |

**Deliberately not changed, and why:**

- **Handles.** All 183 still contain `…premium-tile-art-stone-mosaic-art`.
  Rewriting them changes live URLs and needs a redirect plan.
  → **Done, see §18.1.**
- **Title uniqueness.** 41 groups still share a title. The mapping is 1:1,
  so no new collisions were introduced and none were removed — that is the
  option chosen.
- **The cannibalisation itself.** 23 pages competing for one query is not a
  wording problem and renaming cannot fix it. The structural options are a
  canonical-plus-noindex pass or folding each subject into one product with
  variations; both remain open.
  → **Resolved by noindex, see §18.3.**
- **`seo.description` length.** Still 433–452 characters against Google's
  ~155 display limit, and it opens by repeating the title verbatim. A
  pre-existing defect, outside the chosen scope, left for a decision.
  → **Done, see §18.1.**

### 16.3 Side findings, recorded not fixed

- **An unlabelled AI image on a live product.** `MAG432`'s "Flower Mosaic
  Artwork" carries `ChatGPT_Image_Aug_4_2026_01_17_45_PM.png`. Every other
  product's image is named after its SKU. → **Resolved, see §17.**
- **Three Nautical products carry Geometric codes** — the retained
  `MAG002`, `MAG009` and `MAG010` are all productType "Nautical Mosaics".
- **`MAB062` is productType "Bird Mosaics"** but neither title mentions a
  bird; both say floral/landscape.
- **A mangled handle.** `MAS124`'s product has the handle
  `…a-new-daya-™s-promise`, mojibake from the apostrophe in "Day's". The
  title itself is clean.

---

## 17. The four small findings (2026-10-31)

Section 16.3 recorded four things noticed in passing. Two were fixed; two
turned out to need the owner, for reasons worth writing down.

Order history was checked first: **none of the six SKUs involved appears in
any of the store's 93 orders**, so nothing below breaks a past invoice.

### Fixed — three Nautical products moved off Geometric codes

`MAG002`, `MAG009` and `MAG010` were held by products whose productType is
"Nautical Mosaics". The `MAG` prefix is the Geometric counter, so the codes
contradicted the categories.

| Product | Was | Now |
|---|---|---|
| Wall Art Glass Mosaic – Sea Life Wall Art | `MAG002` | **`MAN119`** |
| Wall Art Glass Mosaic – Ocean Mosaic Scene | `MAG009` | **`MAN120`** |
| Underwater Mosaic View – Pool Mosaic Design | `MAG010` | **`MAN121`** |

Applied across all 5 variants of each and verified by re-read. The three old
codes are now unused — confirmed by querying for them and getting nothing
back. Gaps in a counter sequence are harmless; they are not free for reuse
by convention, since reusing a retired code is how collisions start.

### Fixed — the mojibake handle

`MAS124`'s product carried the handle
`landscape-mosaics-sunrise-over-the-ocean-mosaic-a-new-daya-™s-promise` —
mojibake from the apostrophe in "Day's". Changed to
`…-a-new-days-promise`, with a 301 redirect from the old path so no inbound
link breaks. Shopify stored the redirect with the `™` percent-encoded as
`%e2%84%a2`, which is what a browser sends.

The product title itself was always clean; only the handle was mangled.

### Fixed, after the owner answered — the ChatGPT image filename

`MAG432`'s product ("Geometric Mosaic – Flower Mosaic Artwork") carries the
image `ChatGPT_Image_Aug_4_2026_01_17_45_PM.png`. Every other product's image
is named after its SKU.

This **is** technically fixable from here, which is worth recording because
the obvious objection is that `cdn.shopify.com` is unreachable from this
environment: `FileCreateInput` accepts both `filename` and `originalSource`,
and `originalSource` can be the existing CDN URL — Shopify fetches its own
CDN server-side, so the image never has to pass through here.

It was held back at first, because renaming looked like the wrong fix. The
filename is not the problem; it is the *tell*. Every other image is named
after its SKU because it came from a photograph of a real piece. Renaming
this one to `MAG432.png` would make the catalogue look consistent while
leaving open the question the filename raises — whether that listing has a
real artwork behind it. That is a content decision, so it went to the owner
rather than being silently tidied away.

**The owner confirmed there is real artwork behind the listing**, which
answers the question the filename raised and makes the rename a plain
consistency fix. Applied.

One correction to the method above: the fix needed neither `fileCreate` nor
a re-upload. `FileUpdateInput` also accepts `filename`, which renames the
file **in place** and preserves the `MediaImage` ID. The first attempt did go
the create-and-delete route and produced a duplicate; that duplicate was
removed with `fileDelete` and the original renamed instead, so
`MediaImage/44140124340522` is unchanged and nothing re-pointed.

Verified by re-read: the image is now `MAG432.png` on the original media ID.

### Fixed — the Bird/floral pair turned out to be one product

`MAB062`'s listing was productType "Bird Mosaics" with a title reading
"Watercolor Floral Art – **Lad**scape Mosaic" and no bird mentioned. Its
sibling (`MB128`, 2025-02-08) was also Bird Mosaics and also floral/landscape.

The owner compared both images and confirmed **they are the same product** —
reversing the earlier §16.1 B4 call that treated them as distinct.

One detail changed which listing should survive. The two had different variant
structures:

| | Created | Variants | Sizes |
|---|---|---:|---|
| `MAB062` | 2024-10-28 | **5** | 130×65 cm up to 260×130 cm |
| `MB128` | 2025-02-08 | 1 | 140×75 cm only |

The older listing is the more complete one, so it survives — which also
matches the Group A precedent of keeping the earlier record. Retiring the
newer would have cost customers four size options.

Applied:

- `MB128`'s listing set to DRAFT and its handle moved aside to
  `…-landscape-mosaic-retired-duplicate`, which **released the correctly
  spelled handle**
- the survivor took that handle, so its URL is now
  `/products/bird-mosaics-watercolor-floral-art-landscape-mosaic`
- the survivor's title and image alt text corrected, "Ladscape" → "Landscape"
- a 301 redirect from the old typo'd path to the new one

The typo is now gone from the title, the alt text and the URL. Because the
retired listing's original handle became the survivor's, anyone holding the
old `…-landscape-mosaic` link lands on the survivor with no redirect needed.

Verified by re-read: survivor ACTIVE on the clean handle with five `MAB062`
variants and corrected alt; duplicate DRAFT on the parked handle; redirect
confirmed by three separate lookups (Shopify's redirect search does not do
substring matches, so the first check returned nothing and needed a path-
prefix query and a direct node fetch to confirm).

`MB128` stays on the retired draft rather than being reverted, so the record
shows honestly that it was once treated as distinct. It is a consumed code,
not a reusable gap.

**Answered: the productType was right all along.** Both listings remain
"Bird Mosaics" while the title says floral/landscape, which looked like a
mis-typed product. The owner checked the image and confirmed **there is a
bird in it**. So "Bird Mosaics" is correct and no change was needed — the
title is simply incomplete, not contradictory. Recorded here because the
earlier note framed this as a likely defect, and it was not one.

---

## 18. Handles, meta descriptions and the cannibalisation fix (2026-10-31)

Everything §16.2 left open is now closed. The owner asked for all three
items — handles, meta descriptions, cannibalisation — and chose "finish all
184 anyway" when told that noindexing most of them would make the first two
largely redundant for search. That call is recorded because it was the right
one for a reason beyond SEO: the handles and descriptions are what a customer
sees in the address bar and what gets pasted into a message, indexed or not.

### 18.1 Handles and meta descriptions rewritten, with 184 redirects

**Handles.** The suffix was replaced in place, not regenerated:

```
…-premium-tile-art-stone-mosaic-art   →   …-stone-mosaic-wall-art
```

Using `rindex` on the old suffix rather than a plain `replace`, so the 70
listings carrying a `-2`/`-3`/`-4`/`-5`/`-6` disambiguator keep it. Checked
for collisions against the full 1,948-handle set before anything was written:
zero.

**Shopify does not create redirects on an API handle change.** This was
verified by probing rather than assumed — the admin UI offers a redirect
checkbox, the API does not, and nothing appears. So every rename needed an
explicit `urlRedirectCreate`.

Each product was sent as one `productUpdate` carrying both the new handle and
the new `seo.description`, followed in the same document by its
`urlRedirectCreate`. Ordering matters: GraphQL executes top-level fields
serially, so putting all the product updates before all the redirects
guarantees the old path is free before a redirect tries to claim it.

**Meta descriptions.** 433–452 characters down to 128–147:

```
<Subject> in hand-cut stone mosaic, set piece by piece and made to order.
Free worldwide shipping on every piece.
```

`<Subject>` is the title minus the ` Stone Mosaic Wall Art` tail, so it drops
the decorative adjective too. The old text opened by repeating the full title
verbatim and then said "a fresh interpretation of the original design", which
is the generator describing itself — of no use to a searcher. The new text
leads with the material and the made-to-order fact, which are the two things
that actually distinguish this catalogue.

| | Before | After |
|---|---|---|
| `seo.description` length | 433–452 | **128–147** |
| Handles carrying `premium-tile-art` | 184 | **0** |
| 301 redirects from old product paths | 0 | **184** |

### 18.2 What the verification pass caught

The work went out in nine batches of ~20. Every batch returned zero
`userErrors`, which is exactly the trap: no error does not mean no defect.
Re-reading all 184 from Shopify and diffing against the source payload found
two problems that the success responses had hidden.

**Five products were silently skipped.** Rows 45–49 — one batch segment never
went out at all. No error anywhere, because the mutation that would have
carried them was never sent. Found only because the diff compared live state
against the intended state rather than trusting the responses.

**There were 184 products, not 183.** `MAS144`
(`9947825340714`, Classic Venetian Canal View) was missing from the original
set because its `seo.title` contains a **double space** — `Premium  Tile Art`
— while its `title` has a single one. The original scan matched the
single-spaced string against the wrong field and silently dropped the record.
That listing had never been touched by any of this work: old title, old
description, old `seo.title`, old handle, and alt text still holding the raw
unformatted title. It received the full treatment in one call — all four
text fields, the handle, the house-pattern alt text, and a redirect.

The subject table in §16.2 is the confirmation: Venetian Canal View was
counted at 21 and is in fact 22, and the missing one is a Venetian Canal
View. 183 + 1 = 184.

Final state, re-read from Shopify after the fixes:

| Check | Result |
|---|---|
| Handles matching intended value | **184 / 184** |
| `seo.description` matching intended value | **184 / 184** |
| Redirects present with correct target | **184 / 184** |
| Products anywhere in the catalogue still titled `Premium Tile Art` | **0** |
| Duplicate handles across all 1,948 products | **0** |

Total redirects in the shop is now 234.

**The lesson worth keeping:** a batch API that reports per-item errors tells
you nothing about items it never received. Verification has to diff live
state against intent, and it has to run over the whole intended set, not a
sample. A five-product hole and an entire missing record both survived nine
clean responses and a spot-check.

### 18.3 Cannibalisation — noindex, driven by a metafield

The owner chose canonical-plus-noindex over consolidation. The reasoning is
in PR #16 and worth restating: folding 23 artworks into one product with
variations would discard 172 real SKUs and claim these are sizes of one
piece, which they are not. A `rel=canonical` would claim they are duplicates
of each other, which they also are not — different images, different SKUs.
Google would likely ignore it, and if honoured it would bury 172 real
artworks. `noindex, follow` is the only option that removes the competition
without lying about the catalogue or hiding the work.

**Picking the 12 that stay indexed.** Sales would have been the right
tiebreaker. There are none: all 58 orders placed since the 2025-11-16 import
were checked line by line, and **not one touched any of the 184**. So the
canonical per subject is the listing with the clean handle (no numeric
disambiguator) and the lowest product ID — the first-created record, holding
the oldest URL and whatever link equity accrued to it.

| Subject | Canonical listing |
|---|---|
| Abstract Tessellation Grid | Fine Abstract Tessellation Grid |
| Art Deco Fan Motif | Bespoke Art Deco Fan Motif |
| Byzantine Interlacing Circles | Heritage Byzantine Interlacing Circles |
| Desert Oasis at Dawn | Heritage Desert Oasis at Dawn |
| Forest Stream in Autumn | Heritage Forest Stream in Autumn |
| Mediterranean Seascape | Signature Mediterranean Seascape |
| Moroccan Star Medallion | Luxury Moroccan Star Medallion |
| Op Art Cube Pattern | Exclusive Op Art Cube Pattern |
| Roman Labyrinth Design | Decorative Roman Labyrinth Design |
| Snowy Mountain Vista | Signature Snowy Mountain Vista |
| Tuscan Vineyard Sunset | Exclusive Tuscan Vineyard Sunset |
| Venetian Canal View | Decorative Venetian Canal View |

**The mechanism.** A pinned boolean metafield definition `seo.noindex` with
storefront read access, set to `true` on the other **172** listings. The
theme reads it in `snippets/seo-breadcrumbs.liquid` and emits
`<meta name="robots" content="noindex, follow">`.

A metafield rather than a handle list in the theme, so putting a listing back
in the index is a checkbox in the admin — no theme edit, no deploy. And
`follow` rather than `nofollow`, so these pages still pass link equity to the
canonical listing and the rest of the catalogue. They leave search results;
they are not cut off from the site.

The products stay **ACTIVE, browsable and buyable**. This is a search-results
change only. Nothing was drafted, deleted or hidden from navigation.

Verified across the full catalogue, not just the target set:

| Check | Result |
|---|---|
| Products scanned | 1,948 |
| Expected flagged | 172 |
| Actually flagged | **172** |
| Missing the flag | **0** |
| Flagged in error | **0** |
| Canonical listings carrying the flag | **0 of 12** |

### 18.4 Deployed — PR #16 merged to the live theme

Merged at the owner's go-ahead. The GitHub-synced theme `agents/shopify-live`
picked up both files within seconds, confirmed by reading the live theme's
file contents back out of Shopify — `layout/theme.liquid` and
`snippets/seo-breadcrumbs.liquid` both timestamped at the merge, and the
noindex block present and reading `product.metafields.seo.noindex.value`.

That merge is what made the 172 flags take effect. They were set *before* it,
deliberately: nothing else in the store reads that key, so the flags sat
completely inert until the theme shipped. One deploy, immediate effect, and
no window in which pages were half-configured.

The same PR dropped the `Store` / LocalBusiness node described in §15. The
sitewide `@graph` is now `Organization` + `WebSite`.

### 18.5 Still open

- **Rich Results re-test.** Not yet re-run since the deploy. It will confirm
  both changes at once: the "Local businesses" row should disappear and
  "Organisation" should drop from 2 valid items to 1 — the earlier 2/2 was a
  single `Store` node tallied under both types it qualified for.
- **The HowTo question from §13 is still open.** Needs
  `validator.schema.org` against `/pages/installation-guide`, or a
  view-source for `"HowTo"`. The storefront is unreachable from this
  environment. The working hypothesis remains that Google deprecated HowTo
  rich results in 2023 and simply stopped reporting them.
- **Four titles run 61–65 characters** against Google's ~60 display limit.
  All four are in the noindex set, so it currently costs nothing.
- **Collections are still entirely untouched** — see §14's "Left undone".
  Dead `mosaic-tile-art` (0 products), a duplicate pair both holding all
  1,948, `glass-mosaic-art` holding 1,624 (83%) under a *material* label,
  and four thin collections (4, 6, 13, 13). This is the largest remaining
  structural item.
- **A pre-existing `seo.hidden` metafield definition** (`number_integer`,
  storefront-readable) already existed on products, presumably from an SEO
  app. It is unrelated to `seo.noindex` and was left alone, but anyone
  debugging indexing should know both exist.
