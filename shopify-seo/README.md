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
- **The HowTo question from §13.** → **Closed, see §19.4.** The hypothesis
  was right: Google removed HowTo rich results in 2023, including support in
  the Rich Results Test, so that tool cannot report it at all. The markup
  stays.
- **Four titles run 61–65 characters** against Google's ~60 display limit.
  All four are in the noindex set, so it currently costs nothing.
  → **Done via `seo.title` override, see §19.2** — and the same check found
  1,285 over-long `seo.title`s catalogue-wide, see §19.6.
- **Collections** — now done, see §20. Note that three claims in this list
  were wrong: the "duplicate pair" is unpublished and was never an SEO
  problem, and two of the four "thin" collections are unpublished too. The
  real finding was `glass-mosaic-art`, and it is larger than a label
  problem — see §20.3.
- **A pre-existing `seo.hidden` metafield definition** (`number_integer`,
  storefront-readable) already existed on products, presumably from an SEO
  app. It is unrelated to `seo.noindex` and was left alone, but anyone
  debugging indexing should know both exist.

---

## 19. Follow-ups after §18 (2026-10-31)

Five small items, one of which is a trap worth more than the fix it came from.

### 19.1 `SEOInput` replaces, it does not merge

**This cost a regression. Read it before touching `seo` on any product.**

`ProductUpdateInput.seo` is a whole-object replace. Sending

```graphql
productUpdate(product: { id: "…", seo: { title: "…" } })
```

sets the title **and nulls `seo.description`**. No error, no warning, and the
mutation reports success with `userErrors: []`.

It was caught on the read-back, not from the response — the response looked
perfect. Four products lost their `seo.description` for roughly ninety
seconds before it was restored by re-sending both keys together.

Why it had not bitten earlier: §16.2 and §18.1 both happened to write
`title` and `description` in the same call every time, so the field was
always fully specified. The first call in this whole project to send `seo`
with only one key was the one that broke.

**The rule: always send both `seo.title` and `seo.description`, even when
changing one.** Read the product first if you do not already know the other
value.

This generalises. `SEOInput` is not the only Shopify input object with
replace-not-merge semantics, and a clean `userErrors: []` says only that
what you sent was valid — never that what you *didn't* send survived. The
same assumption is what let §18.2's five skipped products pass nine clean
batches.

### 19.2 Four over-long titles, fixed with an override not a rename

Four of the 184 ran 61–65 characters against Google's ~60 display limit:

| Product | Chars | `seo.title` now | Chars |
|---|---:|---|---:|
| 9947820720426 | 65 | Mastercrafted Byzantine Interlacing Circles Stone Mosaic Art | 60 |
| 9947821801770 | 64 | Stonecrafted Byzantine Interlacing Circles Stone Mosaic Art | 59 |
| 9947822129450 | 64 | Stonecrafted Byzantine Interlacing Circles Stone Mosaic Art | 59 |
| 9947820982570 | 62 | Mastercrafted Abstract Tessellation Grid Stone Mosaic Art | 57 |

All four are in the noindex set, so this currently buys nothing — it matters
only if one is ever promoted to canonical.

**The product titles were not touched.** A product title is the merchandising
name: it appears on the product page, in collection grids, in the cart and on
the order confirmation. Truncating it to fit a search-results pixel budget
would damage four surfaces to improve one. `seo.title` sets the `<title>` tag,
which is the only thing Google renders, so an override fixes exactly the
broken surface and leaves the house pattern intact across all 184.

Only "Wall" was dropped. The decorative adjective had to stay — it is the sole
distinguishing token between these and their siblings, so removing it would
have collided three title tags into one.

Note these are now the only four of the 184 carrying an `seo.title` override;
the other 180 remain null and inherit the product title, as §16.2 describes.

### 19.3 MAB064 was a cardinal, not a hummingbird

The owner identified the bird in `MAB064` as a cardinal. "Hummingbird"
appeared in **six** places, not the two the title and description suggest:

`title`, `descriptionHtml`, `seo.title`, `seo.description`, the handle, and
the image alt text. Plus a 301 from the old path. The image file was already
`MAB064…jpg`, so nothing needed renaming there.

Two copy decisions worth recording:

- **"delicate" and "mid-flight" were dropped.** Both are hummingbird traits.
  A cardinal is neither delicate nor usually depicted hovering, and the CDN
  is unreachable from this environment, so the pose could not be verified.
  Asserting it would have been inventing a fact about a picture nobody here
  can see. The copy now reads "a striking red cardinal … the bold color and
  quiet poise of one of nature's most recognizable birds."
- **`seo.description` went from 500 characters to 119.** It had been a
  verbatim copy of the body text — the same defect §18.1 fixed across the 184.

Three other cardinal listings exist (`MAB002`, `MAB009`, `MAB012`, all
2023-06-28). All three are **DRAFT**, so none competes with `MAB064` in
search, and the owner closed the duplicate question on that basis. Worth
knowing they are shelved rather than absent: if they are real pieces still
for sale, that is three products' worth of idle search presence. The
`MAB009` listing credits a named third party, Bonnie Barry, in its title and
nowhere else — rights worth confirming before it ever goes live.

### 19.4 The HowTo question is closed: the tool cannot report it

§13 and §18.5 left this open. It is not a markup problem and never was.

**Google removed HowTo rich results from desktop search on 13 September
2023, and removed support from the Rich Results Test about 30 days later.**
Search Console API support went 180 days after that, and the documentation
was deleted. So the Rich Results Test *structurally cannot* report HowTo —
the "5 valid items, no HowTo" result was the tool working as designed and
says nothing about the page.

Sources: [Search Engine Journal](https://www.searchenginejournal.com/google-completely-removes-how-to-rich-results/496479/),
[Search Engine Roundtable](https://seroundtable.com/google-drops-how-to-rich-results-desktop-search-36046.html),
[Search Engine Land](https://searchengineland.com/google-removes-12-structured-data-fields-from-the-help-documents-375622).

The whole chain was verified from the Admin API without needing the
storefront, which is the useful trick here — **theme source is readable even
when the storefront is not**:

- the page's handle is exactly `installation-guide`, published
- the gate in `layout/theme.liquid` is `request.page_type == 'page' and
  page.handle == 'installation-guide'`
- `snippets/seo-howto-install.liquid` is on the live theme, 6,448 bytes
- no page template overrides the layout, so the snippet renders

**Decision: keep the markup.** Google's own position is that unused
structured data causes no problems for Search, so it costs nothing. And
removing it would work against the point of this project: a machine-readable
six-step guide with its supplies and tools enumerated is exactly what answer
engines and retrieval pipelines consume. Google not drawing a card is not the
same as nothing reading it.

**Do not re-investigate this with the Rich Results Test.** Use
`validator.schema.org`, which reports all schema.org types rather than only
Google's rich-result subset, or just view-source and search for `HowTo`.

### 19.5 FAQ rich results: verified, and it changes nothing here

The lead noted while closing §19.4 was checked and is **true**. Google retired
FAQ rich results on **2026-05-07**. Rich Results Test support went in June
2026, Search Console API support in August 2026. `FAQPage` remains valid
schema.org, and Google's position is again that the markup can stay — unused
structured data causes no problems for Search.

Caveat on sourcing: every source found is a third-party SEO blog quoting
Google's documentation. Google's own page was not read directly. They agree on
all the dates above and differ only on whether stripping old markup is
worthwhile, which is opinion rather than a Google requirement.

**The detail that settles it for this store:** FAQ rich-result eligibility had
already been narrowed in 2023 to well-known government and health sites. A
mosaic retailer was never eligible, so the 2026 removal took away something
this site never had. There is no regression to find and nothing to recover.

This store carries `FAQPage` markup in four live snippets, not one:

- `snippets/pg-faq.liquid` — the main FAQ page
- `snippets/pg-maintenance.liquid`
- `snippets/pg-order-process.liquid`
- `snippets/pg-tech-details.liquid`

**Decision: keep all four**, on the same reasoning as §19.4 and more strongly.
A structured question-and-answer block is among the most directly consumable
things on a site for answer engines and retrieval pipelines, which is the
whole point of this project.

**Do not test FAQ markup with the Rich Results Test** — support was removed in
June 2026, so it reports nothing regardless of what is on the page. Exactly the
same trap as HowTo. Use `validator.schema.org`.

Sources: [Search Engine Land / I-O 2026 roundups](https://www.seostrategy.co.uk/learn/faq-schema-deprecation-2026-rich-result-vs-schema/),
[Quattr](https://www.quattr.com/blog/faq-schema-in-2026),
[almcorp](https://almcorp.com/blog/google-faq-rich-results-no-longer-supported/).

**The pattern worth noticing.** HowTo in 2023, FAQ in 2026: Google is steadily
withdrawing rich-result support for descriptive, non-commercial schema types
while keeping Product, Breadcrumb and Merchant listings. That is an argument
for keeping this markup, not removing it. The audience for FAQPage and HowTo
is shifting from Google's SERP features to answer engines, and this catalogue
is being optimised for both.

### 19.6 A new finding: 1,285 over-long `seo.title`s catalogue-wide

Found while checking whether anything else had §19.2's problem. It is far
larger than four:

| | Count |
|---|---:|
| Products with an `seo.title` override | 1,556 |
| …ending `\| <Product Type> \| iMosaicArt` | 1,363 |
| …of those, **over 60 characters** | **1,285** |
| Length range | 50–121 |
| Products with no override whose own title exceeds 60 | 37 |

Something applied the alt-text house pattern to `seo.title` across the
catalogue. On titles that were already long the result reaches 121
characters, so Google truncates mid-phrase and the brand name — the reason
for the suffix — never renders at all.

The diagnostic number: **drop the suffix and only 61 would still exceed 60
characters.** The suffix is the cause, not the titles. And the brand is
already appended to the `<title>` by Shopify's own template on most themes,
which would make it redundant twice over.

**Not actioned yet, but no longer blocked.** The concern was that an
installed SEO app might own that field and overwrite any fix. **That check is
done and the answer is no — there is no SEO app installed** (§20.5). The only
SEO-adjacent app has read-only scopes and cannot write. So this work can
proceed whenever the owner wants it.

### 19.7 Repo hygiene: rebase/squash merges strand this branch

Recorded because it has now cost time twice.

PR #15 was rebase-merged and PR #17 squash-merged. Either way the branch's
commits are **not** ancestors of the base branch even though their content
is, so GitHub puts the merge base far enough back that identical file content
appears as an add/add conflict on both sides. PR #17 arrived showing 7
commits and 605 additions for what was a 266-line change, and
`mergeable_state: dirty`.

The fix both times was to merge the base branch into the head and resolve in
favour of the head, then verify the resolved tree hashes identically to the
pre-merge tree — which proves the merge moved no content and only gave
GitHub a sane merge base.

**Better: restart the branch from the base branch after every merge** rather
than carrying old commits forward. That was attempted and the
non-fast-forward push was refused, so the stale commits came back along with
the problem. A fresh branch name avoids it entirely, which is what PR #18
did.

### 19.8 A latent trap on the installation guide page

The page's `templateSuffix` is `"page"`, but **`templates/page.page.liquid`
does not exist.** Shopify falls back to `templates/page.liquid`, whose
handle switch renders `pg-install`, so the page works today.

Two things are wrong underneath it:

- the metadata is inaccurate, and if anyone ever creates a
  `page.page.liquid` this page silently changes
- `templates/page.installation-guide.liquid` also exists as an unused
  34-byte stub rendering `{% section 'page-installation' %}`, which is not
  the real content

Not changed — it is a live page and the correct value depends on whether the
suffix should be cleared or pointed at the real template. One field to set
once decided.

---

## 20. Collections, and the SEO-app question answered (2026-10-31)

The last untouched area. Investigating it corrected three things stated
earlier in this document, and answered the question that was blocking §19.6.

### 20.1 Three corrections

**The "duplicate all-1,948 pair" is not an SEO problem.** §14 and §18.5 both
listed `cloud-search-all-products` and `globofilter-best-selling-products-index`
as duplicate collections worth addressing. Both are published to **zero**
channels. They are invisible to the storefront and to Google. There was never
anything to fix.

**`featured-mosaics` is also unpublished**, so its missing SEO metadata costs
nothing. It was listed as a thin collection needing attention; it does not.

**`sources` *does* expose smart-collection rule conditions.** §14 recorded
that it did not, and that the loss of `ruleSet` meant rules could no longer be
read. Wrong — they are simply nested further down:

```
Collection.sources → CollectionConditionsSource.inclusion
                   → { matchType, conditions[] }
```

`conditions` is a union of twenty concrete types
(`…ConditionProductType`, `…ConditionVariantPrice`, and so on), which is why a
naive selection set returns nothing useful and makes the field look empty.

### 20.2 The real state of the collections

27 collections: **24 published, 3 not**.

Only two of the 27 are rule-based; the rest, including the 1,624-product
`glass-mosaic-art`, are **manual**. Nothing maintains their membership.

| | |
|---|---:|
| Collections | 27 |
| Published to the online store | 24 |
| Unpublished (app or draft leftovers) | 3 |
| Rule-based (smart) | 2 |
| Manual | 25 |

### 20.3 `glass-mosaic-art` makes a false material claim

The significant finding, and it is worse than a mislabelled collection.

| | |
|---|---:|
| Products in `glass-mosaic-art` | 1,624 (83% of catalogue) |
| Catalogue titles naming **glass** | 199 |
| Catalogue titles naming **stone / marble** | 586 |
| Stone-titled products that **must** be inside it | **≥262** |

That 262 is a pigeonhole floor, not an estimate: only 324 products sit outside
the collection, so at least 586 − 324 = 262 stone-titled products are inside
it. Spot-checked and confirmed — "Signature Mediterranean Seascape **Stone**
Mosaic Wall Art" is filed under **Glass** Mosaic Art, as is "Fine Abstract
Tessellation Grid Stone Mosaic Wall Art".

So the page ranks for "glass mosaic art" and delivers stone. For search that is
a relevance mismatch. For this project specifically it is worse: it feeds
answer engines a false material attribute about at least 262 products, and
material is exactly the kind of fact a retrieval pipeline will repeat.

**Not actioned** — the options (rename the collection to something materially
honest, split it into glass and stone, or accept the inaccuracy) are a
merchandising decision, not a defect with one correct fix.

### 20.4 SEO pass over every published collection

Two rounds, both verified by reading all 27 back from Shopify afterwards.

**Outright defects:**

- **`limited-edition` carried the wrong meta description entirely.** It
  described Studio Specials: *"Shop our Studio Specials for unique, one-off
  mosaic masterpieces and design prototypes."* A copy-paste error on a live
  page. Replaced with copy drawn from the collection's own body text —
  hand-cut marble, numbered, Certificate of Authenticity, retired after the run.
- **`best-sellers` had a malformed title**:
  `"Shop Best Sellers — iMosaicArt| Our Top Trending Mosaics "` — no space
  before the pipe, and a trailing space.

**Systematic:**

| | Before | After |
|---|---|---|
| Published titles over 60 chars | 12 | **0** |
| Published collections with no description | 3 | **0** |
| Published descriptions over 160 chars | 18 | **0** |
| Title length range | 47–73 | 47–60 |
| Description length range | 137–203 | **115–156** |
| Duplicate descriptions | 0 | 0 |

The old descriptions nearly all followed one template — *"Shop X featuring…
Contact us to create a personalized…"* — which is its own mild cannibalisation
problem across 18 pages. The replacements lead with the subject and the
hand-cut method, and all 18 open with a distinct phrase.

`mosaic-tile-art` was left bare in this pass because it had **0 products**
while being published to 9 channels — a live empty collection page. The owner
chose to keep rather than remove it, and it has since been built out properly:
see §20.7.

### 20.5 There is no SEO app. The §19.6 blocker is cleared.

§19.6 held back the 1,285 over-long product `seo.title`s pending a check on
whether an installed app owned that field and would overwrite any fix.

**It does not. There is no SEO app installed.** All 15 installed apps were
listed with their access scopes:

| App | Developer | Relevant scopes |
|---|---|---|
| Magical XML/HTML Sitemap | Magical Apps | **read-only** — `read_themes`, `read_content`, `read_products` |
| Search & Discovery | Shopify | `write_products` (filters and synonyms, not SEO fields) |
| Translate & Adapt | Shopify | `write_products` (translations) |
| Smile.io, Forms, Messaging, Flow, Fraud Control, Bill Pay | — | no product-content writes |

The only SEO-adjacent app, Magical Sitemap, **cannot write** — its scopes are
read-only. So nothing will revert a change to `seo.title`, and §19.6's work can
proceed whenever the owner wants it.

**A side finding from the same check:** neither Cloud Search nor Globo Filter
is installed. The two collections named after them
(`cloud-search-all-products`, `globofilter-best-selling-products-index`) are
**orphans left behind by uninstalled apps**. This also corrects a caution
recorded while investigating §20.1 — that deleting them might break site
search or filtering. It cannot: there is no app left to break. They are
unpublished either way, so deleting them is tidying, not a fix.

Also still present: the unrelated `seo.hidden` metafield definition
(`number_integer`), which was the thing that suggested an SEO app had once been
active. That now looks right — one was, and it is gone.

### 20.6 Open decisions

Three, all merchandising rather than technical:

1. ~~**`mosaic-tile-art`**~~ — **resolved, see §20.7.** The owner chose to keep
   it, so it was built into a working collection rather than unpublished.
2. **`glass-mosaic-art`** — §20.3. Rename, split, or accept.
3. **`cloud-search-all-products`** — unpublished, but carries complete,
   well-written SEO copy that is currently doing nothing. If a "Shop All" page
   is wanted, it already exists and only needs publishing.

### 20.7 `mosaic-tile-art` kept and built out

The recommendation above was to unpublish it. The owner chose to **keep** it,
which turned out to be the better call: `mosaic-tile-art` is a strong keyword
for this catalogue, and the handle was already sitting on it.

- **59 products** have "tile art" in the title; **97** have "mosaic tile"
- The collection was empty and *manual*, so nothing maintained it

Rebuilt as a **rule-based collection** — product title contains "Tile Art" —
so membership maintains itself as the catalogue changes. It now holds **58
products**, with a title (53 chars), a description (130 chars) and body copy.

A side effect worth recording: the new rule surfaced **11 draft products**
titled `<Subject> Premium Mosaic Tile Art`, created 2025-11-15, the day before
the 184 of §16.2 — one for each of 11 of the 12 subjects. These look like the
originals the generator copied from. All are DRAFT, so none competes in
search, and the §18.3 canonical picks stand.

Their `seo.description` fields are **corrupted by a bad find-and-replace**:
every "a" became "this" and every "the" became "its".

```
hthisndcrthisfted mosthisic thisrt  →  handcrafted mosaic art
thisgthisinst                      →  against
```

Harmless while they are drafts. Anyone publishing them would ship that text.

---

## 21. Title tags, meta descriptions and duplicates (2026-10-31)

### 21.1 The sizing was wrong, and the theme is why

§19.6 recorded "1,285 over-long `seo.title`s" and proposed dropping the
`| <Type> | iMosaicArt` suffix, claiming only 61 would still exceed 60
characters.

**That measured the stored field, not the rendered `<title>`.** The theme does
this:

```liquid
{%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
```

It appends ` – iMosaicArt` (13 characters) **unless the title already contains
the brand**. The old suffix suppressed that append; removing it brings the
brand straight back. So the real budget for a brand-less title is 60 − 13 =
**47 characters**, and the true figure was:

| | |
|---|---:|
| Rendered titles over 60 chars | **1,792 of 1,948 (92%)** |
| Products whose base title fits 47 chars | 949 (49%) |
| Median base title length | 48 chars |

Half the catalogue is long because the **product title itself** is long, not
because of the suffix. Caught before writing to anything.

### 21.2 The fix, and the trap it avoided

1,341 products carried an `seo.title` that was exactly
`<product title> | <type> | iMosaicArt` — pure redundancy. Clearing those lets
the theme supply the brand itself.

**The obvious method would have destroyed 1,341 meta descriptions.**
`productUpdate` with `seo: { title: … }` is a whole-object replace (§19.1), and
`seo: { title: null }` nulls the description just the same — proven on one test
product, which was restored immediately.

The safe route: Shopify exposes the legacy SEO fields as **separate
metafields**, `global.title_tag` and `global.description_tag`. Deleting
`title_tag` with `metafieldsDelete` clears the title override and **never
touches the description**.

| Check | Result |
|---|---|
| Overrides cleared | **1,341**, zero errors |
| Descriptions lost | **0** |
| Descriptions altered in any way | **0** |
| Rendered titles over 60 | 1,792 → **1,013** |
| Products fixed | **779** |

A second pass found **193 more** overrides in a different shape
(`… I iMosaicArt | <Type>`), which the first pattern missed.

### 21.3 Eight misspellings that only Google could see

Among that second batch, eight overrides differed from their product title not
by decoration but by a **typo in the `seo.title` itself** — the field Google
indexes — while the product title was correct:

| In the title tag | Should be |
|---|---|
| `Ladscape` | Landscape |
| `Bacsplash` | Backsplash |
| `Abstact` | Abstract |
| `Geoemtric` | Geometric |
| `Patter` | Pattern |
| `Islamik` | Islamic |
| `Symetrical` | Symmetrical |
| `Marbe` | Marble |

Clearing them makes the correct product title the title tag. These were
invisible on the storefront, which is why they survived.

### 21.4 Meta descriptions and double spaces

- **27 products had no meta description at all**, 26 of them ACTIVE, so Google
  wrote its own snippet. Each now has one written from that product's own body
  copy, 104–121 characters, none duplicated. **Now 0.**
- **88 product titles contained a double space**, 83 of them indexed — the same
  signature as the `Premium  Tile Art` defect of §18.2. All collapsed. **Now 0.**

### 21.5 A second generated set, and what remains

Checking duplicates surfaced **81 products titled `<Adjective> <Subject>  Floral
Stone Mosaic Art`** — 8 subjects, ~10 listings each, every one carrying the
double space. The same generator as §16.2, missed because the original scan
matched on `Premium Tile Art` rather than on the *pattern* of machine-generated
titles.

None were noindexed, so all were competing with each other.

**Still open after this pass:**

| | Count |
|---|---:|
| Active products with no meta description | **0** |
| Double spaces in titles | **0** |
| Indexed duplicate title tags | **36** (34 Floral + 1 pair) |
| Rendered titles still over 60 | **884 of 1,750 (51%)** |

The 884 need their **product titles** shortened, not their tags — a
merchandising decision, not a mechanical one. The 34 Floral duplicates need the
§18.3 noindex treatment: 8 canonical, the rest excluded.

### 21.6 A mislabeled product, not a duplicate

`MAR058` carries the handle `…the-nativity-scene-mosaic-with-three-kings` but
its title *and* body both read "The Last Supper Mosaic with Twelve Apostles" —
identical to its sibling `MAR059`, which is legitimately that piece. They were
created **two seconds apart**, so this is a bulk import where the handle
probably preserved the true identity while the title and body shifted by one.

Not guessed at: the CDN is unreachable from this environment, so the image
cannot be checked here. **Note the meta description written in §21.4 for
`MAR058` follows its title**, so if the piece is actually the Nativity, the
title, the body and that description are all describing the wrong artwork.

One for the owner, with the image:
`MAR058_706c8035-c700-4ed5-8e2a-82883012468c.jpg`

### 21.7 The method lesson

§18.2 established that a clean `userErrors: []` says nothing about items never
sent. This pass adds a second: **scanning for a known-bad string finds only
that string.**

The 184 of §16.2 were found by matching `Premium Tile Art`. That scan could
never have found the 81 Floral products, the 11 drafts, or the 88 double
spaces, because none of them contain it. Each turned up by accident — the
Floral set through a duplicate-title check, the drafts through a collection
rule.

Before this catalogue can be called clean, it needs a sweep for the *shape* of
machine-generated content — adjective-prefix repetition, byte-identical
descriptions, doubled whitespace — rather than for any particular defective
string.

## 22. The glass collection, and a second corrupted set (2026-11-01)

### 22.1 `glass-mosaic-art` fixed by membership, not by renaming

§20.3 established that the collection made a false material claim: at least 262
stone-titled products sat inside a collection named "Glass Mosaic Art". It was
left as an open merchandising decision — rename, split, or accept.

The owner chose a fourth option: **fix the membership**. Keep only products
whose title contains "glass", or whose `custom.style_filter` metafield is
`Tiled Glass Artistry`.

| | |
|---|---:|
| Members before | 1,624 |
| Members after | **414** |
| Removed | 1,210 |
| Qualifying products already inside | 414 of 414 |
| Qualifying products that needed adding | 0 |

Verified by paginating the collection's live membership afterwards and diffing
it against the computed keep-set: zero extras, zero missing, exact match. Among
the removals was **a gift card** (`GIFTCARD-100`), which had been sitting in a
product collection.

### 22.2 Three measurement traps, each of which produced a wrong number first

This is the §21.7 lesson repeating three times in one task.

**`collection_id` cannot be combined with a title or tag predicate.** The query
`collection_id:444066398506 AND title:*glass*` returns **0** — while
`collection_id:444066398506 AND status:active` returns 1,487 and is correct.
Sampling proved glass-titled products *were* in the collection. Any sizing
built on the combined query would have reported that the glass collection
contained no glass.

**Shopify's tag search tokenizes; smart-collection tag rules do not.**
`tag:glass` matched 206 products — but those products are tagged `glass mosaic`
and `glass mosaic art`, not `glass`. A rule-based collection using
`TAGGED_WITH "glass"` would have matched **none** of them, because
`CollectionSourceInclusionConditionProductTagRelation` offers only
`TAGGED_WITH` and `NOT_TAGGED_WITH` — exact match, no contains.

**`Tiled Glass Artistry` is not a tag at all.** Neither is
`Style_Tiled Glass Artistry`; zero products carry either, and no tag in the
store begins with `Style_`. It is a value of the `custom.style_filter`
metafield, which the Globo filter app renders on the storefront as a `Style_…`
chip — which is why it reads like a tag. Matching on it required reading the
metafield, since the definition was not admin-filterable.

### 22.3 What `glass-mosaic-art` actually was

A **manual** collection. §14 and §20.1 discussed its rules; it had none. In the
2026-10 model its single `CollectionConditionsSource` held
`inclusion.matchType: null`, `conditions: []`, and 1,624 manual
`inclusion.selections`.

That decided the method. Membership was changed with
`collectionUpdate(sourcesToUpdate: [{condition: {inclusion:
{selectionsToRemove: […]}}}])` in batches of 250 — `collectionAddProducts` and
`collectionRemoveProducts` no longer exist in this API version.

**The collection is still manual.** A new `Tiled Glass Artistry` product will
not join on its own. Converting it to a self-maintaining rule needs the
`style_filter` definition enabled as a collection condition
(`useAsCollectionCondition` is currently `false`) — a real configuration
change, still open.

**12 products have "glass" in the title but are styled `Handcrafted Marble
Art`** (414 keeps against 402 metafield matches). The rule is an OR, so they
stayed. On each of those twelve, either the title or the style value is wrong.

### 22.4 A second corrupted set — and it was live

§20.7 recorded 11 draft products whose `seo.description` had been mangled by a
find-and-replace that turned every "a" into "this" and every "the" into "its"
(`hthisndcrthisfted mosthisic thisrt`). They were drafts, so Google could not
see them.

Fixing them surfaced the real problem. The 11 were found by matching the title
`Premium Mosaic Tile Art`. Reading their ID-neighbors instead revealed **8
more products with the identical corruption — all of them ACTIVE**, titled
`… Handcrafted Floral Mosaic`. Same generator run, 2025-11-15 14:22–14:23.

Searching the title pattern `Handcrafted Floral Mosaic` returned 16 products,
but only 8 were corrupted; the other 8 are from 2023 and 2024 and are clean.
**The title pattern over-matched in one direction and under-matched in the
other.** Neither the first scan nor the second was a sound way to find this.

A ninth defect turned up in the same sweep: product `9787679080746` carried
**mojibake** (`natureâ€™s`, `dÃ©cor`) that survived the §14 repair.

Twenty descriptions were rewritten in total — 11 drafts, 8 live, 1 mojibake —
each 125–149 characters, US spelling, no double spaces.

### 22.5 The sweep that should have been used from the start

**Shopify's product search indexes `seo.description`.** This was not known
during §14, §18, §19 or §21, and it makes every title-pattern scan in those
sections unnecessary.

It was proven, not assumed: a phrase occurring *only* in a freshly written
`seo.description` and in no product title or body was searched for, and
returned exactly the one product.

That turns the §21.7 problem into a solved one. A catalogue-wide sweep for the
corruption signature now costs a single query:

```graphql
productsCount(query: "mosthisic") { count }        # 0
productsCount(query: "hthisndcrthisfted") { count } # 0
productsCount(query: "thisnd OR thisny OR thisre OR thist") { count } # 0
productsCount(query: "â€™") { count }               # 0
productsCount(query: "Ã¢") { count }                # 0
```

All zero across all 1,948 products. The catalogue is clean of this corruption
class and of mojibake — verified by search, not by sampling.

### 22.6 Housekeeping

Reading the `style_filter` metafield required enabling `adminFilterable` on the
definition, because scanning 1,946 metafield values directly would have been
far more expensive. The capability was **restored to `false`** afterwards
(`status: NOT_FILTERABLE`). No customer-visible setting was changed.

The pre-change snapshot of all 1,624 original `glass-mosaic-art` members is
held outside the repository, in the session scratchpad, so the removal is
reversible.

### 22.7 Still open

1. **Convert `glass-mosaic-art` to a rule?** It is manual; new glass products
   will not join automatically.
2. **The 12 glass-titled, marble-styled products** — title or metafield is
   wrong on each.
3. **The 34 Floral duplicates** — the §18.3 noindex treatment, still unapplied.
4. **884 of 1,750 titles still render over 60 characters.**
5. **`MAR058`** — needs the image to settle Last Supper vs Nativity.
6. **`cloud-search-all-products`** — publish as a Shop All page, or leave
   hidden.

## 23. The glass rule, the material mislabels, and a handle batch that lies (2026-11-01)

### 23.1 `glass-mosaic-art` is now rule-based

§22.3 left it manual, with the note that a new glass product would not join on
its own. It now does.

The manual source was deleted and a conditions source created in a single
`collectionUpdate`, with `matchType: ANY`:

| Condition | Relation | Value |
|---|---|---|
| `productTitle` | `CONTAINS` | `glass` |
| `custom.style_filter` | `INCLUDES` | `Tiled Glass Artistry` |

This required enabling `smartCollectionCondition` on the `style_filter`
definition — `useAsCollectionCondition` now reads `true`. That capability has
to stay on; the rule depends on it. It is not the same flag as the
`adminFilterable` capability of §22.6, which remains off.

**Both arms were tested separately, because a matching count proves nothing
about membership:**

| Test | Product | Expected | Result |
|---|---|---|---|
| Title arm only (styled marble) | Coastal Cliff Mosaic — Vibrant *Glass* Art | in | in |
| Metafield arm only (no "glass" in title) | Marilyn Monroe Mosaic Portrait | in | in |
| Neither arm | Mona Lisa Mosaic Portrait | out | out |
| Neither arm | iMosaicArt Gift Art Card | out | out |

Membership came out at 414, identical to the manual set it replaced.

### 23.2 Ten material mislabels corrected

§22.3 listed 12 products whose title said "glass" while `style_filter` said
`Handcrafted Marble Art`. The owner identified each. Ten were genuinely glass
and the metafield was wrong:

`MAS021`, `MAS024`, `MAS035`, `MAS039`, `MAS040`, `MAS042`, `MAS043`,
`MAS055`, `MAS082`, `MAR029`.

Nine of those ten are MAS-prefixed landscapes from one SKU run, which is
consistent with a single bulk edit having set the whole run to marble.

Products carrying the glass style went from 402 to 412. Collection membership
did not move: all ten were already inside through the title arm. The storefront
`Style` filter is now accurate for them.

### 23.3 The two that were not mislabels

**`MAD027` "Mosaic Wine Glass"** — the metafield was right. "Glass" was the
*subject*, a wine glass depicted in marble, not a material claim. The title
merely tripped a keyword match.

**`MAP021` "Marilyn Monroe Portrait - High Quality Mosaic Glass Tile"** — the
metafield was right and the *copy* was wrong, in two places. The title claimed
glass, and the body said **"Made from premium-quality glass"** on a marble
piece. The body was the more serious of the two: a title can be read as a style
name, but that sentence is an unambiguous statement about what the buyer
receives.

Both were rewritten, and both now agree across all four surfaces — title, body,
meta description and URL:

| | Before | After |
|---|---|---|
| `MAP021` title | …High Quality Mosaic **Glass Tile** | **Marilyn Monroe Marble Mosaic Portrait** |
| `MAP021` body | "Made from premium-quality **glass**" | "Made from premium-quality **marble**" |
| `MAD027` title | Mosaic Wine **Glass**- Mosaic Tile Art | **Poured Red Wine Marble Mosaic Tile Art** |

Two incidental defects were fixed in passing: the malformed `Glass- Mosaic`
(missing space) and `glass.This` (missing space) in the `MAD027` body.
Rendered `<title>` for `MAP021` fell from 70 characters to 50.

Both dropped out of `glass-mosaic-art` on their own once the titles changed —
414 to 412 — which is the clearest proof the rule of §23.1 is live. Smart
collection membership is asynchronous; the count was wrong for about a minute
after the write and right afterwards.

**A trade-off worth recording:** `MAD027` no longer matches a search for
"wine glass mosaic", which is a plausible query for it. Losing that keyword was
accepted as the price of truthful collection membership, with the owner's
agreement.

### 23.4 Handle changes and redirects

Three handles were changed. Each used `redirectNewHandle: true` on
`productUpdate`, which creates the 301 inside the same transaction, so the old
URL never 404s. All three redirects were confirmed by querying `urlRedirects`
afterwards, not taken from the mutation response.

| Old path | New path |
|---|---|
| `…marilyn-monroe-portrait-high-quality-mosaic-glass-tile` | `…marilyn-monroe-marble-mosaic-portrait` |
| `food-mosaics-mosaic-wine-glass-mosaic-tile-art` | `food-mosaics-poured-red-wine-marble-mosaic-tile-art` |
| `religious-mosaics_the-nativity-scene-mosaic-with-three-kings` | `religious-mosaics_last-supper-mosaic-with-twelve-apostles` |

`seo` was deliberately omitted from these mutations. Sending it would have hit
the §19.1 replace-not-merge trap and nulled the meta descriptions written
minutes earlier. Read-back confirmed all three survived.

### 23.5 `MAR058` closed, and what it exposed

§21.6 recorded that `MAR058`'s handle said *Nativity Scene with Three Kings*
while its title and body said *The Last Supper*, and that the artwork could not
be identified from this environment. The owner confirmed: **it is the Last
Supper.** The title and body were right; the handle was wrong, and has been
corrected with a 301.

Checking it exposed the real defect. **Seven of the nine religious products in
that 2025-11-01 batch carry a handle naming a different artwork:**

| SKU | Title | Handle says | Match |
|---|---|---|:--:|
| `MAR055` | Virgin of Guadalupe Handcrafted Religious Mosaic | The Holy Family with Golden Haloes | ✗ |
| `MAR056` | Jesus Christ Sacred Handcrafted Mosaic | The Annunciation with Archangel Gabriel | ✗ |
| `MAR057` | Our Lady of Guadalupe Sacred Mosaic Art | Madonna and Child with Blue Mantle | ✗ |
| `MAR058` | The Last Supper Mosaic with Twelve Apostles | The Nativity Scene with Three Kings | ✗ (fixed) |
| `MAR059` | The Last Supper Mosaic with Twelve Apostles | The Last Supper with Twelve Apostles | ✓ |
| `MAR060` | The Nativity Mosaic With Mary, Joseph & Baby Jesus | The Crucifixion with Mary and John | ✗ |
| `MAR061` | The Resurrection of Christ Mosaic | The Resurrection of Christ | ✓ |
| `MAR062` | "Christ in Color" Handmade Abstract Mosaic Portrait | The Ascension of Christ with Apostles | ✗ |
| `MAR063` | "Our Lady of the Miraculous Medal" Handmade Mosaic | St George and the Dragon | ✗ |

Every other category created in that same batch — animals, birds, flowers,
geometric, landscape, nautical, portrait, 67 products in all — has handles that
match their titles exactly. **The corruption is confined to
`religious-mosaics_*`.**

The handles name a coherent set of religious subjects (Holy Family,
Annunciation, Madonna and Child, Nativity, Crucifixion, Ascension, St George)
that exist as *no product in the catalogue*. The most likely explanation is
that one list of planned subjects produced the handles while a different list
produced the titles.

The SEO cost is direct: someone searching "crucifixion mosaic" can land on a
URL promising it and be shown a Nativity. Six remain unfixed, pending the
owner identifying each artwork — the same blocker as `MAR058`, which only the
owner can clear.

**`MAR058` and `MAR059` also share a title exactly**, two seconds apart in
creation time. That duplicate is untouched and is a separate decision.

### 23.6 Still open

1. **The generated duplicate farm** — ~350 active products from **20
   artworks** crossed with 16 adjectives. `Hand-Set Tuscan Vineyard Sunset
   Stone Mosaic Wall Art` is live six times. Proposal: keep 20 canonical,
   noindex the rest, delete nothing. Unanswered, and it gates item 2.
2. **884 of 1,811 active titles render over 60 characters.** Mechanism agreed:
   short `seo.title` overrides, never rewriting customer-visible product
   titles. Blocked on item 1.
3. **Six more mismatched religious handles** (§23.5) — needs the artworks
   identified.
4. **`MAR058` / `MAR059` duplicate title.**
5. **`cloud-search-all-products`** — publish as a Shop All page, or leave
   hidden.

## 24. Eighteen religious listings reconciled, and an ID error of my own (2026-11-01)

### 24.1 The full extent of the handle corruption

§23.5 recorded seven mismatched handles in the `MAR055`–`MAR063` range and
called the rest blocked on the owner. Both figures were wrong. Enumerating the
whole `Religious Mosaics` product type (107 products) showed the corruption ran
from **`MAR055` to `MAR072`** — sixteen products whose handle named a different
artwork from their title. Only `MAR059` and `MAR061` in that run were correct.

Everything outside that run was clean: all 67 products created in the same
2025-11-01 batch under other categories, and all 89 other religious products,
have handles matching their titles.

### 24.2 The image alt text was wrong too

Not recorded in §23.5 because it had not been looked at. On all sixteen, the
`featuredMedia` alt text named **the same wrong artwork as the handle** — a
Virgin Mary piece announced as `St. George and the Dragon Mosaic`.

This is worse than the URL. Alt text is what Google Images indexes and what a
screen reader reads aloud. A visually impaired visitor was told the wrong
subject on sixteen products.

It also gave a clean detection signature. Every correct religious product's alt
ends `| Religious Mosaics | iMosaicArt`; on all sixteen broken ones the suffix
was absent. Handle and alt agreed with each other; title and description agreed
with each other. Two sources, two fields each.

### 24.3 Listings where the *title* was wrong, not the handle

The working hypothesis after §23.5 was that titles were authoritative — the
owner's `MAR058` confirmation supported it, and the product descriptions
corroborated the titles in every case that could be checked from here.

**That hypothesis was wrong twice here, and a third time in §24.6.**

| SKU | Title said | Reality | What was fixed |
|---|---|---|---|
| `MAR060` | The Nativity, with Mary, Joseph & Baby Jesus | **The Crucifixion with Mary and John** | title, body, meta description |
| `MAR070` | "Agony in the Garden" | **The Last Judgment with Angels and Saints** | title, body, meta description |

On both, the handle and alt were right and the title *and its description* were
wrong — the description had been written to match the wrong subject, so
correcting the title alone would have left the page describing something it
does not depict.

Had the mechanical fix been applied to all sixteen as planned, these two would
have had their **correct** URLs rewritten to match **wrong** titles, making
them worse. Only the owner's per-product confirmation caught it.

A third reversal, `MAR059`, was found later and by different means — see
§24.6. It is counted in the table below.

### 24.4 An ID-lookup error, and its repair

Writing the first batch of corrections, product IDs were used that had been
**inferred from an earlier listing rather than resolved by query**. Four handle
writes landed on the wrong products, including `MAR059`, whose handle was
already correct.

It was caught immediately: the mutation echoes each product's title, and the
titles did not match the handles being set. The repair:

1. Queried the true SKU → ID mapping for the whole range.
2. Restored all six handles. The wrong handles formed a **cycle**
   (`MAR055`'s correct handle was held by `MAR056`, whose was held by
   `MAR057`, whose was held by `MAR059`), so they had to be freed in
   dependency order within a single ordered mutation.
3. Repaired three `urlRedirect` targets that pointed at the wrong product.
   Shopify had already removed `MAR059`'s bogus redirect automatically when its
   handle was restored.

Only handles were touched; no titles or descriptions were lost. The bad state
lasted a few minutes.

**The lesson is narrow and was already available.** This same mistake was made
and flagged an hour earlier, when IDs guessed for `MAR055`–`MAR057` returned
`MAM019`, `MAR070` and `MAR072` instead. Noticing a failure mode is not the
same as fixing it: **resolve SKU to ID by query, every time, even when a
mapping seems obvious from a listing read minutes before.**

### 24.5 Final state

| | Count |
|---|---:|
| Handle corrected to match title | 13 |
| Title, body and meta corrected to match artwork | 3 |
| Already correct, untouched | 1 |
| Alt text rewritten to house format | 17 |
| 301 redirects created | 13, plus 1 repointed and 1 deleted |

The single "already correct" row is `MAR061`, and it is correct only in the
sense that nothing contradicts itself on it. See §24.6a.

All eighteen products in `MAR055`–`MAR072` now agree across title, handle and
alt text, verified by a fresh read of every row rather than from the mutation
responses. Every redirect was created by `redirectNewHandle: true`, inside the
same transaction as its handle change, so no old URL ever returned a 404.

### 24.6 `MAR058` and `MAR059`: a third title reversal, found by eye

§23.5 flagged these two as sharing a title exactly and called them duplicates
needing differentiation. **That was wrong, and so was the first correction to
it.**

The first pass established they were two different artworks — 150 x 90 cm at
$1,588 against 110 x 130 cm at $1,658, distinct images, `MAR059` also in
best-sellers — and concluded the fix was to differentiate the wording, since
noindexing either would remove a real product from search.

Then the owner looked at `MAR059`'s image. **It is not a Last Supper at all.**
It is the Holy Family: Saint Joseph holding his lily staff, the Virgin Mary
veiled beside him, and the Christ Child at the center, each under a golden
halo.

| | Before | After |
|---|---|---|
| Title | The Last Supper Mosaic with Twelve Apostles | The Holy Family Mosaic with Golden Haloes |
| Handle | `…_the-last-supper-mosaic-with-twelve-apostles` | `…_the-holy-family-mosaic-with-golden-haloes` |
| Meta description | 312 characters of duplicated body copy | 132 characters, written from the image |
| Alt text | The Last Supper… | The Holy Family… |
| Body | identical to `MAR058`'s, word for word | written from the artwork |

Two redirect subtleties had to be handled. The handle `MAR059` needed was
occupied by a **redirect left over from the §24.4 repair** (`MAR055`'s old path
pointing at its new one), so that redirect was deleted before the handle could
be taken. And `MAR059`'s old Last Supper URL would then have pointed at a Holy
Family page, so it was repointed to **`MAR058`**, which is the real Last
Supper. A visitor following an old link still arrives at the artwork they were
looking for.

This dissolves the "duplicate title" problem entirely. There was never a pair
to differentiate — one is a Last Supper, the other a Holy Family.

### 24.6a Why this one matters more than the other two

On `MAR060` and `MAR070` the fields disagreed: handle and alt said one thing,
title and description said another, and that disagreement is what exposed them.

**On `MAR059`, title, handle and alt text all agreed with each other — and all
three were wrong.**

Every detection method used across §23 and §24 depends on two sources
contradicting each other. None of them can see a product where the wrong answer
is recorded consistently in every field. `MAR059` was classified as "already
correct, untouched" in §24.5 for exactly that reason, and it was not correct.

The only thing that found it was a person looking at the picture.

`MAR061` was the one remaining product in the `MAR055`–`MAR072` run never
checked against its image, and it was internally consistent in the same way
`MAR059` was. It also carried the same 312-character body-dump meta
description, which was a weak signal it came off the same conveyor.
**Unverified, not verified-correct** — the distinction §18.2 and §21.7 keep
insisting on.

The owner has since looked at it. It is Christ, which its title, handle and alt
text all already said. **The weak signal was right about the meta description
and wrong about the subject** — see §24.8.

### 24.7 Still open

1. **The generated duplicate farm** — ~350 active products from 20 artworks
   crossed with 16 adjectives, one title live six times. All of it is already
   crawlable at `/collections/all`, so the exposure is live, not hypothetical.
   Proposal: keep 20 canonical, noindex the rest, delete nothing. Gates item 2.
2. **884 of 1,811 active titles render over 60 characters.** Blocked on item 1.
3. **Rich Results re-test** — the only item that cannot be done from this
   environment.

### 24.8 Addendum: `MAR061` closed, and twelve meta descriptions rewritten

Written after §24 was merged. The work below happened afterwards and belongs
with it.

**`MAR061` needed no correction to its subject.** The owner confirmed it is
Christ; its title, handle and alt text already said so. §24.6a was right that
internal consistency proves nothing, and in this instance the consistency
happened to be correct.

**But checking it found the defect it shared with `MAR059`.** Its meta
description was 312 characters of dumped body copy, double the useful limit.
Rewritten to 141.

**That one check exposed eleven more.** A sweep of the whole
`MAR055`–`MAR072` run showed most of the batch still carrying the same
body-dump pattern at 360–540 characters, every one of them truncated in search
results: `MAR056`, `MAR062`, `MAR063`, `MAR064`, `MAR065`, `MAR066`, `MAR067`,
`MAR068`, `MAR069`, `MAR071`, `MAR072`. All eleven rewritten from their own
body copy, 126–138 characters each.

**Two carried broken quotation marks** that would have rendered as-is in a
search result:

| SKU | Opened with |
|---|---|
| `MAR067` | `St. Joseph and the Christ Child"` — a closing quote with no opening one |
| `MAR071` | `'Queen of Heaven"` — an apostrophe paired with a double quote |

Final state of the run, verified by a fresh read of all eighteen: titles,
handles and alt text agree; every meta description is 111–141 characters; no
quote defects; US spelling throughout.

**The pattern worth keeping.** Three times in this run, checking one product
because of a weak signal revealed a defect across a dozen more — the eleven
here, the sixteen handles in §24.1, the eight live corrupted descriptions in
§22.4. In each case the first product was found by accident and the rest by
sweeping the batch it came from. **Sweep the cohort, not the symptom.**

## 25. The repository consolidated (2026-11-01)

Not store work. Eleven pull requests had been open against this branch since
June, from sessions that each ended without merging. The owner confirmed the
work in them was in use, so they were triaged and resolved rather than left.

### 25.1 What the triage found

Reading the branches locally against the current base was far cheaper than
eleven API round-trips, and it changed the picture twice.

**`shopify-live` is the active branch.** It moved twice *during* the triage,
both times with Mosaic Designer commits. That single fact reclassified three
pull requests: what looked like unmerged work was, in several cases, an earlier
draft of something already shipped.

**But "already shipped" is not the same as "redundant".** `tools/mosaic-designer`
in #11 looked superseded by `assets/mosaic-designer.js` on `shopify-live`. It is
not — it is the *source and build pipeline* the shipped file is generated from.
Closing it would have thrown away the toolchain and kept only the output.

### 25.2 Merged

| PR | What landed |
|---|---|
| #7 | `SKU_LOGIC.md`, image upload script, settings |
| #1 | Redesign blueprint and the Dawn delivery package |
| #8 | `brochure/` — trade portfolio, price list, colour charts, build pipeline |
| #12 | `imosaicart-journal-writer` agent |
| #10 | `meta-post-scheduler` agent |
| #5 | `instagram-publisher` agent |
| #2 | `.mcp.json`, `SHOPIFY_SETUP.md` |
| #11 | `tools/mosaic-designer` source and build pipeline |
| #3 | The self-contained Shopify theme, 153 files |

The repository went from three top-level entries to twelve. All five agents are
now committed under `.claude/agents/`; three of them had existed only in session
checkouts, which is why they worked but were not in the repository.

### 25.3 A sequencing mistake of mine

The merges were done in the order the pull requests were listed, not in an order
chosen with any thought.

**#3 was `clean` before #1 was merged and `dirty` afterwards.** #1 adds
`theme/README.md` and three `theme/templates/*.json`; #3 adds the same four
paths. Merging #3 first would have cost nothing. The conflict was created
entirely by the order, and it then needed a resolution commit pushed to another
session's branch.

Order the merges by what they touch before starting, not by PR number.

### 25.4 Two artifacts that claimed the same directory

The conflict turned out not to be mechanical, and resolving it the obvious way
would have destroyed a deliverable.

| | #1's templates | #3's templates |
|---|---|---|
| `collection.json` | 826 bytes | 81 bytes |
| Sections referenced | `main-collection-banner`, `main-collection-product-grid` | `main-collection` |
| Do those sections exist here? | **No** | Yes, #3 ships them |
| What it is | a package to paste into the Dawn draft theme | part of a self-contained theme |

They are not two versions of one file. `theme/APPLY.md` tells the reader to
paste #1's three JSON files into the Dawn draft theme; they reference standard
Dawn section types that this repository does not contain and never will. #3 is a
complete theme that brings its own sections.

Taking either side would have been wrong. #1's package was moved intact to
`theme/dawn-package/` with a `NOTE.md` explaining the split, and **all four
files were verified byte-for-byte identical to the originals before the merge
was allowed to proceed.** Nothing was altered.

### 25.5 Closed, with branches left intact

**#6, `seo-sem-optimizer`** — 164 lines, superseded by the 325-line
`seo-aeo-geo-sem-optimizer.md` already on the base, which is the agent that did
all of §18–§24. The owner confirmed the earlier version was never used. Merging
would have put two similar agents under different names in `.claude/agents/`,
making invocation ambiguous for no gain.

**#4, "Shopify live"** — a pull request from `shopify-live` into this branch:
582 commits, 201 files, `dirty`, open since June, and **deleting
`.claude/agents/shopify-product-creator.md`**. A pull request between two
long-lived branches that both keep moving can never complete; it is permanently
behind itself. The direction was also backwards — `shopify-live` is the deploy
*target*, as §13 and PR #16 used it.

Closing a pull request does not delete or alter its head branch. `shopify-live`
is untouched and theme deployment is unaffected.

### 25.6 Still open

1. **The generated duplicate farm** — ~350 active products from 20 artworks
   crossed with 16 adjectives, one title live six times, all crawlable at
   `/collections/all`. Gates item 2.
2. **884 of 1,811 active titles render over 60 characters.**
3. **Rich Results re-test.**

---

## 26. Four URLs, a LocalBusiness that was never there, and 733 titles (2026-11-01)

§25 closed with three pending items and two numbers in them. Both numbers were
wrong, in opposite directions, and finding that out was most of the work.

### 26.1 The Rich Results checklist: 4 of 4, zero defects

| URL | Items | Detail |
|---|---|---|
| `/` | 2 | Organisation, Local businesses |
| `/collections/glass-mosaic-art` | 3 | + Breadcrumbs |
| `/products/religious-mosaics_last-supper-…` | 5 | + Breadcrumbs, Product snippets, Merchant listings |
| `/products/landscape-mosaics-hand-set-tuscan-…` | — | "URL is not available to Google" |

Product and Merchant listings both validated, which settles a real doubt: the
`@id` cross-references for `brand`, `seller` and `manufacturer` point at the
`Organization` node in a *different* `<script>` block, and Google resolves them
fine. No change needed. That had been the predicted failure point.

### 26.2 The LocalBusiness that was never there

The homepage test showed `Local businesses: 1 valid item`, and §15 says PR #16
removed exactly that node. I told the user it was a real finding and mine. It
was not.

Every file the homepage renders was read: `layout/theme.liquid`, both section
groups, `templates/index.liquid`, all fourteen homepage sections,
`snippets/seo-breadcrumbs.liquid`, `snippets/limespot.liquid`,
`config/settings_data.json` (one app embed — Shopify Inbox, no structured data)
and `assets/theme.js`. The only JSON-LD on the page is `theme.liquid`'s
`@graph`, and its `@type` is the plain string `"Organization"` — not an array,
no `Store` sub-node.

The arithmetic across the three pages proves it:

```
home       2 = Organisation + Local businesses
collection 3 = those two + Breadcrumbs
product    5 = those two + Breadcrumbs + Product snippets + Merchant listings
```

The same two rows on every page are **one** `Organization` node, which Google
counts under both headings because it carries a `PostalAddress` and a
`telephone`. PR #16 deployed correctly the whole time. Nothing to fix.

**Lesson.** A testing tool's grouping is not the page's markup. "Local
businesses: 1" names a *rich-result feature*, not a `@type`. Before believing a
tool's label over the source, read the source.

### 26.3 robots.txt ruled out, and the failure mode it avoids

The noindexed product returned "URL is not available to Google" while still
showing parsed structured data — so the page *was* fetched and rendered. That
left two candidates: the `noindex` meta working, or a `robots.txt` Disallow.

`templates/robots.txt.liquid` does not disallow `/products/`. This matters
beyond the test: `seo-breadcrumbs.liquid`'s own comment warns that "a Disallow
stops the crawl, not the listing", and a Disallow *plus* a noindex is
self-defeating — Google can never crawl the page to see the noindex. The theme
avoids that trap, and now it's verified rather than assumed.

### 26.4 The duplicate cohort: ~350 was wrong, 184 was right

§25's pending list said "~350 active products from 20 artworks crossed with 16
adjectives". That came from multiplying, not counting. Measured:

- 173 active titles end in `Stone Mosaic Wall Art`
- 16 decorative adjectives, derived empirically from first words
- grouping by subject: **12 subjects, 172 decorated listings, 1 genuine singleton**
- plus 12 canonical `<Subject> Mosaic Art` listings = **184**

Which is exactly what `seo-breadcrumbs.liquid`'s own comment had recorded all
along. The theme was right and the pending list was my arithmetic.

### 26.5 Ten holes in a policy that had already shipped

The comment claims 172 carry `seo.noindex`. Only 162 did. Ten decorated
duplicates — one each in ten of the twelve subjects — had never been set:

| Subject | Unprotected |
|---|---|
| Mediterranean Seascape | Signature |
| Tuscan Vineyard Sunset | Exclusive |
| Snowy Mountain Vista | Signature |
| Desert Oasis at Dawn | Heritage |
| Venetian Canal View | Decorative |
| Roman Labyrinth Design | Decorative |
| Op Art Cube Pattern | Exclusive |
| Abstract Tessellation Grid | Fine |
| Moroccan Star Medallion | Luxury |
| Art Deco Fan Motif | Bespoke |

Five were unarguable: a **byte-identical title** already noindexed sat beside
them. "Exclusive Tuscan Vineyard Sunset Stone Mosaic Wall Art" exists three
times, two protected and one not.

All ten written, then **re-read to verify** — which mattered, because for the
five with identical twins the mutation echo shows a matching title either way
and proves nothing. Zero nulls remain. 172/172 protected, 12 canonical indexed.

**Lesson.** A policy that shipped is not a policy that holds. The regularity
(one miss per subject, ten of twelve) says a batch skipped a row per group, not
that someone made ten decisions.

### 26.6 884 was right; 1,663 was mine

§25 said "884 of 1,811 active titles render over 60 characters". Re-measuring
from the cached catalogue scan gave 1,663, and the gap looked like a real
finding: 1,352 products carried a `seo.title` of the form
`<product title> | <Category> Mosaics | iMosaicArt`, 33 characters of
boilerplate pushing them over.

Before writing anything I checked one product live. `seo.title` was **null**.
So were all 40 in a follow-up sample across two categories. The boilerplate had
already been cleared store-wide; my scan was from 2026-10-31 16:41 and stale on
precisely the field being measured.

The live figure is `len(product.title) > 47` — 901 on current data, and 884 when
§25 was written. **The original number was right and the "correction" was the
error.**

**Lesson.** A cached scan is evidence about the moment it was taken. Before
measuring a field, read that field live for one row.

### 26.7 733 titles, and three drafts that never shipped

Budget: the theme appends ` - iMosaicArt` (13 chars) unless the title already
contains the brand, so `seo.title` must be ≤ 47. Target set: 901 over-length
titles minus 168 noindexed duplicates (whose titles are moot for search) = **733**.

Written via `metafieldsSet` on `global.title_tag`, **not** `productUpdate(seo:)`
— `SEOInput` is a whole-object replace and would have nulled every
`seo.description` in the catalogue (§21). Verified after: descriptions intact.

Three rules were rejected before one shipped:

1. **Specificity scoring** picked the marketing tagline over the product:
   `Mosaic Tile Backsplash - A Beautiful Addition To Your Kitchen` →
   *"A Beautiful Addition To Your Kitchen"*. Every product word was in the
   generic stoplist, so the tagline won on "specificity".
2. **Position beats scoring for colons.** In `Name: Tagline` the name is simply
   on the left. Scoring had produced *"A Sacred Tribute to Faith and Devotion"*
   over **Guadalupe**, and dropped **Banksy**.
3. **Word-squeezing before structure** mangled titles:
   *"Mosaic Backsplash - A Addition To Your Kitchen"*, *"Where Meets
   Imagination"*, *"Tranquil Beauty in"*. Reordering to colon → dash → squeeze →
   truncate fixed all three.

A fourth defect — *"Glass Mosaic Flower Arrangements Arrangements"* — came from
the collision resolver appending a word already present, because punctuation
defeated its duplicate check. Caught by reading the generated payload before
sending it.

Final: 733 titles, 0 over budget, 0 trailing stopwords, 0 duplicated words, 0
collisions with existing titles, rendered median 55 / max 60.

**Lesson.** Read the generated payload, not just the summary statistics. Every
one of these passed the counters and failed the eye.

### 26.8 495 underscore handles, and why the cache could not be trusted twice

`religious-mosaics_last-supper-…` led somewhere: **495 active handles** use
`<category>-mosaics_<slug>` — 27% of the live catalogue, across 15 categories,
exactly one underscore each, and **0 collisions** with the hyphenated form.
Google treats hyphens, not underscores, as word separators.

The fix is mechanical (`handle.replace('_','-',1)` with `redirectNewHandle:
true`, which mints the 301 in the same transaction). **All 495 were rewritten**,
every target derived from a live read, zero `userErrors`.

Two things nearly went wrong first.

**`redirectNewHandle` is a field inside `ProductUpdateInput`, not an argument
on `productUpdate`.** Passing it as an argument is rejected outright by API
2026-10, which is the lucky outcome: had the wrong shape been accepted and
ignored, all 495 live product URLs would have been renamed with **no redirects
at all**. The working shape was confirmed on a single product, and the 301 was
then verified by querying `urlRedirects` rather than trusting the mutation's
echo.

**The cache was wrong on fifteen of them.** A 39-product live sample found one
drift; widening to the 100 at-risk products found **15**, every one in the
MAR055–MAR072 batch reconciled in §24:

```
cache: religious-mosaics_the-nativity-scene-mosaic-with-three-kings
live : religious-mosaics_last-supper-mosaic-with-twelve-apostles
```

Deriving targets from the cache would have renamed fifteen products **back to
the wrong artwork** and minted 301s pointing at the wrong pieces — undoing §24
precisely. This is §24.4's error wearing a different hat, and the only reason it
did not land is that the field had been checked live first.

A third, smaller error: a hand-count of one batch said 80 renames where 79 had
been written. Reconciling the written ids against the source list after every
round caught it. Counting several hundred items by eye does not hold; the
reconciliation step is what makes a bulk rename safe.

Verified three ways: per-round reconciliation (final `495/495, remaining: 0`),
a 25-product sample spread across the range re-read live (all hyphenated, no
underscores), and redirect spot-checks from three separate batches.

**Lesson, and it is the same one as 26.6.** A cache is stale exactly where the
work was done. The fields you edited are the fields most likely to have drifted,
so they are the worst possible candidates for a cached read.

**Second lesson.** Before a bulk write, prove the mutation shape on one row and
verify its *side effect*, not its return value. A rename that silently skips its
redirect looks identical in the response to one that does not.

### 26.9 A second duplicate family, found the same way as the first

Mid-batch, the title payload surfaced
`<Adjective> <Subject> Floral Stone Mosaic Art` — the same 16 adjectives,
**78 active products**, and **none carry `seo.noindex`**. "Lily Pond Medallion"
has 11 live listings including two identical "Luxury" and two identical
"Artisanal".

The §21.7 sweep had matched the string `Stone Mosaic Wall Art`, so it could
never have seen a family ending `Floral Stone Mosaic Art`. The duplicate
population is **262**, not 184, and 78 of them are unprotected.

**Lesson (fourth time).** Match the generator's pattern, not one of its outputs.

### 26.10 Collection pages could not be enumerated

The collection test returned Breadcrumbs, Organisation, Local businesses — and
nothing describing the 412 products on the page. An answer engine could tell the
page was *about* glass mosaics but could not list what was in it.

PR #27 adds `CollectionPage` + `ItemList` to `snippets/seo-breadcrumbs.liquid`,
mirroring the blog block already there. Deliberate choices: no `BreadcrumbList`
(main-collection.liquid emits one); page 1 only (outside a paginate tag
`collection.products` returns the first 50 whatever `?page=` says); skips
`seo.noindex` products; counter-based commas rather than `forloop.last`, which
the noindex filter makes unreliable and which would emit a trailing comma and
invalid JSON.

Not merged here. The snippet renders in `<head>` on every page, and a Liquid
error there takes the storefront down. Tag balance was verified statically but
it was not render-tested — the storefront is unreachable from the container, and
compiling it by writing to an unrelated backup theme would have been a side
effect on someone else's data.

### 26.11 Repository

PR #25 (Mosaic Designer) merged as `0459845`, pinned to the inspected SHA
because another session was actively pushing to the branch. The repo runs no
CI, so "mergeable and clean" is the whole signal available.

### 26.12 Pending

**Decisions:**
1. **PR #27** — merge to deploy the collection `ItemList`.
2. **78 unprotected duplicates** (26.9) — same call as the 184.

**Open work:** none outstanding from this section.

**Verification owed:**
4. The two "non-critical issues" rows on the product Rich Results test.
5. Re-test `/collections/glass-mosaic-art` after PR #27 deploys; expect 4 items.

**Corrections to §25's pending list:** "~350 active products from 20 artworks"
should read **184 from 12** (26.4). "884 of 1,811" was **correct** (26.6).
