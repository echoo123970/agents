# SKU collisions — decision list

Measured 2026-10-31 against a full export of all 1,948 products (first
variant's SKU, which after the propagation pass represents the product).

**22 SKUs are shared by 45 products.** My earlier "21" was a miscount — it
dropped one row. The 22 split into two groups that need different decisions,
so they are listed separately.

Counters below come from the live data, not from `SKU_LOGIC.md`; the two
agree on every prefix, which is a useful cross-check.

| Category | Next free |
|---|---|
| Abstract | `MK027` |
| Animal | `MAA086` |
| Bird | `MB128` |
| Flower | `MF453` |
| Geometric | `MAG430` |
| Landscape | `MAS303` |
| Portrait | `MAP069` |
| Religious | `MAR108` |
| Roman | `MAM066` |

---

## Group A — 11 pairs from a same-day re-import. **Your call.**

On 2025-11-15 eleven products were created at 13:09–13:10, then created
again at 14:22–14:23. In every pair:

- the base title is identical, with `Premium` inserted in the later one
- the price is identical
- the productType is identical
- **both images were uploaded under the same base filename** — e.g. both are
  `MAS160.webp`, which is why Shopify appended different random suffixes

That last point is the strongest signal. Two uploads of a file named
`MAS160.webp` an hour apart is what a re-run of the same import looks like.

**I could not confirm it.** `cdn.shopify.com` is blocked from this
environment, so I have not compared the pixels. The evidence is
circumstantial but consistent across all eleven.

| SKU | 13:09 listing (keep) | 14:22 listing | Status |
|---|---|---|---|
| `MAG201` | Abstract Tessellation Grid Mosaic Art | …Grid **Premium** Mosaic Tile Art | both ACTIVE |
| `MAG202` | Byzantine Interlacing Circles Mosaic Art | …Circles **Premium** Mosaic Tile Art | both ACTIVE |
| `MAG253` | Op Art Cube Pattern Mosaic Art | …Pattern **Premium** Mosaic Tile Art | both ACTIVE |
| `MAG254` | Moroccan Star Medallion Mosaic Art | …Medallion **Premium** Mosaic Tile Art | both ACTIVE |
| `MAG255` | Roman Labyrinth Design Mosaic Art | …Design **Premium** Mosaic Tile Art | both ACTIVE |
| `MAG256` | Art Deco Fan Motif Mosaic Art | …Motif **Premium** Mosaic Tile Art | both ACTIVE |
| `MAS160` | Desert Oasis at Dawn Mosaic Art | …Dawn **Premium** Mosaic Tile Art | both ACTIVE |
| `MAS161` | Snowy Mountain Vista Mosaic Art | …Vista **Premium** Mosaic Tile Art | both ACTIVE |
| `MAS284` | Forest Stream in Autumn Mosaic Art | …Autumn **Premium** Mosaic Tile Art | both ACTIVE |
| `MAS285` | Mediterranean Seascape Mosaic Art | …Seascape **Premium** Mosaic Tile Art | both ACTIVE |
| `MAS286` | Tuscan Vineyard Sunset Mosaic Art | …Sunset **Premium** Mosaic Tile Art | 2nd is DRAFT |

**Option A1 — treat as duplicates.** Keep the 13:09 listing, set the 14:22
copy to DRAFT and add a 301 redirect to the survivor. Nothing is deleted, so
it is reversible. Removes 10 duplicate indexed pages.

**Option A2 — treat as distinct.** Give each 14:22 listing a fresh SKU
(`MAG430`–`MAG435`, `MAS303`–`MAS307`). Keeps both pages live.

I lean A1 on the filename evidence, but I will not act on a hunch about ten
live products. If you can glance at one pair in the admin — say `MAS160` —
that settles all eleven.

---

## Group B — 11 genuine collisions between different artworks

Here the two products are plainly different pieces. These need fresh SKUs
regardless of the Group A decision. Rule applied: the **older** listing keeps
the existing code.

### B1 — the product's own image filename names a different, free SKU

Two listings carry an image whose filename embeds a SKU that is not the one
on the record, and that SKU is unused. That is almost certainly the intended
code, so I propose adopting it rather than burning a counter.

| SKU | Listing | Image filename says | Proposed |
|---|---|---|---|
| `MAA010` | Horse Mosaic – Handmade Horse Mural (DRAFT, 2023-07-17) | `MA010_…jpg` | → **`MA010`** |
| `MAS123` | Sunrise Over the Ocean Mosaic (2025-05-18 16:29) | `MAS124_…webp` | → **`MAS124`** |

For `MAA010` I propose the DRAFT takes `MA010` and the ACTIVE listing keeps
`MAA010` — the live product shouldn't change code.

### B2 — filename names a different SKU, but it is already taken

| SKU | Listing | Filename says | That code | Proposed |
|---|---|---|---|---|
| `MAG002` | Mosaic Tile Medallion – Compass Mosaic (2023-07-31) | `MAG037_…` | in use | → **`MAG430`** |
| `MAG010` | Mosaic Medallion – Round Mosaic Art Design (2023-07-31) | `MAP010_…` | in use | → **`MAG431`** |

### B3 — no filename signal; fresh code from the counter

| SKU | Older listing (keeps SKU) | Newer listing | Proposed |
|---|---|---|---|
| `MAF152` | Rose Flower Mosaic Glass Tile Art (2024-01-02) | Fiery Elegance: Crafted Glass Mosaic Tile Art | → **`MF453`** |
| `MAG009` | Wall Art Glass Mosaic – Ocean Mosaic Scene (2023-06-28) | Geometric Mosaic – Flower Mosaic Artwork | → **`MAG432`** |
| `MAG165` | Floral Mosaic Art – Tile Flooring (2024-10-28) | Geometric Symphony Mosaic Tile Art | → **`MAG433`** |
| `MAK005` | Feathered Kaleidoscope (2024-06-30) | Colorful Floral Mosaic – Abstract Mosaic Art | → **`MK027`** |
| `MAR049` | Guadalupe Enthroned in Flowers (11:18) | Our Lady of Guadalupe Mosaic (16:33) | → **`MAR108`** |

### B4 — two more that look like duplicates, not collisions. **Your call.**

| SKU | Listings | Evidence |
|---|---|---|
| `MAB062` | "Watercolor Floral Art - **Lad**scape Mosaic" (2024-10-28) vs "…**Land**scape Mosaic" (2025-02-08) | identical 1407×601 dimensions, both files named `MAB062`; reads as a re-upload with the typo fixed |
| `MAM011` | "Medusa with Golden Curls" vs "Ethereal Woman with Golden Curls" (both 2025-05-18) | **identical base image filename** `image_ejkt9az-_1746280776418_512`; and the "Medusa" listing's handle still reads `…ethereal-woman-with-golden-curls…` |

`MAM011`'s third listing, "Roman Medallion Mosaic" (2024-11-15), is a
genuinely different piece and keeps `MAM011`.

If distinct: `MAB062` newer → **`MB128`**; the Portrait "Ethereal Woman" →
**`MAP069`**, the Roman "Medusa" → **`MAM066`**.
If duplicates: keep one of each pair, DRAFT + redirect the other.

---

## Side findings, not SKU problems

Noticed while reading these records. None are urgent; none are fixed.

- **An unlabelled AI image on a live product.** `MAG009`'s "Flower Mosaic
  Artwork" has the image `ChatGPT_Image_Aug_4_2026_01_17_45_PM.png`. Every
  other product's image is named after its SKU. Worth a look.
- **Three Nautical products carry Geometric (`MAG`) codes** — `MAG002`,
  `MAG009`, `MAG010` are all productType "Nautical Mosaics". Pre-existing,
  unrelated to the collision.
- **`MAB062` is productType "Bird Mosaics"** but neither title mentions a
  bird; both say floral/landscape.
- **A mangled handle.** `MAS123`'s "Sunrise Over the Ocean" has the handle
  `…a-new-daya-™s-promise` — mojibake from the curly apostrophe in "Day's".
  The title itself is clean.
