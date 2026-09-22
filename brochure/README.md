# Bespoke Mosaic — Trade & Specification Portfolio

A 20-page PDF for B2B use (architects, interior designers,
developers, contractors). No brand name appears anywhere in the document —
it is written to sit under whatever letterhead, logo or cover sheet you add.

**Format:** 16:9 landscape, 338.7 × 190.5 mm — the standard widescreen slide
size, so it fills a laptop or projector with no letterboxing and still prints
cleanly on A4 landscape. Copy is deliberately short: a heading and at most
three points a page, with the photography carrying the argument.

    node build.mjs          # → dist/bespoke-mosaic-portfolio.pdf
    node build.mjs --png    # + page images in dist/preview/ for quick review
    node build.mjs --full   # embed photography at original resolution
    node build.mjs --clean  # dist/…-client.pdf — frames still waiting on a
                            # photograph fill with a quiet tessera field
                            # instead of printing their upload note
    node contact-sheet.mjs  # → dist/contact-sheet.png, every page at a glance
                            # (run after build.mjs --png)

## What is in it

| Page | Content |
|-----:|---------|
| 01 | Cover |
| 02 | The studio |
| 03 | The craft |
| 04 | What we make — hand-cut · Roman technique, polished · framed |
| 05 | Customisation — the statement page |
| 06 | Customisation — four ways in, and the matrix |
| 07 | Pools & water |
| 08 | Furniture — table tops & benches |
| 09 | From our workshop |
| 10 | The collections — twenty |
| 11 | The materials — 42 natural marbles |
| 12 | The materials — engineered stone & glass |
| 13 | Technical I — product data |
| 14 | Technical II — performance |
| 15 | Technical III — installation, site & care |
| 16 | Process |
| 17 | Trade & specification programme |
| 18 | Asked by specifiers |
| 19 | Beginning a commission |
| 20 | Back cover |

Page numbers in the footer are generated from document order, so inserting or
reordering a page never leaves a stale number behind.

## Adding photography

Drop files into `images/` named after the slot. The placeholder note disappears
automatically and the photograph fills the frame. `.jpg`, `.jpeg`, `.png`,
`.webp` and `.avif` all work.

| File name | What the page needs | Crop |
|---|---|---|
| `cover` | Pool floor at dusk — the full-bleed cover | portrait, ≥2000 px |
| `studio-hero` | The horse — the studio page, page 2 | portrait, ≥2000 px |
| `custom-artwork` | The client's reference image — the "before" | 4:3, ≥2000 px |
| `custom-result` | The same subject finished in mosaic — the "after" | 4:3, ≥2000 px |
| `layup` | Sample board / material lay-up for approval | 4:3, ≥2000 px |
| `wip-01`–`wip-05` | The five workshop frames on page 3 — work on the mesh, photographed at the bench | portrait, ≥2000 px |
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

Every colour comes from `src/tokens.css`. Replace the hex values there and all 20
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
| Pool floor at dusk, wave bands | `cover.jpg` ✓ placed |
| Peacock pool (from the villa film) | `installed-01.jpg` ✓ placed |
| Mosaic seat at dusk (from the outdoor film) | `installed-07.jpg` ✓ placed |
| Black glass step and coping detail | `installed-08.jpg` ✓ placed |
| The horse | `studio-hero.jpg` |
| Hand-cut, Roman-technique and framed examples | `make-standard.jpg`, `make-roman.jpg`, `make-framed.jpg` |
| White flowers / marble shower | `installed-04.jpg` and `collection-flower-mosaics.jpg` |
| Banana leaves, kitchen | `installed-05.jpg` and `collection-mosaic-tile-backsplash.jpg` |
| Tree behind the sofa | `installed-02.jpg` and `collection-tree-mosaics.jpg` |
| Round table top | `installed-09.jpg` and `collection-table-countertop-mosaics.jpg` |
| Klimt "The Kiss" | `collection-portrait-mosaics.jpg` |
| Tall ship | `collection-nautical-mosaics.jpg` |
| Wine pour, cellar | `collection-food-mosaics.jpg` |
| Hands setting the peacock | `collection-bird-mosaics.jpg` |

The same photograph can be uploaded twice under two names to fill two slots.

## Video

Two studio films were supplied. They are not embedded: a PDF can only carry
video through a RichMedia annotation, which plays in Adobe Acrobat and nowhere
else — not in Chrome's viewer, Preview, or any phone — and it would take the
file from under a megabyte to roughly seven. Stills were pulled from them
instead and used as photography. To extract more:

    ffmpeg -ss <seconds> -i <film.mp4> -frames:v 1 -q:v 2 images/<slot>.jpg

Playwright's bundled ffmpeg cannot decode H.264; `pip install imageio-ffmpeg`
provides a build that can.
