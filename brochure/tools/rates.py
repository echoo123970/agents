#!/usr/bin/env python3
"""Write the rate tables into src/price-list.html from the bands below.

The price list carries the same rates twice — once with shipping in them,
once with the $100 per m² freight taken out. Editing both by hand means two
places to keep in step, so they are generated from BANDS.

    python3 tools/rates.py

Categories are listed alphabetically within a band.
"""
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

# base rate per m², with shipping included → the categories that carry it
BANDS = [
    (500, ["Sheets"]),
    (900, ["Abstract", "Geometric", "Logos", "Patterns"]),
    (950, ["Animals", "Birds & butterflies", "Borders", "Flowers & trees",
           "Food", "Landmark", "Landscape", "Nautical"]),
    (980, ["Portrait", "Religious", "Roman", "Rugs"]),
]
UPLIFTS = [("Polished", 20), ("Old technique", 50), ("Custom", 30)]
SHIPPING = 100          # per m², deducted where the client arranges freight

SRC = Path(__file__).resolve().parent.parent / "src" / "price-list.html"


def rate(base, pct):
    """Half-up to the dollar — two of these land on an exact half."""
    factor = Decimal(1) + Decimal(pct) / 100
    return int((Decimal(base) * factor).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def money(n):
    return "$" + format(n, ",")


def escape(name):
    return name.replace("&", "&amp;")


def table(less=0):
    heads = "".join(
        '<th class="fig">%s<span>+%d%%</span></th>' % (label, pct) for label, pct in UPLIFTS
    )
    out = ['<table class="rates bands">',
           '      <tr><th>Categories</th><th class="fig">Normal</th>%s</tr>' % heads]
    for base, cats in BANDS:
        figs = [base] + [rate(base, pct) for _, pct in UPLIFTS]
        cells = "".join('<td class="fig">%s</td>' % money(f - less) for f in figs)
        out.append('      <tr><td><span class="cat">%s</span></td>%s</tr>'
                   % (", ".join(escape(c) for c in cats), cells))
    out.append("    </table>")
    return "    " + "\n".join(out)


def main():
    s = SRC.read_text()
    opens, closes = len(re.findall(r"<div\b", s)), s.count("</div>")

    # first table full rate, second less the freight — walk forward, never
    # search from the start again or the first table is written twice
    pos = 0
    for less in (0, SHIPPING):
        start = s.index('    <table class="rates bands">', pos)
        end = s.index("</table>", start) + len("</table>")
        new = table(less)
        s = s[:start] + new + s[end:]
        pos = start + len(new)

    assert len(re.findall(r"<div\b", s)) == opens == closes == s.count("</div>")
    assert s.count("<table") == s.count("</table>") == 2
    SRC.write_text(s)
    print("rates written: %d categories in %d bands" % (sum(len(c) for _, c in BANDS), len(BANDS)))


if __name__ == "__main__":
    main()
