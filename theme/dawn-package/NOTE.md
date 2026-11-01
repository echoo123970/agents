# Why these templates live here

`theme/` holds the self-contained iMosaicArt theme from PR #3, which brings its
own sections (`main-collection`, `main-product`, and so on).

The three template JSON files in this folder come from PR #1 and are a
different thing: a **delivery package** for the Dawn-based draft theme. They
reference standard Dawn section types (`main-collection-banner`,
`main-collection-product-grid`) that do not exist in this repository, because
they are meant to be pasted into the Dawn draft theme as `theme/APPLY.md`
describes.

Both sets claimed `theme/templates/`. Rather than let one overwrite the other,
the Dawn delivery package was moved here intact. Nothing was changed inside the
files themselves.

`theme/APPLY.md` step 3 refers to `theme/templates/*.json`; read that as
`theme/dawn-package/templates/*.json`.
