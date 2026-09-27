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

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"

LEAD = ('      <p style="margin:3mm 0 0;font-size:8.6pt;line-height:1.6">Colour runs through the body of '
        'the glass, so a cut edge matches the face. Iridescent and metal-leaf ranges included '
        '&nbsp;·&nbsp; any colour can be specified by its code.</p>\n')

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


def main():
    deck = ROOT / "src" / "index.html"
    s = deck.read_text()
    # the chart run sits between the technical page and the process page —
    # found by name, since the numbers move every time the run changes length
    tail = re.search(r"<!-- =+\n     \d+ — PROCESS", s).group(0)
    s, count = replace_run(s, 13, tail)
    write(deck, renumber(s))

    annex = ROOT / "src" / "colour-chart.html"
    a = annex.read_text()
    a, _ = replace_run(a, 13, "</body>")
    write(annex, a)

    print("charts written: %d sheets into the deck and the annex" % count)


if __name__ == "__main__":
    main()
