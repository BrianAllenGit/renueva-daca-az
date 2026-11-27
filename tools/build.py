#!/usr/bin/env python3
"""Builds index.html, sitemap.xml, llms.txt, manifest, docs/SOURCES.md and docs/NEEDS-NATIVE-READ.md from one place.

Run: python3 tools/extract_quotes.py && python3 tools/build.py && python3 tools/verify_quotes.py
No dependencies. Output files are committed, so the site has no build step.
Rule: no legal or eligibility wording on the page is written by us. Quoted text lives in tools/quotes.json (copied from captured
USCIS pages); everything else is a link, a calendar computation, or a short label (every Spanish string is listed in docs/NEEDS-NATIVE-READ.md).
"""
import html
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHECKED = "2026-11-27"
CHECKED_TXT = {"es": "27 de noviembre de 2026", "en": "November 27, 2026"}
SITE_URL = "https://brianallengit.github.io/renueva-daca-az/"
NAME = "Renueva tu DACA"
# What USCIS says today about renewals: "accepting" (USCIS continues to accept and process renewals) or anything else.
# If USCIS changes the status, change this AND re-capture the quotes; the page then hides the dates and says so (see app.js).
RENEWALS = "accepting"
E = html.escape
Q = json.load(open(os.path.join(ROOT, "tools", "quotes.json"), encoding="utf-8"))

T = {
    "title": "Renueva tu DACA: calcula cuándo presentar tu renovación",
    "title_en": "Renew your DACA: find the window to file your renewal",
    "desc": "Escribe la fecha en que vence tu DACA y mira el plazo que recomienda USCIS para renovar. Recordatorio para tu calendario. Sin rastreo. Español e inglés.",
    "desc_en": "Enter the date your DACA expires and see the renewal window USCIS recommends. Calendar reminder file. No tracking. Spanish and English.",
    "imgalt": "Renueva tu DACA: calcula el plazo para presentar tu renovación. Renew your DACA: find your filing window.",
}

LINKS = {
    "daca": ("https://www.uscis.gov/DACA", "https://www.uscis.gov/es/DACA", "Página de DACA de USCIS", "USCIS DACA page"),
    "i821d": ("https://www.uscis.gov/i-821d", "https://www.uscis.gov/es/i-821d", "Formulario I-821D en USCIS", "Form I-821D on USCIS"),
    "fees": ("https://www.uscis.gov/forms/filing-fees", "https://www.uscis.gov/es/formularios/tarifas-de-presentacion", "Tarifas de presentación de USCIS", "USCIS filing fees"),
    "lit": ("https://www.uscis.gov/humanitarian/consideration-of-deferred-action-for-childhood-arrivals-daca/daca-litigation-information-and-frequently-asked-questions",
            "https://www.uscis.gov/es/programas-humanitarios/consideracion-de-accion-diferida-para-los-llegados-en-la-infancia-daca/informacion-sobre-litigios-y-preguntas-frecuentes-acerca-de-daca",
            "Información de USCIS sobre litigios de DACA", "USCIS DACA litigation information"),
    "probono": ("https://www.justice.gov/eoir/list-pro-bono-legal-service-providers", "https://www.justice.gov/eoir/list-pro-bono-legal-service-providers",
                "Lista de servicios legales gratuitos del Departamento de Justicia (EOIR, en inglés)", "Department of Justice (EOIR) list of free legal service providers"),
    "roster": ("https://www.justice.gov/eoir/recognition-accreditation-roster-reports", "https://www.justice.gov/eoir/recognition-accreditation-roster-reports",
               "Listas de EOIR de organizaciones reconocidas y representantes acreditados (en inglés)", "EOIR lists of recognized organizations and accredited representatives"),
    "azlh": ("https://www.azlawhelp.org/", "https://www.azlawhelp.org/", "AZLawHelp: ayuda legal en Arizona", "AZLawHelp: legal help in Arizona"),
}
SPANISH_UI = []


def a(key, lang, cls="btn secondary"):
    en, es, les, len_ = LINKS[key]
    url, label = (es, les) if lang == "es" else (en, len_)
    if lang == "es":
        SPANISH_UI.append(label)
    lg = ' lang="en"' if (lang == "es" and key in ("probono", "roster")) else ""
    return '<a class="%s" href="%s" rel="noopener noreferrer"%s>%s</a>' % (cls, E(url, quote=True), lg, E(label))


def quote(key, label, cap_lang):
    q = Q[key]
    lang = q["lang"]
    pdate = q["page_date_label"].get(cap_lang, "")
    if cap_lang == "es":
        cap = 'Fuente: USCIS (Servicio de Ciudadanía e Inmigración de EE. UU.), <a href="%s" rel="noopener noreferrer">%s</a>. Aviso copiado de la página tal como se leyó el %s. USCIS muestra en esa página "Última Revisión/Actualización: %s".' % (E(q["url"]), E(q["url"]), CHECKED_TXT["es"], q["page_date"])
        if q["lang"] == "en":
            cap = 'Fuente: USCIS, <a href="%s" rel="noopener noreferrer">%s</a>, texto original en inglés, leído el %s.' % (E(q["url"]), E(q["url"]), CHECKED_TXT["es"])
    else:
        cap = 'Source: U.S. Citizenship and Immigration Services (USCIS), <a href="%s" rel="noopener noreferrer">%s</a>. Alert copied from the page as read on %s. USCIS shows "Last Reviewed/Updated: %s" on that page.' % (E(q["url"]), E(q["url"]), CHECKED_TXT["en"], q["page_date"])
        if q["lang"] == "es":
            cap = 'Source: USCIS, <a href="%s" rel="noopener noreferrer">%s</a>, USCIS\'s own Spanish page, read on %s.' % (E(q["url"]), E(q["url"]), CHECKED_TXT["en"])
    if cap_lang == "es":
        SPANISH_UI.append(label)
        SPANISH_UI.append(cap)
    return ('<figure class="quote" lang="%s"><p class="qlabel" lang="%s">%s</p><div class="qbody"><h3 lang="%s">%s</h3><p>%s</p></div>'
            '<figcaption lang="%s">%s</figcaption></figure>') % (lang, cap_lang, E(label), lang, E(q["title"]), E(q["text"]), cap_lang, cap)


def es(s):
    SPANISH_UI.append(s)
    return s


ES_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
EN_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
months_html = "".join('<option value="%d">%s / %s</option>' % (i + 1, ES_MONTHS[i], EN_MONTHS[i]) for i in range(12))
SPANISH_UI.append("Meses del selector: " + ", ".join(ES_MONTHS))


SECTION_STRINGS = {
    "es": {
        "lead": "Escribe la fecha en que vence tu DACA y mira el plazo que USCIS recomienda para presentar la renovación.",
        "status_h": "Estado de DACA según USCIS",
        "status_p": "Esto es lo que USCIS dice hoy en su página de DACA. Se copia sin cambios.",
        "status_hint": "La fecha de \"Última Revisión/Actualización\" de la página de USCIS es 24 de enero de 2025. Los tribunales cambian las reglas con frecuencia: antes de presentar nada, lee la página de USCIS de hoy.",
        "calc_h": "Calcula tu plazo",
        "calc_p": "La fecha de vencimiento está en tu Formulario I-797 de aprobación de DACA, que es la fecha que usa USCIS. Escribe el día, elige el mes y escribe el año.",
        "day": "Día", "month": "Mes", "year": "Año",
        "go": "Calcular mi plazo",
        "errors_exp": "Revisa la fecha: escribe un día, un mes y un año que existan (por ejemplo, 30 de junio de 2027).",
        "timing_h": "Cuándo presentar la renovación, según USCIS",
        "timing_p": "De aquí sale el plazo de arriba. Se copia sin cambios.",
        "links_h": "Páginas oficiales",
        "links_p": "Estas páginas son de USCIS. Ahí están las reglas, el formulario y los costos actuales.",
        "legal_h": "Ayuda legal gratuita o de bajo costo",
        "legal_p": "Antes de presentar tu renovación, puedes hablar con un abogado o un representante acreditado. Estas listas oficiales y de Arizona te ayudan a encontrarlos.",
        "about_h": "Sobre esta página",
    },
    "en": {
        "lead": "Enter the date your DACA expires and see the window USCIS recommends for filing your renewal.",
        "status_h": "DACA status according to USCIS",
        "status_p": "This is what USCIS says today on its DACA page. It is copied without changes.",
        "status_hint": "The \"Last Reviewed/Updated\" date on the USCIS page is January 24, 2025. Courts change the rules often: before you file anything, read today's USCIS page.",
        "calc_h": "Find your window",
        "calc_p": "The expiration date is on your Form I-797 DACA approval notice, the date USCIS uses. Type the day, pick the month, type the year.",
        "day": "Day", "month": "Month", "year": "Year",
        "go": "Show my window",
        "errors_exp": "Check the date: enter a day, month and year that exist (for example, June 30, 2027).",
        "timing_h": "When to file a renewal, according to USCIS",
        "timing_p": "The window above comes from this. It is copied without changes.",
        "links_h": "Official pages",
        "links_p": "These pages are from USCIS. The current rules, the form and the costs are there.",
        "legal_h": "Free or low-cost legal help",
        "legal_p": "Before you file your renewal you can talk to a lawyer or an accredited representative. These official and Arizona lists help you find one.",
        "about_h": "About this page",
    },
}

ABOUT = {
    "es": [
        "<strong>No es asesoría legal.</strong> Esta página solo hace una cuenta de calendario con la regla que USCIS publica y enlaza a páginas oficiales. No dice si puedes renovar ni si tu caso es sencillo.",
        "<strong>No guarda ni envía nada.</strong> La fecha que escribes se queda en tu aparato: la cuenta se hace en tu navegador, sin servidor y sin conexiones a internet. No hay cookies, ni almacenamiento local, ni cuentas, ni anuncios, ni analíticas, ni letras o scripts de otros sitios.",
        "<strong>El archivo de calendario se crea en tu aparato.</strong> Al tocar el botón, tu navegador baja un archivo .ics que se arma ahí mismo. Después de eso, tu calendario lo maneja como cualquier otro archivo tuyo.",
        "<strong>Los plazos son un cálculo en días.</strong> Se cuentan días de calendario hacia atrás desde la fecha de vencimiento: 150 días para abrir y 120 días para cerrar, que es lo que dice la cita de USCIS. Si tu aparato muestra otra fecha, confía en la página de USCIS.",
        "Este sitio está alojado en GitHub Pages, que puede guardar registros estándar de visitas que nosotros no podemos ver ni controlar.",
    ],
    "en": [
        "<strong>This is not legal advice.</strong> This page only does a calendar calculation with the rule USCIS publishes and links to official pages. It does not say whether you can renew or whether your case is simple.",
        "<strong>Nothing is saved or sent.</strong> The date you type stays on your device: the calculation runs in your browser, with no server and no network requests. No cookies, no local storage, no accounts, no ads, no analytics, no fonts or scripts from other sites.",
        "<strong>The calendar file is made on your device.</strong> When you tap the button, your browser downloads an .ics file that is built right there. After that your calendar handles it like any other file of yours.",
        "<strong>The window is a count of days.</strong> Calendar days are counted back from the expiration date: 150 days for the opening and 120 days for the closing, as the USCIS quote says. If your device shows a different date, trust the USCIS page.",
        "This site is hosted on GitHub Pages, which may keep standard visit logs that we cannot see or control.",
    ],
}


def body(lang):
    s = SECTION_STRINGS[lang]
    if lang == "es":
        for v in s.values():
            SPANISH_UI.append(v)
    L = lambda k: s[k]
    lg = "" if lang == "es" else ' lang="en"'
    out = ['<div class="%s wrap"%s>' % (lang, lg)]
    out.append('<p class="lead">%s</p>' % E(L("lead")))
    sk = "status_" + lang
    out.append('<section class="panel status" id="%s-status" tabindex="-1" aria-labelledby="%s-status-h"><h2 id="%s-status-h">%s</h2><p>%s</p>%s<p class="hint">%s</p><div class="calls">%s</div></section>' % (
        lang, lang, lang, E(L("status_h")), E(L("status_p")), quote(sk, "Cita de USCIS, palabra por palabra y sin cambios" if lang == "es" else "Quote from USCIS, word for word and unchanged", lang), E(L("status_hint")), a("daca", lang, "btn primary")))
    out.append('<section class="panel" id="%s-calc" tabindex="-1" aria-labelledby="%s-calc-h"><h2 id="%s-calc-h">%s</h2><p>%s</p><div class="calc-slot" data-lang="%s"></div></section>' % (lang, lang, lang, E(L("calc_h")), E(L("calc_p")), lang))
    out.append('<section class="panel" id="%s-timing" tabindex="-1" aria-labelledby="%s-timing-h"><h2 id="%s-timing-h">%s</h2><p>%s</p>%s</section>' % (
        lang, lang, lang, E(L("timing_h")), E(L("timing_p")), quote("timing_" + lang, "Cita de USCIS, palabra por palabra y sin cambios" if lang == "es" else "Quote from USCIS, word for word and unchanged", lang)))
    out.append('<section class="panel" id="%s-links" tabindex="-1" aria-labelledby="%s-links-h"><h2 id="%s-links-h">%s</h2><p>%s</p><div class="calls">%s%s%s%s</div></section>' % (
        lang, lang, lang, E(L("links_h")), E(L("links_p")), a("daca", lang), a("i821d", lang), a("fees", lang), a("lit", lang)))
    out.append('<section class="panel" id="%s-legal" tabindex="-1" aria-labelledby="%s-legal-h"><h2 id="%s-legal-h">%s</h2><p>%s</p><div class="calls">%s%s%s</div></section>' % (
        lang, lang, lang, E(L("legal_h")), E(L("legal_p")), a("probono", lang), a("roster", lang), a("azlh", lang)))
    acc = quote("accuracy_en", "Aviso de USCIS sobre la exactitud de su sitio (en inglés), palabra por palabra" if lang == "es" else "USCIS notice about the accuracy of its site, word for word", lang)
    items = "".join("<li>%s</li>" % x for x in ABOUT[lang])
    if lang == "es":
        SPANISH_UI.extend(ABOUT["es"])
    out.append('<section class="panel" id="%s-about" tabindex="-1" aria-labelledby="%s-about-h"><h2 id="%s-about-h">%s</h2><ul class="list">%s</ul>%s</section>' % (lang, lang, lang, E(L("about_h")), items, acc))
    out.append("</div>")
    return "\n".join(out)


CALC_FORM = """<form id="calc" class="calc" novalidate autocomplete="off">
  <div class="fields">
    <div class="field"><label for="f-day"><span class="es">%(es_day)s</span><span class="en" lang="en">Day</span></label><input id="f-day" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" aria-describedby="f-err"></div>
    <div class="field"><label for="f-month"><span class="es">%(es_month)s</span><span class="en" lang="en">Month</span></label><select id="f-month" autocomplete="off" aria-describedby="f-err"><option value="">- / -</option>%(months)s</select></div>
    <div class="field"><label for="f-year"><span class="es">%(es_year)s</span><span class="en" lang="en">Year</span></label><input id="f-year" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-describedby="f-err"></div>
  </div>
  <p id="f-err" class="err" role="alert"></p>
  <button type="submit" class="btn primary big"><span class="es">%(es_go)s</span><span class="en" lang="en">%(en_go)s</span></button>
</form>
<div id="result" class="result" aria-live="polite"></div>"""


def build_page():
    es_body = body("es")
    en_body = body("en")
    es_s, en_s = SECTION_STRINGS["es"], SECTION_STRINGS["en"]
    form = CALC_FORM % {"es_day": es_s["day"], "es_month": es_s["month"], "es_year": es_s["year"], "months": months_html,
                        "es_go": es_s["go"], "en_go": en_s["go"]}
    # the form lives once, in the Spanish calculator panel slot; the English slot stays empty and the form is shared
    es_body = es_body.replace('<div class="calc-slot" data-lang="es"></div>', "")
    en_body = en_body.replace('<div class="calc-slot" data-lang="en"></div>', "")
    # shared calculator panel placed between status and timing, outside the language wrappers
    calc_panel = ('<section class="panel calcpanel" id="calc-panel" tabindex="-1" aria-labelledby="calc-h">'
                  '<h2 id="calc-h"><span class="es">%s</span><span class="en" lang="en">%s</span></h2>'
                  '<p><span class="es">%s</span><span class="en" lang="en">%s</span></p>%s'
                  '<noscript><p class="notice-js"><span class="es">%s</span><span class="en" lang="en">%s</span></p></noscript></section>') % (
        E(es_s["calc_h"]), E(en_s["calc_h"]), E(es_s["calc_p"]), E(en_s["calc_p"]), form,
        E("Esta calculadora necesita JavaScript. Sin JavaScript, la regla de USCIS está copiada más abajo."),
        E("This calculator needs JavaScript. Without JavaScript, the USCIS rule is copied below."))
    SPANISH_UI.append("Esta calculadora necesita JavaScript. Sin JavaScript, la regla de USCIS está copiada más abajo.")
    # split each language body: status first, then shared calculator, then the rest
    def split(b, lang):
        marker = '<section class="panel" id="%s-calc"' % lang
        i = b.index(marker)
        j = b.index("</section>", i) + len("</section>")
        return b[:i] + b[j:]
    es_body, en_body = split(es_body, "es"), split(en_body, "en")
    # put the calculator after the status panel of the Spanish block and make it its own top-level block
    def cut_after_status(b):
        k = b.index("</section>") + len("</section>")
        return b[:k], b[k:]
    es_a, es_b = cut_after_status(es_body)
    en_a, en_b = cut_after_status(en_body)
    # structure: [es status][en status] [shared calculator] [es rest][en rest]
    # the language wrappers close after their last section, so build each wrapper in two parts
    top_es = es_a + "\n</div>"
    top_en = en_a + "\n</div>"
    mid = '<div class="wrap">%s</div>' % calc_panel
    rest_es = '<div class="es wrap">' + es_b
    rest_en = '<div class="en wrap" lang="en">' + en_b
    main = "\n".join([top_es, top_en, mid, rest_es, rest_en])

    ld = {
        "@context": "https://schema.org",
        "@graph": [
            {"@type": "Organization", "@id": SITE_URL + "#org", "name": NAME, "url": SITE_URL, "logo": SITE_URL + "apple-touch-icon.png",
             "description": "Free, ad-free, zero-tracking page in Spanish and English that computes the DACA renewal window USCIS recommends."},
            {"@type": "WebSite", "@id": SITE_URL + "#website", "url": SITE_URL, "name": NAME, "description": T["desc"], "inLanguage": ["es", "en"], "publisher": {"@id": SITE_URL + "#org"}},
            {"@type": "WebPage", "@id": SITE_URL + "#webpage", "url": SITE_URL, "name": T["title"], "description": T["desc"], "inLanguage": ["es", "en"],
             "isPartOf": {"@id": SITE_URL + "#website"}, "publisher": {"@id": SITE_URL + "#org"}, "dateModified": CHECKED,
             "primaryImageOfPage": {"@type": "ImageObject", "url": SITE_URL + "og-image.png", "width": 1200, "height": 630},
             "about": {"@type": "Thing", "name": "The window USCIS recommends for filing a DACA renewal"}},
            {"@type": "SoftwareApplication", "@id": SITE_URL + "#app", "name": "Renueva tu DACA", "applicationCategory": "UtilitiesApplication", "operatingSystem": "Any (web browser)",
             "url": SITE_URL, "inLanguage": ["es", "en"], "isAccessibleForFree": True, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
             "description": "Computes, in the browser only, the window USCIS recommends for filing a DACA renewal and creates a calendar reminder file on the device."},
        ],
    }
    SPANISH_UI.extend([T["title"], T["desc"], T["imgalt"]])
    page = """<!DOCTYPE html>
<html lang="es" data-renewals="%(renewals)s">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="%(site)s">
<link rel="alternate" hreflang="es" href="%(site)s">
<link rel="alternate" hreflang="en" href="%(site)s">
<link rel="alternate" hreflang="x-default" href="%(site)s">
<meta property="og:site_name" content="%(name)s">
<meta property="og:title" content="%(title)s">
<meta property="og:description" content="%(desc)s">
<meta property="og:image" content="%(site)sog-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="%(imgalt)s">
<meta property="og:url" content="%(site)s">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_US">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="%(title)s">
<meta name="twitter:description" content="%(desc)s">
<meta name="twitter:image" content="%(site)sog-image.png">
<meta name="twitter:image:alt" content="%(imgalt)s">
<meta name="theme-color" content="#1d4e89">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<script type="application/ld+json">%(ld)s</script>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; manifest-src 'self'; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<link rel="stylesheet" href="style.css">
<noscript><link rel="stylesheet" href="noscript.css"></noscript>
</head>
<body>
<a class="skip es" href="#main">Ir al contenido</a>
<a class="skip en" href="#main" lang="en">Skip to content</a>
<header class="top">
  <div class="brand">
    <h1 class="es">Renueva tu DACA <span class="where">Calculadora del plazo</span></h1>
    <h1 class="en" lang="en">Renew your DACA <span class="where">Window calculator</span></h1>
  </div>
  <div class="langs no-print" role="group" aria-label="Idioma / Language">
    <button type="button" id="lang-es" data-lang="es" lang="es" aria-label="ES, Español" aria-pressed="true">ES</button>
    <button type="button" id="lang-en" data-lang="en" lang="en" aria-label="EN, English" aria-pressed="false">EN</button>
  </div>
</header>

<main id="main" tabindex="-1">
%(main)s
</main>

<footer>
  <p class="es">Este sitio no tiene analíticas y no guarda nada. Lo que escribes no sale de tu aparato. Está alojado en GitHub Pages, que puede guardar registros estándar de visitas que nosotros no podemos ver ni controlar.</p>
  <p class="en" lang="en">This site has no analytics and saves nothing. What you type never leaves your device. It is hosted on GitHub Pages, which may keep standard visit logs that we cannot see or control.</p>
  <p>Renueva tu DACA · MIT · <span class="es">No es asesoría legal</span><span class="en" lang="en">Not legal advice</span></p>
</footer>
<script src="window.js"></script>
<script src="app.js"></script>
</body>
</html>
""" % {"renewals": RENEWALS, "title": E(T["title"]), "desc": E(T["desc"]), "site": SITE_URL, "name": E(NAME), "imgalt": E(T["imgalt"]),
       "ld": json.dumps(ld, ensure_ascii=False, indent=1), "main": main}
    SPANISH_UI.extend(["Ir al contenido", "Calculadora del plazo", "Este sitio no tiene analíticas y no guarda nada. Lo que escribes no sale de tu aparato.", "No es asesoría legal"])
    return page


def write(path, text):
    p = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(text)


write("index.html", build_page())
write("sitemap.xml", """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>%(s)s</loc>
    <lastmod>%(d)s</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="%(s)s"/>
    <xhtml:link rel="alternate" hreflang="en" href="%(s)s"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="%(s)s"/>
  </url>
</urlset>
""" % {"s": SITE_URL, "d": CHECKED})
write("robots.txt", "User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % SITE_URL)
write("manifest.webmanifest", json.dumps({
    "name": "Renueva tu DACA", "short_name": "Renueva DACA", "description": "The window USCIS recommends for a DACA renewal. Español e inglés.", "lang": "es",
    "start_url": "./", "scope": "./", "display": "standalone", "background_color": "#f4f6f8", "theme_color": "#1d4e89",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}, {"src": "favicon.svg", "sizes": "any", "type": "image/svg+xml"}]}, indent=2, ensure_ascii=False) + "\n")
write("llms.txt", """# Renueva tu DACA

> A free, ad-free, zero-tracking one-page calculator in Spanish and English. You enter the date your DACA expires; it shows the window USCIS recommends for filing a renewal (150 to 120 days before that date) and can create a calendar reminder file (.ics) on your own device. Everything runs in the browser: nothing is stored or sent. It gives general information, not legal advice. All status and timing wording is quoted word for word from USCIS, with its page date, read on %(d)s.

## What it is
- One input: the expiration date on your Form I-797 DACA approval notice. One output: the dates the window opens and closes, and a calendar file with 2 or 3 reminders.
- The current DACA status as USCIS states it, copied unchanged (USCIS page "Last Reviewed/Updated" 01/24/2025).
- The USCIS renewal timing recommendation, copied unchanged, in English and in USCIS's own Spanish.
- Links to the USCIS DACA page, the Form I-821D page, the USCIS filing fees page, USCIS litigation information, the EOIR free legal service lists, and AZLawHelp.

## Who it is for
- People with DACA, and their families, who want to know when to file a renewal.

## How to use it
- Open the page, pick Spanish or English (English at ?lang=en), type the day, month and year, press the button. It needs JavaScript for the calculation; the USCIS quotes are in the static HTML.

## Key links
- Page: %(s)s
- English view: %(s)s?lang=en

## Sources
- USCIS DACA page: https://www.uscis.gov/DACA (Spanish: https://www.uscis.gov/es/DACA)
- USCIS Form I-821D: https://www.uscis.gov/i-821d
- USCIS filing fees: https://www.uscis.gov/forms/filing-fees
- EOIR free legal services: https://www.justice.gov/eoir/list-pro-bono-legal-service-providers
- AZLawHelp: https://www.azlawhelp.org/

## Limits
- Not legal advice. The USCIS page may lag behind court rulings. Rules, fees and processing change: read the USCIS page and talk to a licensed attorney or DOJ-accredited representative about your own case.
""" % {"d": CHECKED, "s": SITE_URL})

# docs
SRC = """# Sources and terms

Read %(d)s with headless Chromium in Docker (plain fetches to uscis.gov return 403). Captures are in `tools/captures/`; `python3 tools/verify_quotes.py` proves every quote is word for word in them.

| Source | What we took | Page date shown by the source |
|---|---|---|
| [USCIS DACA page, English](https://www.uscis.gov/DACA) | Two alerts copied word for word: "Important Update on Deferred Action for Childhood Arrivals" (status) and the second paragraph of "Important Reminders Regarding the DACA Renewal Process" (timing). | Last Reviewed/Updated 01/24/2025 |
| [USCIS DACA page, Spanish](https://www.uscis.gov/es/DACA) | The same two alerts in USCIS's own Spanish. The first paragraph of the Spanish renewal alert has a typo in USCIS's text ("dentro en120 días"); it is not quoted, only the timing paragraph is. | Última Revisión/Actualización 01/24/2025 |
| [USCIS website policies](https://www.uscis.gov/website-policies) | One sentence (Accuracy) copied, English only. It also says "If there are differences between English and another language, the English version is the official version." | none |
| [USCIS Form I-821D page](https://www.uscis.gov/i-821d) (ES: /es/i-821d) | Link only. Same two alerts shown there. | 06/01/2026 (EN), 12/29/2025 (ES) |
| [USCIS filing fees](https://www.uscis.gov/forms/filing-fees) (ES: /es/formularios/tarifas-de-presentacion) | Link only. No fee amount is stated anywhere on our page. The page carries a litigation alert about fees; it was not read as a DACA rule. | 11/19/2026 |
| [USCIS DACA litigation information](https://www.uscis.gov/humanitarian/consideration-of-deferred-action-for-childhood-arrivals-daca/daca-litigation-information-and-frequently-asked-questions) | Link only. | 12/31/2024 |
| [EOIR list of pro bono legal service providers](https://www.justice.gov/eoir/list-pro-bono-legal-service-providers) and [EOIR rosters](https://www.justice.gov/eoir/recognition-accreditation-roster-reports) | Links only, as used in the sibling site verifica-tu-ayuda-az. | not re-read |
| [AZLawHelp](https://www.azlawhelp.org/) | Link only. | not read |

## Terms
- USCIS content is a work of the US government, public domain (17 U.S.C. 105). USCIS's own "Privacy and Legal Disclaimers" page is archived and states no reuse terms (read %(d)s); the public-domain basis is the statute, not a USCIS license. UNVERIFIED and for a human: whether to also credit USCIS in a standard way (we already name the source, link and date next to every quote).
- No text is copied from EOIR or AZLawHelp.

## What the page claims, and what it does not
- The window is 150 days to 120 days before the expiration date. Source: the USCIS timing paragraph ("between 120 and 150 days (4 to 5 months) before the expiration date located on your current Form I-797 DACA approval notice"). Days are counted as calendar days. USCIS gives "4 to 5 months" in parentheses; we use the day counts, which are the precise part.
- The input is the I-797 expiration date, as USCIS says. The brief said "EAD card date"; the two normally match but USCIS names the I-797, so the page names the I-797 (see NEEDS-HUMAN in DEFINITION-OF-DONE.md).
- The reminders (window opens, 7 days before it closes, last day) are our convenience choice, not a USCIS rule.
- Nothing about eligibility, fees, processing times or what to do when the window has passed is written by us.

## Left out on purpose
- Processing times, approval rates and backlogs: reported by advocates (for example the Forum Together explainer, October 2026) but not stated by USCIS on the pages read. The page quotes USCIS only.
- A Fifth Circuit ruling and the Texas work-authorization question: USCIS's captured alert (January 2025) is the status we quote. Advocates report later developments; the page says the USCIS page can lag and sends people to it and to free legal help.
""" % {"d": CHECKED}
write("docs/SOURCES.md", SRC)
seen = []
for s in SPANISH_UI:
    if s not in seen:
        seen.append(s)
write("docs/NEEDS-NATIVE-READ.md", "# Needs a native Spanish read\n\nEvery Spanish string we wrote (navigation labels, calculator labels and results, privacy text). Quoted USCIS Spanish is USCIS's own and is not on this list. Also in `app.js`: the result messages and the calendar reminder titles (see `window.js` TEXT and `app.js` MSG). Machine check only; a human reader has not seen any of it.\n\n" + "\n".join("- " + x for x in seen) + "\n")
print("built", len(seen), "Spanish strings")
