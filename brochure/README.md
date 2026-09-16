# Bespoke Mosaic — Trade & Specification Portfolio

A 22-page, print-ready A4 PDF for B2B use (architects, interior designers,
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
| 09 | Technical II — performance: marble & quartz |
| 10 | Technical III — performance: hand-poured glass |
| 11 | Technical IV — installation & site |
| 12 | Technical V — care & maintenance |
| 13 | Process — seven stages from brief to installation |
| 14 | Work in progress |
| 15 | Completed commissions |
| 16 | Installed on site (full bleed) |
| 17 | Applications by sector |
| 18 | Trade & specification programme |
| 19 | Asked by specifiers — eight questions |
| 20 | Beginning a commission |
| 21 | Back cover — enquiries |

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
| `collection-<handle>` | One image per collection on the collections page — `collection-flower-mosaics`, `collection-portrait-mosaics`, `collection-geometric-mosaics`, `collection-nautical-mosaics`, and so on for the other sixteen | 4:3 |
| `closing` | Quiet closing shot — samples, hands, the studio | 3:4, ≥2400 px |

Photographs are re-encoded at 2000 px / JPEG 88 during the build so the PDF stays
small; `--full` keeps the originals.

## Changing the colours

Every colour comes from `src/tokens.css`. Replace the hex values there and all 22
pages update — no other file needs touching.

Current brand palette:

| Token | Hex | Role |
|---|---|---|
| `--light` | `#F4F6FA` | porcelain — light pages |
| `--dark` | `#16335E` | navy — dark pages |
| `--accent` | `#2B7BE8` | blue — rules, figures, eyebrows |
| `--deep` | `#0D2146` | deepest navy — full-bleed overlays |
| `--accent-light` | `#7FB2F0` | accent on dark grounds |
| `--accent-deep` | `#1B5CB8` | accent on light grounds |

The last three are derived from the brand blues. `#2B7BE8` on `#16335E` is about
3:1, so small accent text on dark pages steps up to `--accent-light` — see the
"accent on dark grounds" block at the end of `src/styles.css`.

The colour charts are deliberately **not** re-skinned: those swatches are
material colours (real marble, real glass), not brand colours.

## Changing the colour charts

`src/charts.js` holds three arrays — `MARBLE` (42 natural stones), `ENGINEERED`
(6) and `GLASS` (30) — each row being `["Name", "reference", "#base"]`. Swatches
are drawn as fields of hand-cut tesserae with deterministic tonal variation, so
a rebuild always produces the same swatch. Reorder, rename or extend the arrays;
`tesserae()` does the rest.

The stone names were transcribed from the studio's palette page and should be
checked against it — `Verde Suez` (41) and `Perlatto Royal` (14) in particular.

The glass range is indicative and still needs the studio's current pour list.

## Confirmed data

Materials, dimensions and performance come from the studio's own specification
sheets:

- marble and natural stone 5 mm, hand-poured glass 4 mm, engineered quartz 8 mm
- fibreglass netted mesh backing on every sheet and panel
- sheet size 300 × 300 mm, joint approximately 1 mm
- weight approximately 10 kg/m² in glass and 13–15 kg/m² in 5 mm stone
- marble: absorption ≤ 0.7% (ASTM C373), flexural ≥ 15 MPa (ASTM C880/C1161),
  compressive ≥ 90 MPa (ASTM C170), Mohs 3–6, thermal expansion 8–12 × 10⁻⁶/°C
  (ASTM C531), chemical resistance (ASTM C650), slip R10 polished / R11 honed
  (DIN 51130), frost resistance (ASTM C1026)
- glass: zero absorption (UNI EN ISO 10545-3 / ASTM C373), chemical resistance
  (10545-13), thermal shock (10545-9 / ASTM C484), frost resistance, colour
  fastness (10545-12 / DIN 51094), bond strength (ASTM C482), crazing (ASTM C424)
- quartz: Mohs 7, absorption ~0.02% by volume, dense and non-porous
- installation: epoxy adhesive and grout in wet/outdoor/submerged work, mandatory
  movement joints with silicone at changes of plane, DCOF ≥ 0.42 interior wet and
  ≥ 0.60 exterior, sealing required on marble
- care: pH-neutral cleaners, annual enhancer/sealer, no acids, abrasives, bleach
  or ammonia
- commercial: free worldwide shipping, lifetime warranty

## Still to confirm

Figures rendered with a small ring (e.g. `14–28 days ◦`) are still open:

- maximum single panel size
- panel outline tolerance (assumed ±1 mm)
- curing time before grouting and before filling pools (assumed 14–28 days)
- whether brushed and tumbled finishes are offered alongside polished and honed
- lead times — design approval, standard production, sample dispatch
- minimum order
- the contact block on the back cover

## How it is built

Static HTML + CSS in `src/`, rendered by headless Chromium through Playwright.
Text stays selectable and searchable in the PDF, which matters when a specifier
copies a line into a schedule. Fonts (Cormorant Garamond, Jost) are bundled
locally in `src/fonts/` so the build is reproducible offline.

## Fonts

Cormorant Garamond and Jost are bundled in `src/fonts/` and are licensed under
the SIL Open Font License 1.1, which permits embedding and redistribution.

## Getting photography into the build

The build reads `images/`, so the files have to reach the repository. The
quickest route, with no local checkout:

1. Open the folder on the working branch:
   `https://github.com/echoo123970/agents/tree/claude/optimistic-mccarthy-gkgahp/brochure/images`
2. **Add file → Upload files**, drag the photographs in, named for their slot
   (`cover.jpg`, `wip-02.jpg`, `installed-hero.jpg` …).
3. Commit **to `claude/optimistic-mccarthy-gkgahp`**, not to a new branch.

Then `git pull` and `node build.mjs` — every uploaded slot fills itself and its
placeholder note disappears.

## Image assignments agreed with the studio

| The photograph | File name |
|---|---|
| Pool floor at dusk, wave bands, fire bowls | `cover.jpg` — and `collection-geometric-mosaics.jpg` |
| The horse, figurative glass and stone | `craft-macro.jpg` |
| White flowers in the marble shower enclosure | `collection-flower-mosaics.jpg` — also suits `installed-hero.jpg` |
| Klimt "The Kiss" in gold, framed between sconces | `collection-portrait-mosaics.jpg` |
| Tall ship in marble | `collection-nautical-mosaics.jpg` |
| Tree canopy behind the sofa | `collection-tree-mosaics.jpg` — also suits `app-01.jpg` |
| Banana leaves behind the range | `collection-mosaic-tile-backsplash.jpg` — also suits `app-02.jpg` |
| Hands setting the peacock's tesserae | `collection-bird-mosaics.jpg` — also suits `craft-hands.jpg` and `wip-02.jpg` |
| Wine pouring, in the cellar | `collection-food-mosaics.jpg` |
| Round table top, blue and rose | `collection-table-countertop-mosaics.jpg` — also suits `app-04.jpg` |

The same photograph can be uploaded twice under two names to fill two slots.
