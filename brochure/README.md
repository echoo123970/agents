# Bespoke Mosaic — Trade & Specification Portfolio

An 18-page, print-ready A4 PDF for B2B use (architects, interior designers,
developers, contractors). No brand name appears anywhere in the document —
it is written to sit under whatever letterhead, logo or cover sheet you add.

    node build.mjs          # → dist/bespoke-mosaic-portfolio.pdf
    node build.mjs --png    # + page images in dist/preview/ for quick review
    node build.mjs --full   # embed photography at original resolution

## What is in it

| Page | Content |
|-----:|---------|
| 01 | Cover |
| 02 | The announcement — three new capabilities |
| 03 | The craft — stone, glass, setting |
| 04 | Customisation: the premise, and the six variables |
| 05 | Customisation matrix + what the client approves before production |
| 06 | Colour chart I — marble, natural stone & quartz (30 swatches) |
| 07 | Colour chart II — hand-poured glass & metal leaf (30 swatches) |
| 08 | Technical I — product data |
| 09 | Technical II — installation, site & care |
| 10 | Process — seven stages from brief to installation |
| 11 | Work in progress |
| 12 | Completed commissions |
| 13 | Installed on site (full bleed) |
| 14 | Applications by sector |
| 15 | Trade & specification programme |
| 16 | Asked by specifiers — eight questions |
| 17 | Beginning a commission |
| 18 | Back cover — enquiries |

Page numbers in the footer are generated from document order, so inserting or
reordering a page never leaves a stale number behind.

## Adding photography

Drop files into `images/` named after the slot. The placeholder note disappears
automatically and the photograph fills the frame. `.jpg`, `.jpeg`, `.png`,
`.webp` and `.avif` all work.

| File name | What the page needs | Crop |
|---|---|---|
| `cover` | Best finished mosaic, raking light on the gold | portrait / square, ≥3000 px |
| `craft-hands` | Hands cutting or setting at the bench | 3:4, ≥2400 px |
| `craft-macro` | Macro where marble meets glass and gold | 3:4, ≥2400 px |
| `custom-artwork` | The client's reference image — the "before" | 4:3, ≥2000 px |
| `custom-result` | The same subject finished in mosaic — the "after" | 4:3, ≥2000 px |
| `layup` | Sample board / material lay-up for approval | 4:3, ≥2000 px |
| `wip-01` | Design set out at full size before cutting | 4:3, ≥2000 px |
| `wip-02` | Cutting and nipping at the bench | 4:3, ≥2000 px |
| `wip-03` | Half-set panel showing bare mesh beside set tesserae | 4:3, ≥2000 px |
| `wip-04` | Panels numbered and crated | 4:3, ≥2000 px |
| `done-01` | Hero finished piece, square-on, evenly lit | 3:2, ≥3000 px |
| `done-02` | Macro detail of the same piece | 4:3, ≥2000 px |
| `done-03` | A second commission, contrasting palette | 4:3, ≥2000 px |
| `installed-hero` | The mosaic in its finished room | portrait, ≥3000 px |
| `app-01…04` | Hospitality / bathroom / pool / floor medallion | 1:1 |
| `closing` | Quiet closing shot — samples, hands, the studio | 3:4, ≥2400 px |

Photographs are re-encoded at 2000 px / JPEG 88 during the build so the PDF stays
small; `--full` keeps the originals.

## Changing the colours

Every colour in the document comes from `src/tokens.css`. Replace the hex values
there and all 16 pages update — no other file needs touching.

## Changing the colour charts

`src/charts.js` holds two arrays, `MARBLE` and `GLASS`, each row being
`["Name", "note under the name", "<CSS fill>"]`. Reorder, rename or extend them.
To use photographed samples instead of rendered fills, replace the third value
with `url(../images/swatch-name.jpg)`.

## Still to confirm

Figures rendered with a small ring (e.g. `2–3 weeks ◦`) are placeholders awaiting
confirmed studio data:

- standard sheet size (assumed 300 × 300 mm) and maximum single panel size
- joint width and panel outline tolerance
- adhesive and epoxy classes (assumed C2TE S1 / R2T)
- curing period before grouting and before filling pools
- site temperature range during fixing
- slip classification, freeze–thaw exposure, density / water absorption / fire class
- re-sealing interval
- lead times, sample dispatch, minimum order, warranty period
- the contact block on the back cover

Everything else is fixed: 5 mm stone and quartz, 4 mm glass, mesh backing as
standard, and the stated panel weights.

## How it is built

Static HTML + CSS in `src/`, rendered by headless Chromium through Playwright.
Text stays selectable and searchable in the PDF, which matters when a specifier
copies a line into a schedule. Fonts (Cormorant Garamond, Jost) are bundled
locally in `src/fonts/` so the build is reproducible offline.

## Fonts

Cormorant Garamond and Jost are bundled in `src/fonts/` and are licensed under
the SIL Open Font License 1.1, which permits embedding and redistribution.
