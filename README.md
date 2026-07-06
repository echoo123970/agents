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
