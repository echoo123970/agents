#!/usr/bin/env python3
"""Tell a PDF reader to open each page whole, one at a time.

Without this a reader picks its own default, which on a phone is usually
fit-to-width — and a 338.7mm-wide page fitted to a narrow screen has to be
scrolled left and right to be read. Setting the layout to one page at a
time, and the open action to fit the whole page, makes the reader show a
spread that needs no scrolling at all.

    python3 tools/viewer.py dist/*.pdf
"""
import os
import sys

import pymupdf


def fix(path):
    doc = pymupdf.open(path)
    doc.set_pagelayout("SinglePage")     # one page at a time, no continuous scroll
    doc.set_pagemode("UseNone")          # no sidebar of thumbnails or bookmarks
    catalog = doc.pdf_catalog()
    # open on page one, scaled so the whole page is in view
    doc.xref_set_key(catalog, "OpenAction", "[%i 0 R /Fit]" % doc.page_xref(0))
    # and ask the reader not to override that with its own window fitting
    doc.xref_set_key(catalog, "ViewerPreferences",
                     "<</FitWindow true/CenterWindow true/DisplayDocTitle true>>")
    # a full rewrite rather than an appended update: some readers are fussy
    # about incremental saves, and this file has to open everywhere
    doc.save(path + ".tmp", garbage=3, deflate=True)
    doc.close()
    os.replace(path + ".tmp", path)
    return path


if __name__ == "__main__":
    targets = sys.argv[1:]
    if not targets:
        sys.exit("usage: viewer.py <pdf> [<pdf> …]")
    for t in targets:
        print("viewer: one page at a time, fitted —", fix(t))
