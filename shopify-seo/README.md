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
| `snippets/seo-breadcrumbs.liquid` | **`BreadcrumbList` for content pages, blog articles and the blog index** (16 `pg-*` snippets render a visible breadcrumb; none emitted schema). Plus a `CollectionPage`/`ItemList` for the blog index so AI engines can enumerate your articles. |
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
