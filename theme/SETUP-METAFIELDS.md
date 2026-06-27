# Product Metafield Definitions

These power the dynamic specs block on the product page (`theme/templates/product.json`).
Create them once; they apply to all 1,530 products. They render only when a product has a value.

## Option A — Shopify Admin UI
Settings → **Custom data** → **Products** → **Add definition**, for each row below:

| Name        | Namespace.key        | Type                        | Notes                              |
|-------------|----------------------|-----------------------------|------------------------------------|
| Material    | `custom.material`    | Single line text            | e.g. glass, ceramic, stone         |
| Dimensions  | `custom.dimensions`  | Single line text            | e.g. 24" × 36"                     |
| Frame type  | `custom.frame_type`  | Single line text            | framed / unframed / floating       |
| Style       | `custom.style`       | Single line text (or list)  | abstract, landscape, religious…    |
| Artist      | `custom.artist`      | Single line text            | optional                           |
| Care        | `custom.care_instructions` | Multi-line text       | shown in the Care tab              |

For each, enable **"Storefronts"** access so the theme can read it, and (for Style)
check **"Make available for Search & Discovery filtering"**.

## Option B — Run via GraphQL (Shopify-connected session)
Run `metafieldDefinitionCreate` once per definition. Example for Material:

```graphql
mutation {
  metafieldDefinitionCreate(definition: {
    name: "Material",
    namespace: "custom",
    key: "material",
    type: "single_line_text_field",
    ownerType: PRODUCT,
    access: { storefront: PUBLIC_READ }
  }) { createdDefinition { id name } userErrors { field message } }
}
```

Repeat with: `dimensions`, `frame_type`, `style`, `artist` (all `single_line_text_field`)
and `care_instructions` (`multi_line_text_field`).

For `style`, also enable filtering after creation:
```graphql
mutation {
  metafieldDefinitionUpdate(definition: {
    namespace: "custom", key: "style", ownerType: PRODUCT,
    capabilities: { smartCollectionCondition: { enabled: true } }
  }) { updatedDefinition { id } userErrors { field message } }
}
```
(Filtering on the storefront is toggled in Settings → Search & Discovery → Filters.)

## Populating values across 1,530 products
- Bulk-edit in Admin (Products → select → Edit → add metafield columns), **or**
- CSV import with metafield columns, **or**
- `metafieldsSet` GraphQL mutation in batches (ask the assistant to script it).
