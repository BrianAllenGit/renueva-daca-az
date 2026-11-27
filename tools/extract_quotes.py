#!/usr/bin/env python3
"""Builds tools/quotes.json from the USCIS pages captured in tools/captures/ (see tools/fetch/).

The quoted text is copied from the captured pages. Nothing is reworded. Only markup is touched: links become plain text,
non-breaking spaces become spaces, bold alert titles are dropped (the page gives its own label). tools/verify_quotes.py then
proves each quote is a word for word match of its capture and is on the page.

Usage: python3 tools/extract_quotes.py
"""
import html as H
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
CAP = os.path.join(HERE, "captures")
RETRIEVED = "2026-11-27"


def rd(name):
    with open(os.path.join(CAP, name), encoding="utf-8", errors="replace") as f:
        return f.read()


def paragraph(page, starts_with):
    """The one <p> that starts with the given text (after tags are stripped)."""
    for m in re.finditer(r"<p>(.*?)</p>", page, flags=re.S):
        inner = m.group(1)
        text = re.sub(r"<[^>]+>", "", inner)
        text = H.unescape(text).replace("\xa0", " ")
        if text.startswith(starts_with):
            return text
    raise SystemExit("paragraph not found: " + starts_with)


def squash(t):
    return re.sub(r"\s+", " ", t).strip()


EN = rd("daca_en.html")
ES = rd("daca_es.html")
quotes = {
    "status_en": {"lang": "en", "title": "ALERT: Important Update on Deferred Action for Childhood Arrivals",
                  "url": "https://www.uscis.gov/DACA", "page_date": "01/24/2025", "page_date_label": {"en": "January 24, 2025", "es": "24 de enero de 2025"},
                  "text": squash(paragraph(EN, "On Jan. 17, 2025"))},
    "status_es": {"lang": "es", "title": "AVISO: Actualización Importante sobre la Acción Diferida para los Llegados en la Infancia",
                  "url": "https://www.uscis.gov/es/DACA", "page_date": "01/24/2025", "page_date_label": {"en": "January 24, 2025", "es": "24 de enero de 2025"},
                  "text": squash(paragraph(ES, "El 17 de enero de 2025"))},
    "timing_en": {"lang": "en", "title": "ALERT: Important Reminders Regarding the DACA Renewal Process",
                  "url": "https://www.uscis.gov/DACA", "page_date": "01/24/2025", "page_date_label": {"en": "January 24, 2025", "es": "24 de enero de 2025"},
                  "text": squash(paragraph(EN, "As USCIS has long recommended"))},
    "timing_es": {"lang": "es", "title": "AVISO: Recordatorio Importante Acerca del Proceso de Renovación de DACA",
                  "url": "https://www.uscis.gov/es/DACA", "page_date": "01/24/2025", "page_date_label": {"en": "January 24, 2025", "es": "24 de enero de 2025"},
                  "text": squash(paragraph(ES, "Según USCIS ha recomendado"))},
}
# USCIS accuracy statement (English only; USCIS says the English version is the official one)
terms = squash(open(os.path.join(CAP, "terms_uscis.txt"), encoding="utf-8").read())
acc = "While we try to keep our online information timely and accurate, there may be a delay in updating our website after there have been changes to the law."
assert acc in terms
quotes["accuracy_en"] = {"lang": "en", "title": "Accuracy", "url": "https://www.uscis.gov/website-policies", "page_date": None, "page_date_label": {}, "text": acc}
for q in quotes.values():
    q["retrieved"] = RETRIEVED
with open(os.path.join(HERE, "quotes.json"), "w", encoding="utf-8") as f:
    json.dump(quotes, f, ensure_ascii=False, indent=1)
    f.write("\n")
print("wrote quotes.json", len(quotes), "quotes")
