#!/usr/bin/env python3
"""Write the colour-chart pages into src/index.html and src/colour-chart.html.

The charts appear in two documents — one slide per material inside the deck,
and every sheet at reading size in the standalone annex — so they are
generated rather than kept in step by hand. Add a file to images/ named
after its material and run:

    images/marble-01.jpg, images/glass-07.jpg …
    python3 tools/charts.py

A material with no files is simply skipped, so the deck never carries an
empty chart page. Materials run in the order of MATERIALS below, and each
sheet is drawn with `contain`, so no code is ever cropped off the edge.
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

# prefix → the name used on the page, the deck slide's headline, and the line
# under it. Order here is the order the slides appear in.
MATERIALS = [
    ("marble", {
        "name": "Marble",
        "kind": "swatches",
        "headline": "Stone chosen by name, and by the block.",
        "lead": "Natural stone, so colour and vein carry the variation of the block they were cut from. "
                "Any marble shown can be specified by name.",
    }),
    ("glass", {
        "name": "Glass",
        "kind": "sheets",
        "headline": "Hundreds of colours, each one specified by its code.",
        "lead": "Colour runs through the body of the glass, so a cut edge matches the face. Iridescent "
                "and metal-leaf ranges included.",
    }),
]

SHEET_W = 1600          # px across the composed contact sheet; tiers downscale
SHEET_ROWS = 3

BANNER = r"<!-- =+\n     \d+ — (?:%s) COLOUR CHART" % "|".join(
    m[1]["name"].upper() for m in MATERIALS
)

ANNEX_PAGE = '''<!-- ============================================================
     {num} — {upper} COLOUR CHART {n} of {total}
     ============================================================ -->
<div class="page marble-light">
  <div class="pad" style="display:flex;flex-direction:column;inset:10mm 8mm 10mm">
    <div style="flex:none">
      <div class="eyebrow on-light">{name} &nbsp;—&nbsp; colour chart{cont}</div>
{lead}    </div>
    <div data-slot="{slot}" style="flex:1;margin-top:{gap};background-size:contain;background-repeat:no-repeat;background-position:center;background-color:transparent"></div>
  </div>
</div>

'''

LEAD = ('      <p style="margin:3mm 0 0;font-size:8.6pt;line-height:1.6">{lead}</p>\n')

DECK_PAGE = '''<!-- ============================================================
     {num} — {upper} COLOUR CHART
     ============================================================ -->
<div class="page marble-light">
  <div class="pad" style="display:flex;flex-direction:column;inset:12mm 10mm 10mm">
    <div style="flex:none">
      <div class="eyebrow on-light">{name} &nbsp;—&nbsp; colour chart</div>
      <h2 style="margin-top:4mm;font-size:19pt;white-space:nowrap">{headline}</h2>
      <p style="margin:3.5mm 0 0;font-size:8.4pt;line-height:1.6">{lead} The full charts are supplied at reading size as a separate sheet.</p>
    </div>
    <div data-slot="chartsheet-{prefix}" style="flex:1;margin-top:4mm;background-size:contain;background-repeat:no-repeat;background-position:center;background-color:transparent"></div>
  </div>
</div>

'''


def slots(prefix):
    return sorted(p.stem for p in IMAGES.glob("%s-*.jpg" % prefix))


def rows_of(charts):
    """Split the sheets into rows whose aspect ratios sum to about the same.

    A row of images scaled to one height fills a fixed width when their
    aspect ratios add up, so equalising those sums is what keeps the rows
    the same depth and the sheet free of the gaps a fixed grid leaves.
    """
    aspects = [c.width / c.height for c in charts]
    rows_wanted = min(SHEET_ROWS, len(charts))
    target = sum(aspects) / rows_wanted
    rows, row, used = [], [], 0.0
    for chart, aspect in zip(charts, aspects):
        # start a new row once this one is closer to full without the chart
        if row and len(rows) < rows_wanted - 1 and abs(used - target) <= abs(used + aspect - target):
            rows.append(row)
            row, used = [], 0.0
        row.append(chart)
        used += aspect
    rows.append(row)
    return rows


def swatch_grid(charts):
    """Lay square swatches in a grid at their own size.

    These are 120px photographs of a tile field; scaling them up only
    softens them, so the grid is built at native size and the page draws it
    small enough that each swatch lands at a sensible resolution.
    """
    cols = max(1, round((len(charts) * 2.4) ** 0.5))
    cell = max(c.width for c in charts)
    gap = max(2, cell // 12)
    rows = -(-len(charts) // cols)
    sheet = Image.new("RGB", (gap + cols * (cell + gap), gap + rows * (cell + gap)), "#FFFDF8")
    for i, c in enumerate(charts):
        if c.size != (cell, cell):
            c = c.resize((cell, cell), Image.LANCZOS)
        x = gap + (i % cols) * (cell + gap)
        y = gap + (i // cols) * (cell + gap)
        sheet.paste(c, (x, y))
    return sheet


def composite(prefix):
    """Tile a material's sheets into one contact sheet for its deck slide.

    Ten images on one page would each carry the encoder's resolution floor,
    which costs far more than a page that size can show. One image sized to
    the frame costs a fraction of it.
    """
    charts = [Image.open(IMAGES / (s + ".jpg")) for s in slots(prefix)]
    out = IMAGES / ("chartsheet-%s.jpg" % prefix)
    if dict(MATERIALS)[prefix].get("kind") == "swatches":
        sheet = swatch_grid(charts)
        sheet.save(out, quality=92, subsampling=0)
        return sheet.size
    gap = SHEET_W // 150
    laid, y = [], gap
    for row in rows_of(charts):
        width = SHEET_W - gap * (len(row) + 1)
        height = round(width / sum(c.width / c.height for c in row))
        x = gap
        for c in row:
            w = round(height * c.width / c.height)
            laid.append((c.resize((w, height), Image.LANCZOS), x, y))
            x += w + gap
        y += height + gap
    sheet = Image.new("RGB", (SHEET_W, y), "#FFFDF8")
    for img, x, yy in laid:
        sheet.paste(img, (x, yy))
    sheet.save(out, quality=92, subsampling=0)
    return sheet.size


def deck_pages():
    body, made = "", []
    for prefix, copy in MATERIALS:
        if not slots(prefix):
            continue
        size = composite(prefix)
        body += DECK_PAGE.format(num=0, prefix=prefix, upper=copy["name"].upper(),
                                 name=copy["name"], headline=copy["headline"], lead=copy["lead"])
        made.append((copy["name"], len(slots(prefix)), size))
    return body, made


def annex_pages():
    body = ""
    for prefix, copy in MATERIALS:
        if copy.get("kind") == "swatches":
            names = ["chartsheet-" + prefix] if slots(prefix) else []
        else:
            names = slots(prefix)
        for i, slot in enumerate(names, start=1):
            body += ANNEX_PAGE.format(num=0, upper=copy["name"].upper(), name=copy["name"],
                                      n=i, total=len(names), slot=slot,
                                      cont="" if i == 1 else " &nbsp;·&nbsp; continued",
                                      lead=LEAD.format(lead=copy["lead"]) if i == 1 else "",
                                      gap="4mm" if i == 1 else "3.5mm")
    return body


def swap_run(text, body, tail_marker):
    """Replace whatever chart run is in the file with a freshly generated one."""
    start = re.search(BANNER, text).start()
    return text[:start] + body + text[text.index(tail_marker):]


def renumber(text):
    """Number every page banner by its position, so a longer or shorter chart
    run cannot leave the pages after it mislabelled."""
    n = [0]

    def bump(m):
        n[0] += 1
        return "     %d — " % n[0]

    return re.sub(r"^     \d+ — ", bump, text, flags=re.M)


def write(path, text):
    assert len(re.findall(r"<div\b", text)) == text.count("</div>"), path
    path.write_text(renumber(text))


def main():
    body, made = deck_pages()
    assert made, "no chart images in images/ — expected marble-NN.jpg or glass-NN.jpg"

    deck = ROOT / "src" / "index.html"
    s = deck.read_text()
    # the run sits between the technical page and the process page — found by
    # name, since the numbers move every time the run changes length
    tail = re.search(r"<!-- =+\n     \d+ — PROCESS", s).group(0)
    write(deck, swap_run(s, body, tail))

    annex = ROOT / "src" / "colour-chart.html"
    write(annex, swap_run(annex.read_text(), annex_pages(), "</body>"))

    for name, count, size in made:
        print("%-7s %2d sheets in the annex, one %dx%d contact sheet in the deck"
              % (name + ":", count, size[0], size[1]))


if __name__ == "__main__":
    main()
