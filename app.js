(function () {
  'use strict';
  // Nothing is stored and nothing is sent. The language choice lives only in the page address (?lang=en).
  // The calculation (window.js) runs here, in the browser. The calendar file is built here and handed to the browser as a download.
  var W = window.DacaWindow;
  var TITLES = { es: 'Renueva tu DACA: calcula cuándo presentar tu renovación', en: 'Renew your DACA: find the window to file your renewal' };
  var DESCS = {
    es: 'Escribe la fecha en que vence tu DACA y mira el plazo que recomienda USCIS para renovar. Recordatorio para tu calendario. Sin rastreo. Español e inglés.',
    en: 'Enter the date your DACA expires and see the renewal window USCIS recommends. Calendar reminder file. No tracking. Spanish and English.'
  };
  var MSG = {
    es: {
      err: 'Revisa la fecha: escribe un día, un mes y un año que existan (por ejemplo, 30 de junio de 2027).',
      yourDate: 'Tu DACA vence el',
      windowIs: 'El plazo que USCIS recomienda para presentar tu renovación es',
      from: 'del', to: 'al',
      before: function (n) { return 'El plazo todavía no abre. Abre en ' + n + (n === 1 ? ' día.' : ' días.'); },
      inside: function (n) { return 'Hoy estás dentro del plazo. Hasta el último día del plazo ' + (n === 0 ? 'es hoy.' : n === 1 ? 'queda 1 día.' : 'quedan ' + n + ' días.'); },
      after: 'El plazo que USCIS recomienda ya pasó, y tu fecha de vencimiento todavía no llega. Lee la página de USCIS de hoy y habla con ayuda legal gratuita.',
      expired: 'La fecha que escribiste ya llegó o ya pasó. Lee la página de USCIS de hoy y habla con ayuda legal gratuita.',
      cite: 'Esto sale de la cita de USCIS que está más abajo. Es lo que USCIS recomienda; no te da ni te quita ningún derecho.',
      paused: 'USCIS no dice que se estén aceptando renovaciones. No calculamos ningún plazo. Lee el aviso de USCIS arriba y la página de USCIS.',
      remTitle: 'Recordatorios para tu calendario',
      remKind: { opens: 'Abre el plazo', week: 'Falta una semana para que cierre', closes: 'Último día del plazo', today: 'Hoy, dentro del plazo' },
      btn: 'Añadir a mi calendario (.ics)',
      made: 'El archivo se creó en tu aparato y no se envió a ningún lado. Ábrelo para añadir los recordatorios a tu calendario.',
      noRem: 'No hay recordatorios que crear: el plazo ya pasó.',
      file: 'recordatorios-daca.ics'
    },
    en: {
      err: 'Check the date: enter a day, month and year that exist (for example, June 30, 2027).',
      yourDate: 'Your DACA expires on',
      windowIs: 'The window USCIS recommends for filing your renewal is',
      from: 'from', to: 'to',
      before: function (n) { return 'The window has not opened yet. It opens in ' + n + (n === 1 ? ' day.' : ' days.'); },
      inside: function (n) { return 'Today you are inside the window. ' + (n === 0 ? 'The last day of the window is today.' : n === 1 ? '1 day is left until the last day of the window.' : n + ' days are left until the last day of the window.'); },
      after: 'The window USCIS recommends has passed, and your expiration date has not arrived yet. Read today\'s USCIS page and talk to free legal help.',
      expired: 'The date you entered has arrived or has passed. Read today\'s USCIS page and talk to free legal help.',
      cite: 'This comes from the USCIS quote further down. It is what USCIS recommends; it does not give or take away any right.',
      paused: 'USCIS does not say it is accepting renewals. We do not calculate any window. Read the USCIS alert above and the USCIS page.',
      remTitle: 'Reminders for your calendar',
      remKind: { opens: 'The window opens', week: 'One week left before the window closes', closes: 'Last day of the window', today: 'Today, inside the window' },
      btn: 'Add to my calendar (.ics)',
      made: 'The file was made on your device and was not sent anywhere. Open it to add the reminders to your calendar.',
      noRem: 'There are no reminders to create: the window has passed.',
      file: 'daca-reminders.ics'
    }
  };
  var root = document.documentElement;
  var lastResult = null;

  function current() { return root.classList.contains('en') ? 'en' : 'es'; }
  function el(tag, cls, text, lang) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (lang === 'en') e.lang = 'en';
    return e;
  }
  function both(tag, cls, fn) { // one element per language, the page's .es/.en rules show the right one
    var out = [];
    ['es', 'en'].forEach(function (l) { var e = fn(l, MSG[l]); e.classList.add(l); if (cls) e.classList.add(cls); if (l === 'en') e.lang = 'en'; out.push(e); });
    return out;
  }

  // Today as a calendar date from the device clock (local day, no time zone arithmetic).
  function today() { var n = new Date(); return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() }; }

  function setLang(lang, keepHash) {
    if (lang !== 'en') lang = 'es';
    root.classList.toggle('en', lang === 'en');
    root.lang = lang;
    document.title = TITLES[lang];
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', DESCS[lang]);
    document.getElementById('lang-es').setAttribute('aria-pressed', String(lang === 'es'));
    document.getElementById('lang-en').setAttribute('aria-pressed', String(lang === 'en'));
    try {
      var hash = keepHash ? location.hash : '';
      history.replaceState(null, '', location.pathname + (lang === 'en' ? '?lang=en' : '') + hash);
    } catch (e) { /* file:// or old browser: the page still works */ }
  }

  function initial() {
    var m = /[?&]lang=(en|es)\b/.exec(location.search);
    if (m) return m[1];
    var h = /^#(en|es)-/.exec(location.hash);
    if (h) return h[1];
    return 'es'; // Spanish first
  }

  function dateLine(label, p) {
    return both('p', 'dline', function (l, M) {
      var e = el('p', null, null);
      e.appendChild(document.createTextNode(M[label] + ' '));
      e.appendChild(el('strong', null, W.format(p, l)));
      e.appendChild(document.createTextNode('.'));
      return e;
    });
  }

  function render(res) {
    var box = document.getElementById('result');
    box.textContent = '';
    lastResult = res;
    if (root.getAttribute('data-renewals') !== 'accepting') {
      both('p', 'big-msg', function (l, M) { return el('p', null, M.paused); }).forEach(function (e) { box.appendChild(e); });
      return;
    }
    var card = el('div', 'card-result');
    dateLine('yourDate', res.expiry).forEach(function (e) { card.appendChild(e); });
    if (res.state === 'before' || res.state === 'inside') {
      both('p', 'dline', function (l, M) {
        var e = el('p', null, null);
        e.appendChild(document.createTextNode(M.windowIs + ' '));
        e.appendChild(el('strong', null, M.from + ' ' + W.format(res.opens, l) + ' ' + M.to + ' ' + W.format(res.closes, l)));
        e.appendChild(document.createTextNode('.'));
        return e;
      }).forEach(function (e) { card.appendChild(e); });
      both('p', 'state', function (l, M) { return el('p', null, res.state === 'before' ? M.before(res.daysToOpen) : M.inside(res.daysToClose)); }).forEach(function (e) { card.appendChild(e); });
      both('p', 'hint', function (l, M) { return el('p', null, M.cite); }).forEach(function (e) { card.appendChild(e); });
    } else {
      both('p', 'state', function (l, M) { return el('p', null, M[res.state]); }).forEach(function (e) { card.appendChild(e); });
    }
    box.appendChild(card);

    var rem = W.reminderDates(res);
    if (rem.length) {
      var wrap = el('div', 'reminders');
      both('h3', null, function (l, M) { return el('h3', null, M.remTitle); }).forEach(function (e) { wrap.appendChild(e); });
      both('ul', 'list', function (l, M) {
        var ul = el('ul', 'list');
        rem.forEach(function (r) { var li = el('li'); li.appendChild(el('strong', null, W.format(r.date, l))); li.appendChild(document.createTextNode(': ' + M.remKind[r.kind])); ul.appendChild(li); });
        return ul;
      }).forEach(function (e) { wrap.appendChild(e); });
      var btn = el('button', 'btn primary big');
      btn.type = 'button'; btn.id = 'ics-btn';
      ['es', 'en'].forEach(function (l) { var s = el('span', l, MSG[l].btn, l); btn.appendChild(s); });
      btn.addEventListener('click', download);
      wrap.appendChild(btn);
      var done = el('p', 'done'); done.id = 'ics-done'; done.setAttribute('role', 'status');
      wrap.appendChild(done);
      box.appendChild(wrap);
    }
  }

  function download() {
    if (!lastResult) return;
    var l = current();
    var text = W.buildIcs(W.reminderDates(lastResult), l, lastResult);
    var blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = MSG[l].file; a.hidden = true;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    var done = document.getElementById('ics-done');
    if (done) { done.textContent = ''; var s = el('span', null, MSG[l].made, l); done.appendChild(s); }
  }

  function submit(e) {
    e.preventDefault();
    var err = document.getElementById('f-err');
    var box = document.getElementById('result');
    var f = { y: document.getElementById('f-year').value.trim(), m: document.getElementById('f-month').value, d: document.getElementById('f-day').value.trim() };
    var res = W.computeWindow(f, today());
    err.textContent = ''; 
    if (!res.ok) {
      box.textContent = ''; lastResult = null;
      var l = current();
      err.textContent = MSG[l].err; err.lang = l;
      var bad = !/^\d{1,2}$/.test(f.d) ? 'f-day' : !f.m ? 'f-month' : 'f-year';
      document.getElementById(bad).focus();
      return;
    }
    render(res);
  }

  document.getElementById('lang-es').addEventListener('click', function () { setLang('es'); relang(); });
  document.getElementById('lang-en').addEventListener('click', function () { setLang('en'); relang(); });
  function relang() { var err = document.getElementById('f-err'); if (err.textContent) { var l = current(); err.textContent = MSG[l].err; err.lang = l; } }
  document.getElementById('calc').addEventListener('submit', submit);

  // Move keyboard and screen reader focus to the section a menu button jumps to.
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var t = document.getElementById(a.getAttribute('href').slice(1));
    if (t && t.hasAttribute('tabindex')) setTimeout(function () { t.focus({ preventScroll: true }); }, 0);
  });

  setLang(initial(), true);
})();
