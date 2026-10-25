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

### iMosaicArt Design Studio — `tools/inlay-studio/index.html`

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
2. **Color** — pick a material from the chart and tap any closed area. Each
   marble piece gets its own vein direction. Choose the joint color (black,
   grey, white grout, brass strip, lead came) and close small gaps with
   *Gap closing*.

The **Materials used** table lists each material with piece count, share and
area (ft² or m², from the finished width), plus a 15% overage line. *Export*
produces a PNG with the design and the materials list; *Save design* writes a
`.json` file that can be reopened or sent to a customer.

**Material chart:** preloaded with the iMosaicArt palette (42 natural marbles, 6 engineered stones, numbered as on imosaicart.com/pages/color-palette). Swatch colors are close approximations; add each swatch photo with Edit for an exact match. Glass entries are placeholders until the glass chart is added. Use *Add material*
(name, chart code, marble/glass, finish, colors or a swatch photo), then
*Export chart* to get a JSON file you can load on any device with *Import
chart*.
