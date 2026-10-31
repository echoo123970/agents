# agents

Custom [Claude Code](https://code.claude.com/docs) subagents for this workspace.

## Available agents

### `shopify-product-creator`

Creates new products in the connected Shopify store. It collects the product
details (title, description, price, variants, images, collection), validates
them against the Shopify Admin API's requirements, and creates the product —
defaulting to **DRAFT** status so nothing goes live by accident.

**Requires:** the Shopify MCP server to be connected (it uses the
`mcp__Shopify__*` tools).

**Use it by asking the main assistant things like:**

- "Add a new product: a navy cotton t-shirt, $29.99, sizes S/M/L"
- "Create a product for my new ceramic mug, $18, with a short description"
- "List a new item in my store and put it in the Summer collection"

The agent definition lives in
[`.claude/agents/shopify-product-creator.md`](.claude/agents/shopify-product-creator.md).

## Tools

### iMosaicArt Mosaic Designer — `tools/mosaic-designer/index.html`

A single-page tool for designing marble and glass inlays. Open the file in a
browser (no build step, no server).

1. **Sketch** — draw the design in black lines (pen, line, rectangle, ellipse,
   eraser), upload a drawing and convert it to black and white (adjustable ink
   threshold), or load the sample medallion.
   - **Describe a design**: type a description and Claude draws clean,
     cuttable line art. Tick *Change the current sketch* to revise it.
   - **Redraw upload as clean lines**: turns a photo or colored design into
     line art.
   - Both AI features work when the page is opened as a Claude artifact; the
     plain HTML file hides them.
2. **Color** — customers color with plain colors from the chart, or use *Pick any
   color* and the tool picks the closest stone in the chart. Uploading a colored
   picture is turned into a black & white outline first (lines where its colors
   meet; *Detail* sets how many areas), which the customer then colors. *Outline
   and color it with our stones* does both in one go. Areas show the stone images by default;
   *Show colors as* can switch to plain colors.
3. **Mosaic** — turns the design into hand-cut tiles with grout between them.
   With an uploaded picture, every tile takes the chart stone closest to the
   picture under it (with error diffusion so skin tones and skies blend), which
   gives a realistic portrait-style mosaic; or tile the colored areas instead.
   Choose the tile size (¼ in to 1 in) and grout color.

The **Materials used** table lists each material with piece count, tile count, share and
area (ft² or m², from the finished width), plus a 15% overage line. *Export*
produces a PNG with the design and the materials list; *Save design* writes a
`.json` file that can be reopened or sent to a customer.

**Real swatch photos:** the 48 iMosaicArt swatch photos (No. 01–48) are in
`tools/mosaic-designer/swatches/` and embedded in the page, so it works offline.
Each stone's matching color is the average of its photo, and every mosaic tile
shows a small piece of the real swatch.

**Glass:** left out of the chart for now. The crystal glass F-series (10×10×4 mm,
154 colors, codes from their sheet position cross-checked by OCR) is cut and kept in
`tools/mosaic-designer/glass/crystal-f/`, with `glass/crystal-f-review.png`, ready to
add back.

**Material chart:** preloaded with the iMosaicArt palette (42 natural marbles, 6 engineered stones, numbered as on imosaicart.com/pages/color-palette), with their real swatch photos. Glass entries are placeholders until the glass chart is added. Use *Add material*
(name, chart code, marble/glass, finish, colors or a swatch photo), then
*Export chart* to get a JSON file you can load on any device with *Import
chart*.
