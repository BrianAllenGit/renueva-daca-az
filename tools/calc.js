// End-to-end checks of the calculator in headless Chromium (Docker only, see tools/dod.sh): results in every state, errors,
// axe on result states, overflow, no network requests, no storage, and the .ics download (content checked).
const http = require('http'), fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((q, s) => { let p = q.url.split('?')[0]; if (p.endsWith('/')) p += 'index.html'; const f = path.join('/site', path.normalize(p)); if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); });
const out = []; let fail = 0; const log = m => { console.log(m); out.push(m); }; const ok = (c, m) => { if (!c) fail++; log((c ? 'PASS ' : 'FAIL ') + m); };
const pad = n => String(n).padStart(2, '0');
(async () => {
  await new Promise(r => server.listen(8083, r)); const b = await chromium.launch(); const base = 'http://127.0.0.1:8083/';
  // dates relative to the container's clock (the page uses the device clock)
  const now = new Date(); const plus = n => { const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n); return { d: d.getDate(), m: d.getMonth() + 1, y: d.getFullYear() }; };
  const cases = [['before', plus(300)], ['inside', plus(135)], ['after', plus(60)], ['expired', plus(-30)]];
  for (const lang of ['es', 'en']) {
    for (const w of [375, 1280]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, acceptDownloads: true }); const p = await ctx.newPage(); const ext = [];
      p.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('blob:')) ext.push(r.url()); });
      p.on('console', m => { if (m.type() === 'error') ext.push('console: ' + m.text()); }); p.on('pageerror', e => ext.push('pageerror ' + e));
      await p.goto(base + (lang === 'en' ? '?lang=en' : ''));
      for (const [name, dt] of cases) {
        await p.fill('#f-day', String(dt.d)); await p.selectOption('#f-month', String(dt.m)); await p.fill('#f-year', String(dt.y)); await p.click('#calc button[type=submit]');
        const txt = await p.locator('#result').innerText();
        const hasBtn = await p.locator('#ics-btn').count();
        ok(txt.length > 20 && (name === 'before' || name === 'inside' ? hasBtn === 1 : hasBtn === 0), `${lang} ${w}px state ${name}: result shown, calendar button ${hasBtn ? 'present' : 'absent'}`);
        const res = await p.evaluate(async (src) => { if (!window.axe) { (0, eval)(src); } return (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map(v => v.id + ':' + v.nodes.length); }, axeSrc).catch(e => ['axe-error ' + e]);
        ok(res.length === 0, `axe ${lang} ${w}px ${name} state: ${res.length} violations ${res.join(',')}`);
        const o = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); ok(o[0] <= o[1], `no horizontal scroll ${lang} ${w}px ${name}`);
        if (w === 375 && name === 'before') await p.screenshot({ path: `/out/calc-${lang}-375.png`, fullPage: true });
        if (w === 1280 && name === 'inside') await p.screenshot({ path: `/out/calc-${lang}-1280.png`, fullPage: true });
      }
      // invalid input
      for (const [d, m, y] of [['31', '2', '2027'], ['', '6', '2027'], ['15', '', '2027'], ['15', '6', 'abc'], ['0', '1', '2027'], ['15', '6', '1999']]) {
        await p.fill('#f-day', d); await p.selectOption('#f-month', m); await p.fill('#f-year', y); await p.click('#calc button[type=submit]');
        const e = await p.locator('#f-err').innerText(); const r = await p.locator('#result').innerText();
        ok(e.length > 10 && r.trim() === '', `${lang} ${w}px invalid ${d}/${m}/${y}: error shown, no result`);
      }
      // keyboard-only: Enter in a field submits
      await p.fill('#f-day', String(plus(200).d)); await p.selectOption('#f-month', String(plus(200).m)); await p.fill('#f-year', String(plus(200).y)); await p.press('#f-year', 'Enter');
      ok((await p.locator('#result').innerText()).length > 20, `${lang} ${w}px Enter key submits`);
      if (w === 375) {
        const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#ics-btn')]);
        const f = await dl.path(); const txt = fs.readFileSync(f, 'utf8');
        ok(/^BEGIN:VCALENDAR\r\n/.test(txt) && /END:VCALENDAR\r\n$/.test(txt), `${lang} ics download ${dl.suggestedFilename()}: valid wrapper`);
        const n = (txt.match(/BEGIN:VEVENT/g) || []).length; ok(n >= 2 && n <= 3, `${lang} ics has ${n} events (2 or 3)`);
        ok(/DTSTART;VALUE=DATE:\d{8}/.test(txt) && /TRIGGER:PT9H/.test(txt), `${lang} ics: all-day dates and alarms`);
        ok((await p.locator('#ics-done').innerText()).length > 10, `${lang} ics: confirmation shown`);
        fs.writeFileSync(`/out/sample-${lang}.ics`, txt);
      }
      const store = await p.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length, ck: document.cookie.length }));
      ok(store.ls === 0 && store.ss === 0 && store.ck === 0, `${lang} ${w}px nothing stored: ${JSON.stringify(store)}`);
      ok(ext.length === 0, `${lang} ${w}px no external requests, no console errors ${ext.join(' | ')}`);
      await ctx.close();
    }
  }
  // paused status: the page must show no dates
  { const c = await b.newContext(); const p = await c.newPage(); await p.route('**/index.html', r => r.fulfill({ status: 200, contentType: 'text/html', body: fs.readFileSync('/site/index.html', 'utf8').replace('data-renewals="accepting"', 'data-renewals="paused"') }));
    await p.goto(base + 'index.html'); await p.fill('#f-day', '30'); await p.selectOption('#f-month', '6'); await p.fill('#f-year', '2030'); await p.click('#calc button[type=submit]');
    const t = await p.locator('#result').innerText(); ok(/USCIS/.test(t) && !/2030|opens|abre/.test(t) && (await p.locator('#ics-btn').count()) === 0, 'status not "accepting": no dates, no calendar button'); await c.close(); }
  // no JavaScript: both quotes and the form are in the static HTML, USCIS text visible
  { const c = await b.newContext({ javaScriptEnabled: false }); const p = await c.newPage(); await p.goto(base); const t = await p.evaluate(() => document.body.innerText); ok(/120 and 150 days/.test(t) && /entre 120 y 150 días/.test(t) && /noscript|JavaScript/i.test(t), 'JavaScript off: USCIS timing quote (EN and ES) and the JavaScript notice are visible'); await c.close(); }
  log(fail ? `CALC FAIL (${fail})` : 'CALC PASS'); fs.writeFileSync('/out/calc.txt', out.join('\n') + '\n'); await b.close(); server.close(); process.exit(fail ? 1 : 0);
})();
