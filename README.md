# agents

Custom [Claude Code](https://code.claude.com/docs) subagents for this workspace.

## Available agents

### `seo-aeo-geo-sem-optimizer`

Makes content findable, answerable, and citable across every search surface —
and buys the traffic the organic side can't yet earn:

- **SEO** — classic ranked results: titles, meta descriptions, heading
  hierarchy, URL handles, internal links, crawlability, Core Web Vitals.
- **AEO** — answer engines: featured snippets, People Also Ask, AI Overviews
  and voice assistants, via liftable 40–60 word answers and valid schema.
- **GEO** — generative engines (ChatGPT, Claude, Perplexity, Gemini):
  self-contained chunks, consistent entity naming, verifiable citations,
  `llms.txt`, and AI-crawler policy.
- **SEM** — paid search and social on Meta (Facebook & Instagram): campaign
  structure, audiences, budgets, creative, and performance tuning against real
  account data and category benchmarks.

It audits before it edits, previews every change, and never invents statistics,
citations, or schema claims for content that isn't on the page. Ad entities are
always created **paused**, and it never activates spend or raises a budget
without showing you the number first.

Keeping organic and paid in one agent is deliberate: converting paid search
terms are the best evidence for what to write organically, and the agent will
tell you when you're about to buy clicks for a query you already rank for.

**Requires:** nothing mandatory for the organic surfaces — `WebSearch` /
`WebFetch` for research, and the `mcp__Shopify__*` tools when optimizing store
product/collection metadata. The paid half needs the **Facebook MCP**
(`mcp__Facebook_MCP__*`) connector; without it the agent says so and sticks to
organic rather than improvising. There is no Google Ads integration.

**Use it by asking the main assistant things like:**

- "Audit this page for SEO, AEO and GEO"
- "Why doesn't ChatGPT mention my brand when people ask about X?"
- "Rewrite my product descriptions so they get picked up as answers"
- "Add FAQ schema to this page and write an llms.txt"
- "Set up a paused Meta campaign for this collection"
- "My CPA is climbing — figure out why and what to change"

The agent definition lives in
[`.claude/agents/seo-aeo-geo-sem-optimizer.md`](.claude/agents/seo-aeo-geo-sem-optimizer.md).

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

1. **Sketch** — draw the design in black lines: select (move, resize, rotate,
   flip, duplicate, delete, copy/paste), pen, line, path, rectangle, ellipse,
   polygon, star, heart, text (outlined letters to color) and eraser, with
   symmetry drawing (mirror up to 12-way), a grid with snapping, zoom and pan
   (Ctrl + scroll, pinch, Space or the Move view tool), and tracing over a photo
   shown faintly underneath. Or upload a drawing and convert it to black and white (adjustable ink
   threshold), or load the sample medallion.
   - **Describe a design**: type a description and Claude draws clean,
     cuttable line art. Tick *Change the current sketch* to revise it.
   - **Redraw upload as clean lines**: turns a photo or colored design into
     line art.
   - Both AI features work when the page is opened as a Claude artifact; the
     plain HTML file hides them.
   **Uploading** asks what the picture is and what to do with it:
   - *Black & white drawing* → keep its lines, then color with stones.
   - *Colored picture or photo* → an outline to color yourself, an outline
     colored with the closest stones, or straight to a tile-by-tile mosaic.
   - *Photo of a mosaic* → rebuild it tile by tile in our stones (grout lines
     are ignored), or turn it into colored areas to adjust.
   Every result can still be edited with all the drawing tools.
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
area (ft² or m², from the finished width). *Export*
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
