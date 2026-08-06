# iMosaicArt — Shopify theme

An Online Store 2.0 theme translated from the iMosaicArt homepage design
(built in Claude Design) into editable Liquid sections.

## Design system

- **Fonts:** Cormorant Garamond (display), Hanken Grotesk (body), Marcellus (accent)
- **Colors:** navy `#16335E`, accent blue `#2B7BE8`, background `#F4F6FA`
- All tokens are exposed in **Theme settings → Colors / Layout** and as CSS variables in `layout/theme.liquid`.

## Homepage sections (`templates/index.json`)

| Order | Section | Notes |
|------|---------|-------|
| 1 | Hero | Split layout, stat blocks, magnifier-lens image (set image in editor) |
| 2 | Trust bar | 4 editable items |
| 3 | Quote banner | Weatherproof statement |
| 4 | Category grid | "Shop by Subject" — each block picks a **collection** |
| 5 | Marquee | Scrolling words |
| 6 | Collection showcase | "Signature Collections" — collection-picker blocks |
| 7 | Featured products | "Bestsellers" — bound to a **collection** |
| 8 | Custom process | Dark "Custom Mosaics" steps + image |
| 9 | Promises | 5 columns |
| 10 | Testimonials | 6 reviews |
| 11 | Blog posts | "Journal" — bound to a **blog** |
| 12 | Instagram grid | 8 image blocks |
| 13 | Newsletter | Wired to Shopify customer signup |

Image-heavy sections use `image_picker` settings — upload images (or set a
collection/blog) in the Theme Editor. Product, collection, and article images
come straight from your store data.

## Inner templates

`product`, `collection`, `list-collections`, `blog`, `article`, `page`,
`cart`, `search`, and `404` are all included so the store works end to end.

## Preview & deploy

This theme lives in `theme/`. From your own machine (Shopify login required):

```bash
cd theme
shopify theme dev   --store aml89.myshopify.com   # local live-reload preview
shopify theme push  --store aml89.myshopify.com   # upload (pushes as a new/unpublished theme by default)
```

Run `shopify theme check` to lint before pushing.
