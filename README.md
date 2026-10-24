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
