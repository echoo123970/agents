"""Build the Shopify theme files for the Mosaic Designer page from index.html.

    python3 tools/mosaic-designer/build-shopify.py <theme-root>

The page uses the store's normal layout (header, menu, footer, SEO and region rules) and writes:
  templates/page.mosaic-designer.liquid  page banner + the tool, inside the site layout
  assets/mosaic-designer.css             the tool's styles, scoped under .imd so they never
                                         touch the rest of the site (light theme only)
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
# the page banner carries the title, so the tool's own brand heading goes
body = body.replace('  <h1 class="brand">iMosaicArt<small>Mosaic Designer</small></h1>\n', '')


def scope(css):
    """Prefix every selector with .imd; :root/body become .imd; dark-mode rules are dropped."""
    out, i = [], 0
    while i < len(css):
        j = css.find('{', i)
        if j < 0:
            break
        sel = css[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            depth += {'{': 1, '}': -1}.get(css[k], 0); k += 1
        block = css[j + 1:k - 1]
        i = k
        sel = re.sub(r'/\*.*?\*/', '', sel, flags=re.S).strip()
        if sel.startswith('@media') and 'prefers-color-scheme' in sel:
            continue
        if sel.startswith('@media') or sel.startswith('@supports'):
            out.append(f'{sel} {{\n{scope(block)}}}\n'); continue
        if sel.startswith('@'):
            out.append(f'{sel} {{{block}}}\n'); continue
        if 'html' in [x.strip() for x in sel.split(',')]:
            continue  # page-height rules belong to the store's own layout
        parts = []
        for one in sel.split(','):
            one = one.strip()
            if one.startswith(':root[') or one.startswith(':root:not') or one in ('html',):
                continue
            if one in (':root', 'body'):
                parts.append('.imd')
            else:
                parts.append('.imd ' + one)
        if parts:
            out.append(f"{', '.join(parts)} {{{block}}}\n")
    return ''.join(out)


style = scope(style) + """
/* inside the store page */
.imd { max-width: 1440px; margin: 0 auto; padding-block: 24px 60px; border-radius: 0; }
.imd .btn { letter-spacing: normal; text-transform: none; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; transition: none; }
.imd .btn.primary { letter-spacing: .06em; }
.imd table { border-spacing: 0; }
.md-hero { background: var(--color-panel); border-bottom: 1px solid rgba(22,51,94,.08); }
.md-hero__crumb { max-width: var(--page-width); margin: 0 auto; padding: 30px 40px 0; display: flex; align-items: center; gap: 9px; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--color-text-soft); }
.md-hero__crumb span:nth-child(2) { color: #B7C0D2; } .md-hero__crumb span:last-child { color: var(--color-navy); }
.md-hero__inner { max-width: 960px; margin: 0 auto; padding: 36px 40px 44px; text-align: center; }
.md-hero__eyebrow { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 18px; font-family: var(--font-accent); font-size: 13px; letter-spacing: .36em; text-transform: uppercase; color: var(--color-navy); }
.md-hero__eyebrow::before, .md-hero__eyebrow::after { content: ""; width: 38px; height: 1px; background: var(--color-blue); }
.md-hero__title { font-family: var(--font-display); font-weight: 500; font-size: clamp(38px, 5vw, 64px); line-height: 1.02; margin-bottom: 18px; color: var(--color-navy); }
.md-hero__title em { font-style: italic; color: var(--color-blue); }
.md-hero__text { font-size: 17px; line-height: 1.7; color: var(--color-text-muted); max-width: 880px; text-wrap: balance; margin: 0 auto; }
@media (max-width: 600px) { .md-hero__crumb, .md-hero__inner { padding-left: 22px; padding-right: 22px; } }
"""
swatches = ',\n'.join(
    f'    {k}: {{ base: {json.dumps(b)}, photo: "{{{{ \'sw-{k[1:]}.png\' | asset_url }}}}" }}' for k, b in bases.items())

template = f"""{{{{ 'mosaic-designer.css' | asset_url | stylesheet_tag }}}}
<section class="md-hero">
  <div class="md-hero__crumb"><a href="{{{{ routes.root_url }}}}">Home</a><span>/</span><span>{{{{ page.title }}}}</span></div>
  <div class="md-hero__inner">
    <div class="md-hero__eyebrow">Create Your Own</div>
    <h1 class="md-hero__title">Design Your <em>Mosaic</em></h1>
    <p class="md-hero__text">Upload a photo or drawing, or draw and write your own design. Fill it with our natural marble and engineered stones, and see it as a hand-cut mosaic with a full list of materials.</p>
  </div>
</section>
<div class="imd">
{body}</div>
<script>
  // iMosaicArt stone photos from this theme (sw-01 ... sw-48) and each stone's average color.
  window.IMOSAIC_SWATCHES = {{
{swatches}
  }};
  // "Describe it" drawing helper (tools/mosaic-designer/ai-worker), set in the shop metafield imosaic.ai_url
  window.IMOSAIC_AI_URL = {{{{ shop.metafields.imosaic.ai_url.value | json }}}};
</script>
<script src="{{{{ 'mosaic-designer.js' | asset_url }}}}" defer></script>
"""
# Answers /collections/<handle>?view=mosaic-designs&sort_by=best-selling with that collection's
# first 20 marble products (in the requested order) as JSON, for the tool's ready-design gallery.
# Marble pieces are the ones titled or tagged marble; glass pieces are left out.
designs_view = '''{%- layout none -%}
{%- paginate collection.products by 250 -%}
[{%- assign sep = '' -%}{%- assign n = 0 -%}
{%- for p in collection.products -%}
{%- assign tl = p.title | downcase -%}
{%- if p.featured_image and tl contains 'marble' or p.featured_image and p.tags contains 'marble mosaic' -%}{%- unless tl contains 'glass' -%}
{{ sep }}{"t":{{ p.title | json }},"u":{{ p.url | json }},"th":{{ p.featured_image | image_url: width: 360 | json }},"img":{{ p.featured_image | image_url: width: 1400 | json }}}{%- assign sep = ',' -%}{%- assign n = n | plus: 1 -%}
{%- if n >= 20 -%}{%- break -%}{%- endif -%}
{%- endunless -%}{%- endif -%}
{%- endfor -%}]
{%- endpaginate -%}
'''
files = {
    'templates/page.mosaic-designer.liquid': template,
    'templates/collection.mosaic-designs.liquid': designs_view,
    'assets/mosaic-designer.css': style,
    'assets/mosaic-designer.js': main_js,
}
for path, text in files.items():
    out = os.path.join(root, path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f'{path}: {len(text.encode()) // 1024} KB')

# the earlier stand-alone layout is no longer used
old = os.path.join(root, 'layout', 'mosaic-designer.liquid')
if os.path.exists(old):
    os.remove(old); print('removed layout/mosaic-designer.liquid')
