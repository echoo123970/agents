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
