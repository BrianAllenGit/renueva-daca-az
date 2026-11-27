# Website definition of done: evidence

Mirrors Brian's website definition of done (vault: `me/working-together/web-definition-of-done.md`). Run 2026-11-27 inside Docker only (Playwright 1.49.1 image, axe-core 4.10.2, Lighthouse 12.2.1). Re-run with `./tools/audit.sh` and `./tools/dod.sh`. Planned address (not live): https://brianallengit.github.io/renueva-daca-az/

Language approach: one page, one canonical URL, both languages in the same static HTML; `es`, `en`, `x-default` alternates all point to it, as in the sibling sites. `?lang=en` is a share link.

## 1. Accessibility
- [x] axe-core 0 violations, ES and EN at 375 and 1280, on the page (`docs/screenshots/audit-report.txt`, 45 rules passed) and on four calculator result states (before, inside, after, expired) in both languages and both widths (`docs/lighthouse/calc.txt`, 16 axe runs, 0 violations).
- [x] Keyboard: 18 tab stops per language, 0 without a visible focus indicator, no trap, skip link first, Enter in a field submits (`docs/lighthouse/extra.txt`, `calc.txt`).
- [x] One H1 per language, headings in order, landmarks, every input has a label, errors announced (`role="alert"`), results in a polite live region.
- [x] Contrast (axe), 0 tap targets under 44px at 320, 375, 768; inputs 56px tall.
- [x] reduced-motion and forced-colors screenshots in `docs/lighthouse/`. JavaScript off: both languages and both USCIS quotes visible, with a notice that the calculator needs JavaScript.
- [ ] Not machine-verifiable: real screen reader pass, native Spanish read, real-device phone test, a real calendar app importing the .ics on iPhone, Android and desktop.

## 2. Phone first
- [x] No horizontal scroll, nothing past the edge at 320, 375, 768 in ES and EN; also on every result state at 375 and 1280. Text-spacing overrides at 320 and 375 and 200% zoom equivalent: no overflow.

## 3. Languages
- [x] ES default, visible ES/EN switch, `lang` on `<html>` updates, hreflang es/en/x-default.

## 4. Search
- [x] Title 54 characters, description in range, canonical, robots meta, `robots.txt`, `sitemap.xml` with alternates (`docs/lighthouse/validate.txt`, 55 checks, 0 fail).
- [x] JSON-LD `@graph`: Organization, WebSite, WebPage, SoftwareApplication (the page is a real tool). Matches visible content. No FAQPage or HowTo. Run Google's Rich Results Test by hand at ship time.
- [x] Quotes, links and form are in the static HTML.

## 5. Link previews
- [x] Open Graph and Twitter tags complete; `og-image.png` 1200x630, under 1 MB, parsed from the built HTML. [ ] Platform debuggers by hand at ship time.

## 6. AI answers
- [x] Plain lead and `llms.txt` with summary, sources and limits; no "best" claims.

## 7. App polish
- [x] Favicon set, apple-touch-icon, theme-color, manifest, print styles.
- [x] Lighthouse mobile (Docker, local server): ES 100/100/100/100, EN 100/100/100/100 (performance, accessibility, best practices, SEO). Informational only: cache TTL, compression, minification depend on the host.

## 8. Trust and safety
- [x] Zero tracking, storage, ads, third-party requests: the calculator test fails on any external request, console error, or localStorage, sessionStorage or cookie use (0 seen). Strict CSP.
- [x] Quotes verified word for word against captures (`tools/verify_quotes.py`, 5 of 5, plus the USCIS page date). No legal wording written by us.
- [x] Date logic: 14 node:test tests pass in Docker (`docs/lighthouse/unit-tests.txt`).
- [x] No person named in the HTML or JSON-LD apart from the planned host.

## Needs a human (before shipping)
- [ ] Native Spanish read of `docs/NEEDS-NATIVE-READ.md` (and the result messages in `app.js`, calendar titles in `window.js`).
- [ ] Input label: USCIS names the date on the Form I-797 approval notice; the brief said the EAD card date. The page says I-797. Decide whether to also mention the EAD card (they normally match; not verified).
- [ ] The USCIS DACA page still says "Last Reviewed/Updated 01/24/2025" and its status alert is from January 2025, while advocate explainers (October 2026) report later developments. Re-read uscis.gov the day you ship and change `RENEWALS` if the status changed.
- [ ] Whether to keep the reminder choices (window opens, 7 days before it closes, last day) and the 9:00 alarm.
- [ ] Test the .ics on iPhone, Android and a desktop calendar.
- [ ] Rich Results Test, link debuggers, live-URL checks.
