#!/usr/bin/env python3
"""Write the rate tables into src/price-list.html from the bands below.

The price list carries the same rates twice — once with shipping in them,
once without — so a band edited by hand means two places to keep in step.
BANDS holds each band's rate either way, because the freight taken off is
not the same in every band, and each table's uplifts are worked from the
base on that page, which is what keeps the +20% / +50% / +30% column heads
true on both.

    python3 tools/rates.py

Categories are listed alphabetically within a band.
"""
import re
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

# rate per m² with shipping, the same without it, then the categories
BANDS = [
    (500, 400, ["Sheets"]),
    (900, 800, ["Abstract", "Geometric", "Logos", "Patterns"]),
    (950, 830, ["Animals", "Birds & butterflies", "Borders", "Flowers & trees",
                "Food", "Landmark", "Landscape", "Nautical"]),
    (980, 850, ["Portrait", "Religious", "Roman", "Rugs"]),
]
UPLIFTS = [("Polished", 20), ("Old technique", 50), ("Custom", 30)]

SRC = Path(__file__).resolve().parent.parent / "src" / "price-list.html"


def rate(base, pct):
    """Half-up to the dollar — some of these land on an exact half."""
    factor = Decimal(1) + Decimal(pct) / 100
    return int((Decimal(base) * factor).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def money(n):
    return "$" + format(n, ",")


def escape(name):
    return name.replace("&", "&amp;")


def table(shipped=True):
    heads = "".join(
        '<th class="fig">%s<span>+%d%%</span></th>' % (label, pct) for label, pct in UPLIFTS
    )
    out = ['<table class="rates bands">',
           '      <tr><th>Categories</th><th class="fig">Normal</th>%s</tr>' % heads]
    for with_freight, without_freight, cats in BANDS:
        base = with_freight if shipped else without_freight
        figs = [base] + [rate(base, pct) for _, pct in UPLIFTS]
        cells = "".join('<td class="fig">%s</td>' % money(f) for f in figs)
        out.append('      <tr><td><span class="cat">%s</span></td>%s</tr>'
                   % (", ".join(escape(c) for c in cats), cells))
    out.append("    </table>")
    return "    " + "\n".join(out)


def main():
    s = SRC.read_text()
    opens, closes = len(re.findall(r"<div\b", s)), s.count("</div>")

    # the first table is the shipped rate, the second the rate without it —
    # walk forward, never search from the start again or the first table is
    # written twice
    pos = 0
    for shipped in (True, False):
        start = s.index('    <table class="rates bands">', pos)
        end = s.index("</table>", start) + len("</table>")
        new = table(shipped)
        s = s[:start] + new + s[end:]
        pos = start + len(new)

    assert len(re.findall(r"<div\b", s)) == opens == closes == s.count("</div>")
    assert s.count("<table") == s.count("</table>") == 2
    SRC.write_text(s)
    print("rates written: %d categories in %d bands" % (sum(len(b[2]) for b in BANDS), len(BANDS)))


if __name__ == "__main__":
    main()
