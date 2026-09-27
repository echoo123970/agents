#!/usr/bin/env python3
"""Write the colour-chart pages into src/index.html and src/colour-chart.html.

The charts appear in two documents — inside the deck, and as the standalone
chart annex — so they are generated rather than kept in step by hand. Add a
file to images/ as glass-NN.jpg and run:

    python3 tools/charts.py

Each sheet gets its own page and is drawn with `contain`, so no code is ever
cropped off the edge.
"""
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

LEAD = ('      <p style="margin:3mm 0 0;font-size:8.6pt;line-height:1.6">Colour runs through the body of '
        'the glass, so a cut edge matches the face. Iridescent and metal-leaf ranges included '
        '&nbsp;·&nbsp; any colour can be specified by its code.</p>\n')

SHEET = IMAGES / "chartsheet.jpg"
SHEET_W = 1600          # px across; the tiers downscale from here
SHEET_ROWS = 3


def rows_of(charts):
    """Split the sheets into rows whose aspect ratios sum to about the same.

    A row of images scaled to one height fills a fixed width when their
    aspect ratios add up, so equalising those sums is what keeps the rows
    the same depth and the sheet free of the gaps a fixed grid leaves.
    """
    aspects = [c.width / c.height for c in charts]
    target = sum(aspects) / SHEET_ROWS
    rows, row, used = [], [], 0.0
    for chart, aspect in zip(charts, aspects):
        # start a new row once this one is closer to full without the chart
        if row and len(rows) < SHEET_ROWS - 1 and abs(used - target) <= abs(used + aspect - target):
            rows.append(row)
            row, used = [], 0.0
        row.append(chart)
        used += aspect
    rows.append(row)
    return rows


def composite():
    """Tile every sheet into one contact sheet for the deck's single page.

    Ten images on one page would each carry the encoder's resolution floor,
    which costs far more than a page that size can show. One image sized to
    the frame costs a fraction of it.
    """
    charts = [Image.open(IMAGES / (s + ".jpg")) for s in slots()]
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
    sheet.save(SHEET, quality=92, subsampling=0)
    return sheet.size


PAGE = '''<!-- ============================================================
     {num} — GLASS COLOUR CHART {n} of {total}
     ============================================================ -->
<div class="page marble-light">
  <div class="pad" style="display:flex;flex-direction:column;inset:10mm 8mm 10mm">
    <div style="flex:none">
      <div class="eyebrow on-light">Glass &nbsp;—&nbsp; colour chart{cont}</div>
{lead}    </div>
    <div data-slot="{slot}" style="flex:1;margin-top:{gap};background-size:contain;background-repeat:no-repeat;background-position:center;background-color:transparent"></div>
  </div>
</div>

'''

OPEN = '<!-- ============================================================\n     {} — GLASS COLOUR CHART'


def slots():
    found = sorted(p.stem for p in IMAGES.glob("glass-*.jpg"))
    assert found, "no glass-NN.jpg in images/"
    return found


def pages(first_num):
    names = slots()
    out = ""
    for i, slot in enumerate(names, start=1):
        out += PAGE.format(num=first_num + i - 1, n=i, total=len(names), slot=slot,
                           cont="" if i == 1 else " &nbsp;·&nbsp; continued",
                           lead=LEAD if i == 1 else "",
                           gap="4mm" if i == 1 else "3.5mm")
    return out, len(names)


def replace_run(text, first_num, tail_marker):
    """Swap whatever chart run is there now for a freshly generated one."""
    start = re.search(r"<!-- =+\n     \d+ — GLASS COLOUR CHART", text).start()
    end = text.index(tail_marker)
    body, count = pages(first_num)
    return text[:start] + body + text[end:], count


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
    path.write_text(text)


DECK_PAGE = '''<!-- ============================================================
     {num} — GLASS COLOUR CHART
     ============================================================ -->
<div class="page marble-light">
  <div class="pad" style="display:flex;flex-direction:column;inset:12mm 10mm 10mm">
    <div style="flex:none">
      <div class="eyebrow on-light">Glass &nbsp;—&nbsp; colour chart</div>
      <h2 style="margin-top:4mm;font-size:19pt;white-space:nowrap">Hundreds of colours, each one specified by its code.</h2>
      <p style="margin:3.5mm 0 0;font-size:8.4pt;line-height:1.6">Colour runs through the body of the glass, so a cut edge matches the face. Iridescent and metal-leaf ranges included. The full charts are supplied at reading size as a separate sheet.</p>
    </div>
    <div data-slot="chartsheet" style="flex:1;margin-top:4mm;background-size:contain;background-repeat:no-repeat;background-position:center;background-color:transparent"></div>
  </div>
</div>

'''


def main():
    size = composite()
    deck = ROOT / "src" / "index.html"
    s = deck.read_text()
    # the chart run sits between the technical page and the process page —
    # found by name, since the numbers move every time the run changes length
    tail = re.search(r"<!-- =+\n     \d+ — PROCESS", s).group(0)
    start = re.search(r"<!-- =+\n     \d+ — GLASS COLOUR CHART", s).start()
    s = s[:start] + DECK_PAGE.format(num=13) + s[s.index(tail):]
    write(deck, renumber(s))

    annex = ROOT / "src" / "colour-chart.html"
    a = annex.read_text()
    a, count = replace_run(a, 13, "</body>")
    write(annex, a)

    print("charts written: %d sheets in the annex, one contact sheet %dx%d in the deck"
          % (count, size[0], size[1]))


if __name__ == "__main__":
    main()
