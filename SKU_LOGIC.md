# Shopify Product Creation — SKU Logic & Standing Rules

Reference for adding products to the iMosaicArt Shopify store. These rules are
applied to **every** product unless the user overrides them for a specific item.

## SKU logic

- **Field:** the SKU is the **Variant SKU** (Shopify's variant-level SKU field).
- **Same SKU on all size variants.** A product has multiple `Size` variants; the
  **same** category SKU is applied to **every** size variant of that product.
- **Per-category running counter.** Each category has its own SKU series with a
  fixed prefix and a number.
- **Counter increments per product, not per variant.** The first new product
  filed in a category gets exactly the starting SKU below; each subsequent
  **product** in that category gets the previous number **+1** (multiple size
  variants of the same product do **not** each consume a number).
- **Primary category sets the SKU.** A product may belong to multiple
  collections, but its SKU comes from the **primary/main category** (the same
  one used for `Type`), determined from the product image.
- **Verify before assigning.** Before using a SKU, confirm it is not already in
  use in the store (query variants by SKU). If taken, skip to the next free
  number and note it.

### Starting SKUs (next to assign)

| Category  | Next SKU  |
|-----------|-----------|
| Abstract  | `MK019`   |
| Animal    | `MAA075`  |
| Bird      | `MB111`   |
| Flower    | `MF355`   |
| Food      | `MAD035`  |
| Geometric | `MAG257`  |
| Landmark  | `MAL022`  |
| Landscape | `MAS291`  |
| Nautical  | `MAN110`  |
| Other     | `MAO031`  |
| Pattern   | `MAC009`  |
| Portrait  | `MAP064`  |
| Religious | `MAR085`  |
| Roman     | `MAM036`  |
| Tree      | `MAT062`  |

> Update the "Next SKU" value for a category after each product is created so
> the counter stays accurate across sessions.

## Variant inventory

- **Variant Inventory Tracker:** `shopify` — inventory is tracked by Shopify
  (set the variant's inventory item to tracked / inventory management = Shopify).
- **Variant Inventory Qty:** `999` (per variant).
- **Variant Inventory Policy:** `continue` (keep selling when out of stock).
- **Variant Fulfillment Service:** `manual`.
- **Variant Requires Shipping:** `TRUE`.
- **Variant Taxable:** `TRUE`.

## Images

- **Image Src:** upload the provided product image to Shopify **Files** first,
  get the resulting **CDN URL** (`https://cdn.shopify.com/...`), and use that CDN
  link as the product's image source. Do not use local paths or external hosts.
- **Image Position:** `1`.
- **Image Alt Text:** same as the product **Title**.

## Variant weight (grams)

- Set each variant's **Grams** using the size's dimensions:

  ```
  grams = (width_cm * height_cm / 10000) * 18000
  ```

- Computed **per variant** (each `Size` has its own width × height, so each
  variant gets its own weight in grams).

## Category logic (image → collection)

Analyze the product image and assign **all** matching subject categories.

| Category  | Collection (exact Shopify name) | Logic (what belongs here)              |
|-----------|----------------------------------|----------------------------------------|
| ABSTRACT  | Abstract Mosaics                 | Something abstract / not clearly defined |
| ANIMAL    | Animal Mosaics                   | All kinds of animals                   |
| BIRD      | Bird Mosaics                     | All bird species                       |
| FLOWER    | Flower Mosaics                   | Flowers                                |
| FOOD      | Food Mosaics                     | Everything food **and drink**          |
| GEOMETRIC | Geometric Mosaics                | Geometric shapes / designs             |
| LANDMARK  | Landmark Mosaics                 | Important landmarks worldwide          |
| LANDSCAPE | Landscape Mosaics                | Scenery                                |
| NAUTICAL  | Nautical Mosaics                 | Marine life                            |
| PATTERN   | Pattern Mosaics                  | Repetition in the design               |
| PORTRAIT  | Portrait Mosaics                 | Anything with faces                    |
| RELIGIOUS | Religious Mosaics                | All religious kinds / themes           |
| ROMAN     | Roman Mosaics                    | Roman-themed designs                   |
| TREE      | Tree Mosaics                     | Designs with trees                     |
| OTHER     | Other Mosaics                    | Catch-all — fits no other collection   |

### Assignment rules

1. **Multi-category.** Assign to every matching subject collection (e.g. a
   geometric design that contains flowers → both Geometric and Flower).
2. **Religious overrides Portrait.** A religious piece goes in Religious only —
   never Portrait — even if it has a face.
3. **Other is last resort.** Use only when nothing else matches.
4. **Material/use collections** — add when the image/details warrant:
   Glass Mosaic Art, Mosaic Backsplash, Table Top Mosaics, Van Gogh Mosaics.
5. **Smart collections** (All Mosaics, Smart Mosaic Collection) are rule-based —
   no manual adds.
6. **Merchandising** (Featured, New Arrivals, Best Sellers, Limited Edition,
   Studio Specials) — only when the user asks.

## Fixed product fields

- **Vendor:** `iMosaicArt` (always)
- **Product Category (taxonomy):**
  `Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Craft Kits > Mosaic Kits` (always)
- **Published:** `TRUE` (product goes live / ACTIVE)
- **Option1 Name:** `Size`

## Type

- Set `Type` to the **primary/main subject** category name exactly as it appears
  in Shopify (e.g. `Geometric Mosaics`). The primary category is inferred from
  the image. The product is still added to all matching collections regardless.

## Handle

- Format: `{category}_{title}`
- All lowercase.
- Words **within** the category and **within** the title are joined with `-`.
- A single `_` separates the category block from the title block.
- Nothing is auto-appended (`mosaic-tile-art` appears only if it is actually
  part of the product title).
- Example: title "Symphony Mosaic Tile Art" in Geometric →
  `geometric_symphony-mosaic-tile-art`.

## Title & Body (generated)

For every product, generate (do not expect the user to supply):

- **Title** — keyword-rich, natural, optimized for SEO and LLM discovery around
  handmade mosaic art.
- **Body / description (HTML)** — structured for search and LLMs: compelling
  opening, features/benefits, materials & craftsmanship (handmade tile/glass),
  use cases (wall art, backsplash, tabletop), with keywords and long-tail terms
  woven in naturally.
- **SEO meta title & meta description** — optimized for the search snippet.
- **Tags** — relevant keyword tags.

Always incorporate relevant **handmade mosaic art** keywords.
