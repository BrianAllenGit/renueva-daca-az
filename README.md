# Renueva tu DACA

A free, ad-free, zero-tracking, Spanish-first page (Spanish and English). You enter the date your DACA expires; the page shows, as plain dates, the window USCIS recommends for filing a renewal (150 to 120 days before that date) and can make a calendar file (.ics) with 2 or 3 reminders. Everything runs in your browser: nothing is stored or sent.

Status: private draft. Not published. Planned address once shipped: https://brianallengit.github.io/renueva-daca-az/

## What the page does

1. Quotes USCIS's current DACA status statement word for word at the top, with the date USCIS shows on the page (and the date we read it).
2. One input (day, month, year of the expiration date on the Form I-797 approval notice, as USCIS says). One output: the dates the window opens and closes, how many days are left, and reminders.
3. "Add to my calendar" builds the .ics in the browser (Blob download, no server).
4. Quotes the USCIS timing recommendation word for word (English, and USCIS's own Spanish).
5. Links: USCIS DACA page, Form I-821D page, USCIS fees page, USCIS litigation information, EOIR free legal service lists, AZLawHelp.

If the date has passed, or the recommended window has passed, the page says so and sends people to USCIS and free legal help; it gives no advice of its own. If USCIS stops saying that renewals are accepted, set `RENEWALS` in `tools/build.py` (it becomes `data-renewals` on the page) and the calculator shows no dates, only a pointer to the USCIS alert.

## No legal wording is written by us

Status and timing text are quoted unchanged from USCIS (`tools/quotes.json`, built from pages saved in `tools/captures/`). `python3 tools/verify_quotes.py` proves each quote is a word for word match of its capture and is on the page. The Spanish labels we wrote are listed in [docs/NEEDS-NATIVE-READ.md](docs/NEEDS-NATIVE-READ.md). Sources, terms and what was left out: [docs/SOURCES.md](docs/SOURCES.md).

## Date logic

`window.js` is a small pure module (calendar dates only, no clock, no time zones, no Date object) with tests: `node --test tests/window.test.js` (14 tests: leap years, month and year ends, a past date, today inside the window, invalid input, an every-day oracle check against JavaScript Date in UTC, and the .ics format).

## Privacy promise

No cookies, no localStorage, no accounts, no forms sent, no analytics, no ads, no third-party fonts or scripts. A strict Content Security Policy blocks every outside request. The language choice lives only in the page address (`?lang=en`). The date you type is never sent anywhere. GitHub Pages, the planned host, may keep standard visit logs the page cannot see.

## Checks (all in Docker)

```
python3 tools/extract_quotes.py && python3 tools/build.py && python3 tools/verify_quotes.py
node --test tests/window.test.js
./tools/audit.sh    # axe, overflow, screenshots
./tools/dod.sh      # icons, head and JSON-LD validation, keyboard, calculator end to end, Lighthouse
```

Evidence: [docs/DEFINITION-OF-DONE.md](docs/DEFINITION-OF-DONE.md), [docs/screenshots](docs/screenshots), [docs/lighthouse](docs/lighthouse). `tools/fetch/` has the capture scripts (headless Chromium in Docker; uscis.gov returns 403 to plain fetches). Re-capture and re-run before shipping: court rulings change DACA often.

## Deploy to GitHub Pages (only when the owner says so)

1. Make the repository public. 2. Settings, Pages, branch `main`, folder `/ (root)`. 3. If the address changes, update `SITE_URL` in `tools/build.py` and rebuild.

## License

MIT for the code and the page's own wording, see `LICENSE`. Quoted USCIS text is a US government work (public domain). USCIS and other organizations own their names; this page is not affiliated with them.
