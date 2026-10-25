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

### `imosaicart-journal-writer`

Researches, writes and maintains articles for the iMosaicArt journal (the
Shopify blog on www.imosaicart.com). Articles are question-led and optimized
for SEO, AEO (answer engines) and GEO (AI search): answer-first intros, FAQ
sections with `FAQPage` schema, page title and meta description on every
article, category tags, internal links that open in a new tab, and featured
images at least 1200 px wide taken only from active products or the
portfolio. It works on the blog only and never edits store pages, products or
theme files.

**Requires:** the Shopify MCP server (`mcp__Shopify__*` tools) and web search.

**Use it by asking the main assistant things like:**

- "Write a new journal article about mosaic pool designs"
- "Research mosaic news and write 4 articles for the blog"
- "Check every blog post has a meta description and featured image"

The agent definition lives in
[`.claude/agents/imosaicart-journal-writer.md`](.claude/agents/imosaicart-journal-writer.md).
