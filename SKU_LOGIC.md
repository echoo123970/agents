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
| Abstract  | `MK025`   |
| Animal    | `MAA084`  |
| Bird      | `MB127`   |
| Flower    | `MF419`   |
| Food      | `MAD042`  |
| Geometric | `MAG280`  |
| Landmark  | `MAL022`  |
| Landscape | `MAS303`  |
| Nautical  | `MAN117`  |
| Other     | `MAO039`  |
| Pattern   | `MAC010`  |
| Portrait  | `MAP067`  |
| Religious | `MAR103`  |
| Roman     | `MAM045`  |
| Tree      | `MAT076`  |

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
- **Watermark check (required before publishing).** Inspect every product image
  for watermarks, logos, supplier stamps, or overlaid text (e.g. maker marks
  such as "SAIC", Chinese/other characters, URLs, signatures) **before** the
  product goes live. If any watermark is present, **do not publish** with that
  image — flag it to the user and request a clean, watermark-free version, then
  swap it in. Only watermark-free images may be published.

## Size variants

- **5 sizes per product.** The user gives the **first** size in cm; the other 4
  are **derived from the first** by scaling **both** dimensions by a fixed ratio:

  | Size | Multiplier | Example (base 60×70) |
  |------|-----------|----------------------|
  | 1    | ×1 (base) | 60 × 70 cm           |
  | 2    | ×1.3      | 78 × 91 cm           |
  | 3    | ×1.5      | 90 × 105 cm          |
  | 4    | ×1.8      | 108 × 126 cm         |
  | 5    | ×2        | 120 × 140 cm         |

  Scaled cm dimensions are rounded to the nearest whole cm. Each size then gets
  its own inch conversion, price, and weight (grams).
- Sizes are given in **cm**; convert to **inches** (`inches = cm / 2.54`, rounded
  to the nearest whole inch).
- Variant value format: `{W}cm x {H}cm ({W_in}" x {H_in}")`
  - Example: 60cm × 70cm → `60cm x 70cm (24" x 28")`.

## Variant price

Computed **per variant** from the size's dimensions:

1. `sqm  = (width_cm * height_cm) / 10000`
2. `sqft = sqm * 11`
3. `price = (sqft * 70) + 120 + 300`  *(i.e. sqft × $70, plus $120, plus $300)*
4. **Always round UP** (ceiling) to the next whole dollar.

Single expression:

```
price = ceil( (width_cm * height_cm * 0.077) + 420 )
```

Example — 60×60 cm: (3600 × 0.077) + 420 = 697.20 → **698**.

## Variant weight (grams)

- Set each variant's **Grams** using the size's dimensions:

  ```
  grams = (width_cm * height_cm / 10000) * 18000
  ```

- Computed **per variant** (each `Size` has its own width × height, so each
  variant gets its own weight in grams).
- **Variant Weight Unit:** `g` (grams). If Shopify requires the weight in `kg`,
  convert (grams ÷ 1000).

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
- **Status:** `active`
- **Option1 Name:** `Size`
- **Gift Card:** `FALSE`
- **Included / United States:** `TRUE`
- **Included / International:** `TRUE`

## Metafields (storefront filters)

> These filter attributes are stored as **metafields** (`product.metafields.custom.*`),
> **not as tags**. They power the storefront filtering (Application, Dominant
> Color, Landmark Place, Shape, Space, Style, Theme, etc.). Product **Tags** are
> separate (SEO keywords) and are not used for these filters.

- **Style Filter** — `product.metafields.custom.style_filter`:
  - `Handcrafted Marble Art` → marble-material products
  - `Tiled Glass Artistry` → glass-material products

  **Material is detected from the product image.** If the product is **glass**,
  also add it to the **Glass Mosaic Art** collection (in addition to setting the
  style_filter metafield).

- **Shape Filter** — `product.metafields.custom.shape_filter`, one of:
  - `Square` → width = height
  - `Rectangular Tall` → height > width (portrait)
  - `Rectangular Wide` → width > height (landscape)
  - `Round` → circular piece (detected from the image)

- **Dominant Color Filter** — `product.metafields.custom.dominant_color`,
  detected from the image's dominant color, one of:
  - `Earth Tones` — natural, muted, grounded. Examples: browns (chocolate, tan),
    beiges, grays, ochres, terracotta.
  - `Cool Colors` — calming, refreshing, serene. Examples: blues (navy, sky
    blue), greens (emerald, mint), purples (lavender, violet).
  - `Warm Colors` — energetic, inviting, vibrant. Examples: reds, oranges,
    yellows, and variations like coral, amber, gold.

- **Application Filter** — `product.metafields.custom.application_filter`
  (list). **All applications apply to every product:**
  `Ceiling Art`, `Floor Art`, `Indoor Art`, `Outdoor Art`, `Pool Art`,
  `Tabletop Art`, `Wall Art`.
  - **Exception:** **Religious** products exclude `Floor Art` (cannot be
    installed on the floor) → they get the other 6.

- **Space Filter** — `product.metafields.custom.space_filter` (list of rooms).
  **Default: all rooms** apply to every product: Attic, Basement, Bathroom,
  Bedroom, Dining Room, Entryway, Foyer, Garden, Hallway, Kitchen, Laundry Room,
  Living Room, Office, Office Hallway.
- **Landmark Place Filter** — `product.metafields.custom.landmark_place_filter`.
  Applies to **Landmark** products only. Value = the region where the landmark
  is located (detected from the image/subject): `Europe`, `Middle East`,
  `North America` (and other regions as they arise).

- **Theme Filter** — `product.metafields.custom.theme_filter`. Applies to
  **Animal**, **Bird**, and **Geometric** products. Value = the specific subject
  depicted (detected from the image):
  - Animal themes: e.g. `Lion`, `Tiger`, `Dog`, `Cat`, `Horse`, `Rabbit`,
    `Dragon`, `Deer`, `Fox`, `Cheeta`, `Zebra`.
  - Bird themes: e.g. `Bird`, `Butterfly`, `Cardinal`, `Peacock`, `Eagle`,
    `Heron`, `Rooster`, `Hummingbird`, `Pigeon`, `Penguin`, `Swans`, `Flamingo`,
    `Parrot`, `Owl`, `Doves`.
  - Geometric themes: e.g. `Compass Art`, `Medallion Art`, `Floral Art`,
    `Symmetric Art`, `Rug Art`.
  - Nautical themes: e.g. `Underwater Scene`, `Anchor`, `Mermaid`, `Wave`,
    `Octopus`, `Fish`, `Sea Turtle`, `Koi Fish`, `Boat`, `Seashell`, `Seahorse`,
    `Starfish`, `Sunset`, `Coo`, `Sea View`, `Scenery View`, `Dolphin`.
  - Other themes: e.g. `Celestial`, `US Flag`, `Logo`, `Musical Instruments`.
  - Portrait themes: e.g. `Monaliza`, `Marilyn Monroe`, `Mermaid`, `Van Gogh`,
    `Banksy`, `Johannes Vermeer`, `Gustav Klimt`, `Giuseppe Arcimboldo`.
  - Roman themes: e.g. `Cave Canem`, `Versace`, `Creation Of Adam`,
    `Birth Of Venus`.
  - (and others as they arise.)

## Google Shopping

- **Google Product Category:** `6829`.

## Type

- Set `Type` to the **primary/main subject** category name exactly as it appears
  in Shopify (e.g. `Geometric Mosaics`). The primary category is inferred from
  the image. The product is still added to all matching collections regardless.

## Handle

- Format: `{category}_{title}`
- **`{category}` = the exact Shopify collection TITLE of the primary category,
  lowercased with words joined by `-`** (always includes "mosaics"):
  - Food Mosaics → `food-mosaics`
  - Abstract Mosaics → `abstract-mosaics`
  - Geometric Mosaics → `geometric-mosaics`
- All lowercase.
- Words **within** the category and **within** the title are joined with `-`.
- A single `_` separates the category block from the title block.
- Nothing is auto-appended (`mosaic-tile-art` appears only if it is actually
  part of the product title).
- Example: "Pouring Red Wine Mosaic Art" in Food →
  `food-mosaics_pouring-red-wine-mosaic-art`.

## Title & Body (generated)

For every product, generate (do not expect the user to supply):

- **Title** — keyword-rich, natural, optimized for SEO and LLM discovery around
  handmade mosaic art.
- **Body / description (HTML)** — structured for search and LLMs: compelling
  opening, features/benefits, materials & craftsmanship (handmade tile/glass),
  use cases (wall art, backsplash, tabletop), with keywords and long-tail terms
  woven in naturally.
- **SEO Title** — format: `{Product Title} | {Collection name} | iMosaicArt`
  (Collection name = the primary/main category collection).
- **SEO Description** — same as the product **Body / description**.
- **Tags** — relevant keyword tags.

Always incorporate relevant **handmade mosaic art** keywords.
