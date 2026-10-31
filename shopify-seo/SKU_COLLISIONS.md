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

## Group A — 11 pairs from a same-day re-import. **RESOLVED 2026-10-31.**

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

### Outcome

The owner compared `MAS160`'s two images in the admin and confirmed they are
the same artwork. Since all eleven pairs came from one import run, that
settles the set, and **Option A1 was applied**:

- the 13:09 listing keeps its SKU and stays ACTIVE
- the 14:22 copy was set to DRAFT (10 of them; `MAS286`'s was already a draft)
- a 301 redirect now points each 14:22 handle at its survivor

Nothing was deleted, so every step is reversible. Verified by re-reading all
22 products and listing the redirects: 11 survivors ACTIVE, 11 duplicates
DRAFT, 11 redirects each resolving to the correct survivor handle, zero
`userErrors`.

Catalogue counts after the change: 1,948 products total, 1,812 ACTIVE,
136 DRAFT (up from 126 — the 10 newly drafted duplicates).

| SKU | Survivor (ACTIVE) | Retired (DRAFT + 301) |
|---|---|---|
| `MAG201` | Abstract Tessellation Grid Mosaic Art | …Grid Premium Mosaic Tile Art |
| `MAG202` | Byzantine Interlacing Circles Mosaic Art | …Circles Premium Mosaic Tile Art |
| `MAG253` | Op Art Cube Pattern Mosaic Art | …Pattern Premium Mosaic Tile Art |
| `MAG254` | Moroccan Star Medallion Mosaic Art | …Medallion Premium Mosaic Tile Art |
| `MAG255` | Roman Labyrinth Design Mosaic Art | …Design Premium Mosaic Tile Art |
| `MAG256` | Art Deco Fan Motif Mosaic Art | …Motif Premium Mosaic Tile Art |
| `MAS160` | Desert Oasis at Dawn Mosaic Art | …Dawn Premium Mosaic Tile Art |
| `MAS161` | Snowy Mountain Vista Mosaic Art | …Vista Premium Mosaic Tile Art |
| `MAS284` | Forest Stream in Autumn Mosaic Art | …Autumn Premium Mosaic Tile Art |
| `MAS285` | Mediterranean Seascape Mosaic Art | …Seascape Premium Mosaic Tile Art |
| `MAS286` | Tuscan Vineyard Sunset Mosaic Art | …Sunset Premium Mosaic Tile Art |

### One thing a future scan will trip over

**The drafted duplicates still carry their survivor's SKU, deliberately.**
They are the same artwork, so sharing the code is correct, and the draft is
not sellable. But it means a naive "duplicate SKU" scan over all 1,948
products will flag these eleven again.

They are not a defect. A scan that wants only real collisions should filter
to `status:active`, which leaves zero shared SKUs across the eleven. Do not
re-raise these as outstanding work.

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

**Updated 2026-10-31.** The owner first ruled both pairs distinct and the
fresh SKUs were assigned. On a later look at the two images, `MAB062` and
`MB128` were confirmed to be **the same product**, so that half was reversed:
the 2024-10-28 listing survives (it carries five size variants against the
newer one's single size), the 2025-02-08 listing is drafted and parked on
`…-landscape-mosaic-retired-duplicate`, and the survivor took over the
correctly spelled handle with a 301 from the old typo'd path. See README §17.
The `MAM011` pair was not revisited and stands as distinct.

---

## Side findings, not SKU problems — all four now closed

Noticed while reading these records. All four were resolved on 2026-10-31;
see README §17. Two of the SKU references below were wrong when first
written and are corrected here.

- **An unlabelled AI image on a live product.** The image
  `ChatGPT_Image_Aug_4_2026_01_17_45_PM.png` belongs to **`MAG432`**, not
  `MAG009` as first recorded. Every other product's image is named after its
  SKU. **Resolved:** the owner confirmed there is real artwork behind the
  listing, so the file was renamed to `MAG432.png` in place — `FileUpdateInput`
  accepts `filename`, which preserves the `MediaImage` ID.
- **Three Nautical products carry Geometric (`MAG`) codes** — `MAG002`,
  `MAG009`, `MAG010` are all productType "Nautical Mosaics". Pre-existing,
  unrelated to the collision. **Resolved:** reassigned to `MAN119`, `MAN120`,
  `MAN121` after confirming none of the 93 orders on record touched them.
- **`MAB062` is productType "Bird Mosaics"** but neither title mentions a
  bird; both say floral/landscape. **Resolved, and it was not a defect:** the
  owner checked the image and confirmed there *is* a bird in it. "Bird
  Mosaics" was correct; the title is merely incomplete.
- **A mangled handle.** The mojibake handle `…a-new-daya-™s-promise` belongs
  to **`MAS124`**, not `MAS123` as first recorded — mojibake from the curly
  apostrophe in "Day's". The title itself was clean. **Resolved:** handle
  repaired and a 301 added from the old path (which Shopify had stored
  percent-encoded as `%e2%84%a2`).

---

## The generated-title set is a separate matter

The 2025-11-16 generated-title cleanup is **not** a SKU collision problem and
is not tracked here. Each of those 184 listings has its own unique SKU. See
README §16.2 and §18.
