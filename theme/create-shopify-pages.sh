#!/usr/bin/env bash
# ============================================================================
# Creates every page record the theme needs, with the correct handle + theme
# template, so none of the /pages/* URLs return 404.
#
# WHY THIS IS NEEDED:
#   The GitHub -> Shopify sync deploys the THEME (templates + sections). A
#   *page* is store content, not a theme file, so it must exist as a record in
#   admin for /pages/<handle> to resolve. This script creates those records and
#   points each one at its matching `page.<suffix>` template.
#
# USAGE:
#   1) Shopify admin -> Settings -> Apps and sales channels -> Develop apps
#      -> Create an app -> Admin API access scopes: enable `write_content`
#      (and `read_content`) -> Install -> reveal the Admin API access token
#      (starts with shpat_).
#   2) Run:
#        export SHOP="aml89.myshopify.com"
#        export TOKEN="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
#        bash theme/create-shopify-pages.sh
#
#   Re-running is safe: it skips any page whose handle already exists.
# ============================================================================
set -euo pipefail

: "${SHOP:?Set SHOP, e.g. export SHOP=aml89.myshopify.com}"
: "${TOKEN:?Set TOKEN, e.g. export TOKEN=shpat_...}"
API="https://$SHOP/admin/api/2024-01"
HDR_AUTH="X-Shopify-Access-Token: $TOKEN"

# title | handle | template_suffix
PAGES=(
  "About|about-us|about"
  "Custom Mosaics|custom-mosaics|custom-mosaics"
  "FAQ|faq|faq"
  "Portfolio|portfolio|portfolio"
  "Installation Guide|installation-guide|installation-guide"
  "Color Palette|color-palette|color-palette"
  "Reviews|reviews|reviews"
  "Testimonials|testimonials|testimonials"
  "Rewards|rewards|rewards"
  "Wishlist|wishlist|wishlist"
  "Contact|contact|contact"
  "Terms & Conditions|terms-conditions|terms-conditions"
  "Shipping Policy|shipping-policy|shipping-policy"
  "Returns & Refunds|returns-refunds|returns-refunds"
  "Privacy Policy|privacy-policy|privacy-policy"
  "Billing Terms|billing-terms|billing-terms"
)

echo "Fetching existing pages from $SHOP ..."
EXISTING=$(curl -sS -H "$HDR_AUTH" "$API/pages.json?limit=250&fields=handle" | tr ',' '\n' | grep -o '"handle":"[^"]*"' | sed 's/"handle":"//;s/"//' || true)

for row in "${PAGES[@]}"; do
  IFS='|' read -r TITLE HANDLE SUFFIX <<< "$row"
  if echo "$EXISTING" | grep -qx "$HANDLE"; then
    echo "skip   $HANDLE (already exists)"
    continue
  fi
  BODY=$(cat <<JSON
{"page":{"title":"$TITLE","handle":"$HANDLE","template_suffix":"$SUFFIX","published":true,"body_html":""}}
JSON
)
  CODE=$(curl -sS -o /tmp/page_resp.json -w "%{http_code}" -X POST \
    -H "$HDR_AUTH" -H "Content-Type: application/json" \
    -d "$BODY" "$API/pages.json")
  if [ "$CODE" = "201" ]; then
    echo "create $HANDLE -> template page.$SUFFIX  (OK)"
  else
    echo "ERROR  $HANDLE (HTTP $CODE): $(cat /tmp/page_resp.json)"
  fi
  sleep 0.6   # stay under the 2 req/s REST limit
done

echo ""
echo "Done. Visit https://$SHOP/pages/faq (and the others) to confirm they resolve."
