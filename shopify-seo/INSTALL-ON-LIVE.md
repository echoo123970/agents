# Installing on the live theme, by hand

For keeping `agents/shopify-live` as the live theme and applying the changes to it
directly, instead of publishing a duplicate.

I cannot do any of this from here: the Shopify MCP blocks theme-file writes that
target the live theme, and blocks theme publishing. Both were attempted and
refused. So these are steps for you, in **Online Store → Themes → ⋯ → Edit code**
on `agents/shopify-live`.

Four files are added, one is replaced, and two get a small surgical edit. The
order below is deliberate: nothing renders the new snippets until the last two
steps, so the storefront stays correct at every intermediate point. You can stop
after any step.

---

## Step 0 — make a rollback point (30 seconds, do not skip)

**Online Store → Themes → `agents/shopify-live` → ⋯ → Duplicate.**

Name it something like `live backup before SEO schema`. This is your undo for
steps 5 and 6, which edit files that every product page depends on.

(The theme I created, `iMosaicArt + SEO schema (preview, then publish)`, is *not*
a backup — it is live *plus* the changes. Useful as a reference to compare
against, not as an undo.)

---

## Steps 1–3 — add three new snippets

In the code editor: **Snippets → Add a new snippet**, give it the name below
(without the `.liquid`), then paste the whole contents of the matching file from
this folder.

| Create snippet | Paste from |
|---|---|
| `seo-product-schema` | `shopify-seo/snippets/seo-product-schema.liquid` |
| `seo-breadcrumbs` | `shopify-seo/snippets/seo-breadcrumbs.liquid` |
| `seo-howto-install` | `shopify-seo/snippets/seo-howto-install.liquid` |

Nothing changes on the storefront yet — no file renders these until step 5 and 6.

---

## Step 4 — replace `templates/robots.txt.liquid`

Open **Templates → `robots.txt.liquid`**, select all, and paste the whole
contents of `shopify-seo/templates/robots.txt.liquid`.

This fixes two real bugs: named AI-crawler groups had `Allow:` lines but no
`Disallow:` lines, and a crawler obeys only its most specific `User-agent` group —
it never inherits from `User-agent: *` — so GPTBot, ClaudeBot and PerplexityBot
were free to crawl `/cart`, `/checkout` and `/account`. It also drops a
`Sitemap:` line pointing at `llm.txt`, which Search Console reports as an invalid
sitemap because a sitemap must be XML or one URL per line, and `llm.txt` is prose.

Check it afterwards at `https://www.imosaicart.com/robots.txt`.

---

## Step 5 — edit `templates/product.liquid`

Open **Templates → `product.liquid`**. The Product JSON-LD is the very first
thing in the file. **Delete from line 1 down to and including the first
`</script>`.**

The first line to delete is exactly:

```
{%- comment -%} Product structured data — enables rich results (price/availability) and AI shopping agents. {%- endcomment -%}
```

The last line to delete is the first `</script>` in the file — the one immediately
followed by a blank line and then:

```
{%- comment -%} Breadcrumb structured data for the product. {%- endcomment -%}
```

**Leave that Breadcrumb block and everything after it alone.** It is about 39
lines you are removing in total.

In their place, paste exactly these two lines:

```liquid
{%- comment -%} Product structured data lives in snippets/seo-product-schema.liquid. {%- endcomment -%}
{% render 'seo-product-schema' %}
```

Sanity check before saving: the file should now **start** with that comment and
render line, and the next thing in it should be the Breadcrumb comment. Search the
file for `ld+json` — there should be exactly **one** hit left (the breadcrumb).
Two hits means the old block was not fully removed, and you would ship duplicate
Product schema.

### Why a snippet rather than pasting the new schema inline

So there is exactly one Product JSON-LD per page, and so the schema can be edited
later without opening a 30 KB template. `pdp_desc` moved into the snippet with it;
nothing else in the template used that variable.

---

## Step 6 — edit `layout/theme.liquid`

Open **Layout → `theme.liquid`** and find this line in the `<head>` (it is the
only occurrence, roughly two-thirds down the head):

```liquid
    {{ content_for_header }}
```

Paste these lines **immediately before** it:

```liquid
    {%- comment -%}
      SEO structured data:
        * seo-breadcrumbs   — BreadcrumbList for /pages/*, articles and the blog index,
                              plus a noindex meta for wishlist/cart/search/customer pages.
                              Products and collections already emit their own breadcrumbs.
        * seo-howto-install — HowTo schema, only on /pages/installation-guide.
    {%- endcomment -%}
    {% render 'seo-breadcrumbs' %}
    {%- if request.page_type == 'page' and page.handle == 'installation-guide' -%}{% render 'seo-howto-install' %}{%- endif -%}

```

It must go inside `<head>`, not in the body: the `noindex` meta tag that
`seo-breadcrumbs` emits is only honoured in the head.

This is the step that switches everything on.

---

## Step 7 — verify

1. **A product page loads normally.** Step 5 edited the template behind all 1,819
   published products. Check one before anything else.
2. **Rich Results Test** (`search.google.com/test/rich-results`) on one product
   page. Expect exactly one `Product` and one `BreadcrumbList`. The Product should
   now carry `sku`, `hasMerchantReturnPolicy`, `shippingDetails` and
   `priceValidUntil` on every offer.
3. **Rich Results Test** on `/pages/installation-guide`. Expect `HowTo` with six
   steps, plus a `BreadcrumbList`.
4. **`/pages/wishlist`** — view source, confirm `<meta name="robots"
   content="noindex, follow">`. Then check a normal page such as `/pages/about-us`
   and confirm it is **absent** there.
5. **`/robots.txt`** — confirm the named crawler groups now carry `Disallow:`
   lines and that no `Sitemap:` line mentions `llm.txt`.

If a product page breaks, revert `templates/product.liquid` from the backup theme
made in step 0, or from the theme I built
(`iMosaicArt + SEO schema (preview, then publish)`), which has the correct
post-change version of every file.

---

## What is deliberately not included

No `aggregateRating` and no `review` markup. Every product page currently shows a
hardcoded `★★★★★ 4.9 · 38 reviews` that is a static string, not review data.
Marking that up risks a structured-data manual action, which removes rich results
sitewide. See `patches/00-READ-FIRST.md`.
