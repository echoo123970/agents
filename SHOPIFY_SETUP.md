# Connecting the Shopify MCP server

The `shopify-product-creator` agent uses `mcp__Shopify__*` tools, which are
provided by a Shopify MCP server. This repo ships the wiring in
[`.mcp.json`](.mcp.json); you supply the credentials and network access. **No
secrets are stored in the repo** — the config reads them from environment
variables at runtime.

## What you need to do (one-time)

Because this runs in a remote Claude Code environment, three things are
controlled by you in the environment settings, not from inside the session:

### 1. Add the credentials as environment secrets

In your Claude Code (web) environment configuration, set:

| Variable                | Value                                              | Required? |
| ----------------------- | -------------------------------------------------- | --------- |
| `SHOPIFY_ACCESS_TOKEN`  | Your Admin API access token (`shpat_…`)            | **Yes**   |
| `SHOPIFY_STORE_DOMAIN`  | `your-store.myshopify.com` (no `https://`, no path) | Optional — defaults to `imosaicart.myshopify.com` (set this only to point at a different store) |

> Getting an Admin API token: in Shopify admin go to **Settings → Apps and
> sales channels → Develop apps → Create an app**, then under **API
> credentials / Admin API access scopes** grant at least `read_products` and
> `write_products` (add `read_inventory`/`write_inventory` and
> `read_publications`/`write_publications` for inventory and collections).
> Install the app and copy the **Admin API access token** (`shpat_…`).

### 2. Allow Shopify in the network policy

The environment's network policy must permit outbound HTTPS to
`*.myshopify.com`. If outbound access is restricted, add that host (or use a
policy that allows it).

### 3. Restart the session

MCP servers are loaded at session start. After adding the secrets and adjusting
the network policy, start a fresh session so `.mcp.json` is picked up. You can
then confirm with: *"is shopify connected?"* — the `mcp__Shopify__get-shop-info`
tool should be available and return your shop name/currency.

## If the tool names don't resolve

The committed config points at Shopify's official remote MCP endpoint
(`https://<domain>/api/mcp`, token sent as the `X-Shopify-Access-Token`
header). If your Shopify setup instead uses a local (stdio) MCP package, swap
the `Shopify` block in `.mcp.json` for something like:

```json
{
  "mcpServers": {
    "Shopify": {
      "command": "npx",
      "args": ["-y", "<your-shopify-mcp-package>"],
      "env": {
        "SHOPIFY_STORE_DOMAIN": "${SHOPIFY_STORE_DOMAIN}",
        "SHOPIFY_ACCESS_TOKEN": "${SHOPIFY_ACCESS_TOKEN}"
      }
    }
  }
}
```

Keep the server name as `Shopify` so the tools resolve as `mcp__Shopify__*`,
matching the `shopify-product-creator` agent's `tools:` list.
