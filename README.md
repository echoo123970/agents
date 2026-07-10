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

### `seo-sem-optimizer`

Improves the store website's search visibility and paid-search performance. It
covers two areas:

- **SEO** — audits and optimizes product/collection metadata (page titles, meta
  descriptions, URL handles, image alt text) through the Shopify MCP tools, and
  does keyword research with web search.
- **SEM** — plans, builds, and tunes paid ad campaigns on **Meta (Facebook &
  Instagram) Ads** via the Facebook MCP tools.

It always previews changes before applying them and never starts paid ad spend
or overwrites live product metadata without confirmation. New ad entities are
created **paused** so nothing goes live by accident.

**Requires:** the Shopify MCP server (for SEO) and the Facebook Ads MCP server
(for SEM) to be connected.

**Use it by asking the main assistant things like:**

- "Audit the SEO on my top products and fix the weak meta descriptions"
- "Do keyword research for my mosaic art and update the page titles"
- "Set up a paused Meta ad campaign to drive sales, then show me the budget"
- "My ad performance is dropping — diagnose it and suggest fixes"

The agent definition lives in
[`.claude/agents/seo-sem-optimizer.md`](.claude/agents/seo-sem-optimizer.md).
