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

### `instagram-publisher`

Publishes organic content to a connected Instagram **Business/Creator** account
— single-image posts, Reels, and multi-image carousels — each with a caption and
hashtags. It resolves the account, validates the media (public HTTPS URLs, no
query strings; JPEG for images, MP4 for Reels), runs Instagram's two-step
container → publish flow, and **confirms the caption and media before
publishing** since a post goes public immediately.

**Requires:** the Composio MCP server connected, with the **Instagram** toolkit
authorized (it uses the `mcp__Composio__*` meta-tools to run the `INSTAGRAM_*`
Graph API actions). If Instagram isn't connected yet, the agent walks you
through the OAuth flow.

**Use it by asking the main assistant things like:**

- "Post this photo to Instagram with a caption and some hashtags"
- "Create a reel from this MP4 and share it to the feed"
- "Publish a 3-image carousel with this caption"
- "Suggest hashtags for this post and publish it"

Paid promotion / boosting a post is intentionally out of scope (that's a Meta
Ads task).

The agent definition lives in
[`.claude/agents/instagram-publisher.md`](.claude/agents/instagram-publisher.md).
### `meta-post-scheduler`

Schedules posts to a Facebook Page and its linked Instagram account so they
appear in the **Meta Business Suite Planner**. It collects the caption, media,
platforms and publish time (with time zone), checks them against Meta's rules
(10 minutes to 75 days ahead, Instagram needs media, caption limits), confirms
with you, then schedules — it never publishes immediately unless you ask.

**Requires:** the Facebook MCP connector to be authorized in your claude.ai
connector settings (it uses the `mcp__Facebook_MCP__*` tools).

**Use it by asking the main assistant things like:**

- "Schedule this photo on Facebook and Instagram for Friday at 9am EST"
- "Add a post to my planner for next Monday announcing our fall sale"
- "Plan three posts for next week on FB and IG"

The agent definition lives in
[`.claude/agents/meta-post-scheduler.md`](.claude/agents/meta-post-scheduler.md).
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
