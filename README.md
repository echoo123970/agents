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
