# Patch 1 — Product schema upgrade (`templates/product.liquid`)

Your Product JSON-LD already exists and is valid. It is missing the fields that
Google now requires for merchant listings, and that AI shopping agents read when
deciding whether to recommend a product.

## What this adds

| Field | Why it matters |
|---|---|
| `sku` fallback to variant ID | Google needs `sku`, `gtin` or `mpn` per offer. ~5,800 of your variants have no SKU, so most offers currently carry **no identifier at all** and are ineligible for merchant listings. |
| `hasMerchantReturnPolicy` | A required merchant-listing field. Absent = reduced eligibility. |
| `shippingDetails` | Same. Also the single strongest "free worldwide shipping" signal for AI shopping agents. |
| `priceValidUntil` | Removes the "missing field priceValidUntil" warning in Search Console. |
| `brand` → `@id` reference | Links each product to the sitewide Organization entity instead of a loose string. This is what makes an LLM treat 1,819 products as *one* studio's catalogue. |
| `material`, `size`, `category` | Directly answers "what is it made of / what sizes" — the questions AI shopping agents ask. |
| `@id` on the Product | Makes the product node addressable in the entity graph. |

## What this deliberately does NOT add

**No `aggregateRating` and no `review`.** See `patches/00-READ-FIRST.md`. Marking up
the hardcoded "4.9 · 38 reviews" currently shown on every product page would be
marking up data that is not real. That converts a trust problem into a Google
manual action. Add real review data first (you already have Klaviyo Reviews
installed), then mark it up.

## Before you paste: two values to confirm

1. `merchantReturnDays: 14` — your theme says 14-day returns in five places.
   Confirm `/pages/refund-policy` says the same.
2. `handlingTime: 28–35 days` + `transitTime: 7–14 days` — this matches what your
   theme says everywhere (4–5 weeks production, ~10 days transit). **Your shipping
   policy page says 77–90 days.** Those cannot both be true. Fix the policy page
   before publishing this, or the schema will contradict your own stated terms.

---

## The change

In `templates/product.liquid`, replace **the first JSON-LD block only** (lines 1–41,
ending at the `</script>` before the `{%- comment -%} Breadcrumb structured data`
line). Leave the BreadcrumbList block below it untouched.

```liquid
{%- comment -%} Product structured data — rich results, merchant listings and AI shopping agents. {%- endcomment -%}
{%- assign pdp_desc = product.description | strip_html | strip_newlines | truncatewords: 60 -%}
{%- if pdp_desc == blank -%}{%- assign pdp_desc = product.title | append: ' — handcrafted marble and glass mosaic art by iMosaicArt, made to order.' -%}{%- endif -%}
{%- assign price_valid_until = 'now' | date: '%s' | plus: 7776000 | date: '%Y-%m-%d' -%}
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "@id": "https://www.imosaicart.com{{ product.url }}#product",
  "name": {{ product.title | json }},
  "description": {{ pdp_desc | json }},
  "url": "https://www.imosaicart.com{{ product.url }}",
  "brand": { "@id": "https://www.imosaicart.com/#organization" },
  "manufacturer": { "@id": "https://www.imosaicart.com/#organization" },
  "material": "Hand-cut natural marble, stone and vitreous glass tesserae on fibre-mesh backing",
  {%- if product.type != blank -%}
  "category": {{ product.type | json }},
  {%- endif -%}
  "image": [
    {%- for image in product.images limit: 6 -%}
      {%- assign img_src = image | image_url: width: 1200 -%}
      {%- unless img_src contains 'http' -%}{%- assign img_src = 'https:' | append: img_src -%}{%- endunless -%}
      {{ img_src | json }}{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor -%}
  ],
  "sku": {{ product.selected_or_first_available_variant.sku | default: product.selected_or_first_available_variant.id | json }},
  "offers": [
    {%- for variant in product.variants -%}
    {
      "@type": "Offer",
      "sku": {{ variant.sku | default: variant.id | json }},
      {%- if variant.title != blank and variant.title != 'Default Title' -%}
      "name": {{ variant.title | json }},
      {%- endif -%}
      "price": "{{ variant.price | divided_by: 100.0 }}",
      "priceCurrency": {{ shop.currency | json }},
      "priceValidUntil": "{{ price_valid_until }}",
      "availability": "https://schema.org/{% if variant.available %}InStock{% else %}OutOfStock{% endif %}",
      "itemCondition": "https://schema.org/NewCondition",
      "url": "https://www.imosaicart.com{{ product.url }}?variant={{ variant.id }}",
      "seller": { "@id": "https://www.imosaicart.com/#organization" },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "US",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": 14,
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": {{ shop.currency | json }}
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "US"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 28,
            "maxValue": 35,
            "unitCode": "DAY"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 7,
            "maxValue": 14,
            "unitCode": "DAY"
          }
        }
      }
    }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor -%}
  ]
}
</script>
```

## Note on `shippingDestination`

Schema.org requires a country per shipping destination, so the block above declares
`US`. You ship worldwide free. To say that properly, repeat the `shippingDetails`
object once per major market (`US`, `CA`, `GB`, `AU`, `DE`, `FR`) — or leave it as
`US` and let the free-shipping copy on the page carry the rest. `US` only is the
safe, valid minimum; declaring `"addressCountry": "001"` (UN "world") is accepted by
schema.org but **not** by Google Merchant Center.
