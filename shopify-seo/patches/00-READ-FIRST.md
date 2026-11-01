# Read first — why no review schema is included

You asked for Product, FAQPage, Organization, BreadcrumbList and HowTo schema.
Four of those five already existed in your theme. I added the missing one and
filled the gaps. What I did **not** add is `aggregateRating` or `review` markup,
and you should know why before you ask anyone else to add it.

## Finding 1 — every product page shows the same hardcoded rating

`templates/product.liquid`, line ~192:

```liquid
<span class="pdp__stars">★★★★★</span>
<span class="pdp__rating-text">Handcrafted Reproduction · <strong class="pdp__rating-score">4.9</strong> · <a href="/pages/all-reviews" class="pdp__rating-link">38 reviews</a></span>
```

These are static strings, not data. **All 1,819 published products display
"4.9 · 38 reviews" and five filled stars**, regardless of whether that product has
ever been reviewed.

## Finding 2 — the homepage testimonials are generated faces

`config/settings_data.json`, `testimonials` section:

```json
"default_names":   "Sarah Whitfield|Marcus Delaney|Elena Rossi|David Bennett|Priya Anand|James Mitchell",
"default_places":  "Austin, TX|Chicago, IL|Toronto, Canada|London, UK|Sydney, Australia|Boston, MA",
"default_avatars": "https://randomuser.me/api/portraits/women/65.jpg|https://randomuser.me/api/portraits/men/32.jpg|..."
```

`randomuser.me` is a test-data API. Those are placeholder portraits attached to
names, cities and quotes presented as real customer testimonials.

## Why this blocks the schema work

1. **Marking it up makes it worse.** Rating and review markup is the single most
   aggressively policed structured-data type Google has. Marking up a rating that
   isn't derived from real reviews is grounds for a structured-data manual action,
   which removes rich results sitewide — not just on products.
2. **It is a live legal exposure in the US.** The FTC rule on fake reviews and
   testimonials (16 CFR Part 465, in force since October 2024) covers fabricated
   consumer reviews and testimonials, with civil penalties per violation. A
   studio-signed quote attached to a stock portrait is squarely within it.
3. **It is already costing you AEO credibility.** An identical rating on every
   product is a pattern detectors notice. Uniform review counts across a whole
   catalogue is a known low-trust signal.

## What to do instead

You already have **Klaviyo Reviews** installed, and `/pages/all-reviews` renders
`pg-reviews.liquid`. So the path is short:

1. Remove the hardcoded stars/score/count from `templates/product.liquid` — or bind
   them to Klaviyo's real per-product metafields.
2. Replace the `randomuser.me` testimonials with real ones, or remove the section.
3. Once real review data is flowing, add `aggregateRating` **conditionally** — only
   on products that actually have reviews:

```liquid
{%- if product.metafields.reviews.rating_count.value > 0 -%}
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "{{ product.metafields.reviews.rating.value.rating }}",
  "reviewCount": {{ product.metafields.reviews.rating_count.value }},
  "bestRating": "5",
  "worstRating": "1"
},
{%- endif -%}
```

That guard is the whole point: no reviews, no markup. Then the rating is an asset
instead of a liability — real ratings are one of the highest-leverage things you can
give an AI shopping agent.

This is yours to decide; I've flagged it and left the display untouched.
