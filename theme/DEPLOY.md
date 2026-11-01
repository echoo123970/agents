# Deploying the iMosaicArt theme

Run these on **your own computer** (this is done from your machine, not the cloud workspace).

## 1. One-time installs
Open Terminal (Mac) or PowerShell (Windows) and check:
```bash
node -v        # need a version number; if not, install from https://nodejs.org (LTS)
git --version  # if not, install from https://git-scm.com/downloads
```
Install the Shopify CLI:
```bash
npm install -g @shopify/cli@latest
shopify version   # confirm it works
```

## 2. Get the theme code
```bash
git clone https://github.com/echoo123970/agents.git
cd agents
git checkout claude/shopify-connectors-capabilities-ufwjtr
git pull
cd theme
```

## 3. Get a Theme Access token
1. In Shopify admin, open the **Theme Access** app.
2. Create/manage a password — it gives you a token starting with `shptka_…`.
3. Copy it. (Generate a **fresh** one; don't reuse any token that's been shared in chat.)

## 4. Preview locally (safe — nothing goes live)
```bash
shopify theme dev --store aml89.myshopify.com --password shptka_YOUR_TOKEN
```
Open the preview URL it prints (e.g. http://127.0.0.1:9292). Ctrl+C to stop.

## 5. Upload to the store as a DRAFT (does not replace your live theme)
```bash
shopify theme push --store aml89.myshopify.com --password shptka_YOUR_TOKEN --unpublished --theme "iMosaicArt"
```
This adds it to **Online Store → Themes** as an unpublished theme.

## 6. Finish in Shopify admin
- **Online Store → Themes → iMosaicArt → Preview**
- **Pages** (Online Store → Pages): create each page and set its **Theme template**:
  | Page | Template |
  |------|----------|
  | About us | `page.about` |
  | Custom Mosaics | `page.custom-mosaics` |
  | Contact Us | `page.contact` |
  | FAQ | `page.faq` |
  | Portfolio | `page.portfolio` |
  | Color Palette | `page.color-palette` |
  | Installation Guide | `page.installation-guide` |
  | Rewards Program | `page.rewards` |
  | Reviews / Testimonials | `page.reviews` |
  | Wishlist | `page.wishlist` |
  | Terms & Conditions | `page.terms-conditions` |
  | Shipping Policy | `page.shipping-policy` |
  | Returns & Refunds | `page.returns-refunds` |
  | Privacy Policy | `page.privacy-policy` |
  | Billing Terms | `page.billing-terms` |
- Paste the policy text into the legal pages (Terms, Shipping, Returns, Privacy, Billing).
- **Theme Editor**: pick a collection for Bestsellers & Category grid, and your blog for Journal.
- **Navigation** (Online Store → Navigation): set the header `main-menu` and `footer` menus.
- When happy → **Actions → Publish**.

## Updating later
After pulling new changes (`git pull`), just re-run the push command in step 5.
```bash
shopify theme push --store aml89.myshopify.com --password shptka_YOUR_TOKEN --theme "iMosaicArt"
```
