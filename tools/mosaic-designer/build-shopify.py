"""Build the Shopify theme files for the Mosaic Designer page from index.html.

    python3 tools/mosaic-designer/build-shopify.py <theme-root>

Writes into the theme root (the shopify-live branch):
  layout/mosaic-designer.liquid          the page as its own full-screen layout
  templates/page.mosaic-designer.liquid  page template that uses that layout
  assets/mosaic-designer.css             styles
  assets/mosaic-designer.js              the tool

On the website the stone photos come from the theme's own sw-01.png ... sw-48.png (the
images on the color-palette page) instead of the copies embedded in index.html.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
root = sys.argv[1]
src = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()

style = re.search(r'<style>\n(.*?)</style>', src, re.S).group(1)
scripts = re.findall(r'<script>\n(.*?)</script>', src, re.S)
swatch_js = next(s for s in scripts if 'window.IMOSAIC_SWATCHES = ' in s)
main_js = next(s for s in scripts if s.startswith('(() => {'))
bases = {k: v['base'] for k, v in json.loads(re.search(r'window\.IMOSAIC_SWATCHES = (\{.*?\});', swatch_js, re.S).group(1)).items()}

body = src[src.index('<body>') + len('<body>'):src.index('<script>')]
assert '{{' not in body and '{%' not in body, 'markup must not contain Liquid tags'
# the brand links back to the store
body = body.replace('<h1 class="brand">iMosaicArt<small>Mosaic Designer</small></h1>',
                    '<h1 class="brand"><a href="{{ routes.root_url }}" style="color:inherit;text-decoration:none">iMosaicArt</a><small>Mosaic Designer</small></h1>')

swatches = ',\n'.join(
    f'    {k}: {{ base: {json.dumps(b)}, photo: "{{{{ \'sw-{k[1:]}.png\' | asset_url }}}}" }}' for k, b in bases.items())

layout = f'''<!doctype html>
<html lang="{{{{ request.locale.iso_code }}}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Mosaic Designer – {{{{ shop.name }}}}</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="https://cdn.shopify.com/s/files/1/0754/6093/5978/files/favicon-32.png?v=1783243826">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Hanken+Grotesk:wght@400;500;600&family=Marcellus&display=swap">
  {{{{ 'mosaic-designer.css' | asset_url | stylesheet_tag }}}}
  {{{{ content_for_header }}}}
</head>
<body>
{body}<div hidden>{{{{ content_for_layout }}}}</div>
<script>
  // iMosaicArt stone photos from this theme (sw-01 ... sw-48) and each stone's average color.
  window.IMOSAIC_SWATCHES = {{
{swatches}
  }};
</script>
<script src="{{{{ 'mosaic-designer.js' | asset_url }}}}" defer></script>
</body>
</html>
'''
files = {
    'layout/mosaic-designer.liquid': layout,
    'templates/page.mosaic-designer.liquid': "{% layout 'mosaic-designer' %}\n",
    'assets/mosaic-designer.css': style,
    'assets/mosaic-designer.js': main_js,
}
for path, text in files.items():
    out = os.path.join(root, path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'{path}: {len(text.encode()) // 1024} KB')
