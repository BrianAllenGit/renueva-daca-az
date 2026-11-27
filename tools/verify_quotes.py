#!/usr/bin/env python3
"""Proves every quote in tools/quotes.json (and so on the page) is a word for word match of a captured USCIS page.

Each quote: strip tags, unescape entities, collapse whitespace; the result must appear inside the captured page text (same
normalisation) and the exact quote text must appear in index.html. Exit 1 on any mismatch.
"""
import html as H
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CAP = os.path.join(HERE, "captures")
SOURCE = {"status_en": "daca_en.html", "status_es": "daca_es.html", "timing_en": "daca_en.html", "timing_es": "daca_es.html",
          "accuracy_en": "terms_uscis.txt"}


def norm(s):
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    s = re.sub(r"</(li|p|h\d|div|ul|ol|td|tr)>|<br\s*/?>", " ", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = H.unescape(s).replace("\xa0", " ")
    return re.sub(r"\s+", " ", s).strip()


def main():
    quotes = json.load(open(os.path.join(HERE, "quotes.json"), encoding="utf-8"))
    page = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    page_norm = norm(page)
    bad = 0
    for key, q in quotes.items():
        src = norm(open(os.path.join(CAP, SOURCE[key]), encoding="utf-8", errors="replace").read())
        txt = norm(q["text"])
        ok_src = txt in src
        n_page = page_norm.count(txt)
        ok_page = n_page >= 1
        print("%s %-12s %4d chars  in source: %s  on page: %dx" % ("PASS" if ok_src and ok_page else "FAIL", key, len(txt), ok_src, n_page))
        bad += 0 if ok_src and ok_page else 1
    # the page-date label we show must be the date USCIS shows on the captured page
    for lang, f in (("en", "daca_en.txt"), ("es", "daca_es.txt")):
        t = open(os.path.join(CAP, f), encoding="utf-8").read()
        ok = re.search(r"(Last Reviewed/Updated|Última Revisión/Actualización):\s*\n?\s*01/24/2025", t) is not None
        print("%s page date %s: USCIS shows 01/24/2025 in the capture" % ("PASS" if ok else "FAIL", lang))
        bad += 0 if ok else 1
    print("QUOTES: %d checked, %d failed" % (len(quotes), bad))
    sys.exit(1 if bad else 0)


main()
