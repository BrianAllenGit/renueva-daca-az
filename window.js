/* Pure calendar-date logic for the DACA renewal window. No DOM, no network, no clock, no time zones:
   every date is {y, m, d} (m is 1 to 12) and all arithmetic runs on whole day numbers.
   Works in the browser (global DacaWindow) and in Node (module.exports) so the same code is tested. */
(function (root) {
  'use strict';
  var EARLIEST_DAYS = 150; // USCIS: "between 120 and 150 days ... before the expiration date"
  var LATEST_DAYS = 120;
  var MIN_YEAR = 2000, MAX_YEAR = 2100;
  var MONTHS = {
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }

  // Days since 1970-01-01 for a calendar date (civil-from-days algorithm; no Date object, so no time zone or DST).
  function toDayNumber(p) {
    var y = p.m <= 2 ? p.y - 1 : p.y;
    var era = Math.floor(y / 400);
    var yoe = y - era * 400;
    var doy = Math.floor((153 * (p.m + (p.m > 2 ? -3 : 9)) + 2) / 5) + p.d - 1;
    var doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
    return era * 146097 + doe - 719468;
  }
  function fromDayNumber(n) {
    var z = n + 719468;
    var era = Math.floor(z / 146097);
    var doe = z - era * 146097;
    var yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
    var y = yoe + era * 400;
    var doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
    var mp = Math.floor((5 * doy + 2) / 153);
    var d = doy - Math.floor((153 * mp + 2) / 5) + 1;
    var m = mp < 10 ? mp + 3 : mp - 9;
    return { y: m <= 2 ? y + 1 : y, m: m, d: d };
  }

  // Accepts {y,m,d} (numbers or digit strings) or "YYYY-MM-DD". Returns a clean {y,m,d} or null.
  function parseDate(input) {
    var y, m, d;
    if (typeof input === 'string') {
      var mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim());
      if (!mt) return null;
      y = +mt[1]; m = +mt[2]; d = +mt[3];
    } else if (input && typeof input === 'object') {
      var ok = function (v) { return (typeof v === 'number' && isFinite(v)) || (typeof v === 'string' && /^\d{1,4}$/.test(v.trim())); };
      if (!ok(input.y) || !ok(input.m) || !ok(input.d)) return null;
      y = +input.y; m = +input.m; d = +input.d;
    } else { return null; }
    if (!(y % 1 === 0 && m % 1 === 0 && d % 1 === 0)) return null;
    if (y < MIN_YEAR || y > MAX_YEAR || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
    return { y: y, m: m, d: d };
  }

  function addDays(p, n) { return fromDayNumber(toDayNumber(p) + n); }
  function diffDays(a, b) { return toDayNumber(a) - toDayNumber(b); } // a minus b
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function iso(p) { return pad(p.y, 4) + '-' + pad(p.m, 2) + '-' + pad(p.d, 2); }
  function format(p, lang) {
    return lang === 'en' ? MONTHS.en[p.m - 1] + ' ' + p.d + ', ' + p.y : p.d + ' de ' + MONTHS.es[p.m - 1] + ' de ' + p.y;
  }

  /* expiry, today: anything parseDate accepts. Result:
     { ok:false, error:'expiry'|'today' }  or
     { ok:true, expiry, opens, closes, today, state, daysToOpen, daysToClose, daysToExpiry }
     state: 'before' (window not open yet), 'inside' (today is opens..closes, both included),
            'after' (window closed, DACA not yet expired), 'expired' (expiry day or later). */
  function computeWindow(expiryIn, todayIn) {
    var expiry = parseDate(expiryIn);
    if (!expiry) return { ok: false, error: 'expiry' };
    var today = parseDate(todayIn);
    if (!today) return { ok: false, error: 'today' };
    var opens = addDays(expiry, -EARLIEST_DAYS);
    var closes = addDays(expiry, -LATEST_DAYS);
    var state;
    if (diffDays(today, expiry) >= 0) state = 'expired';
    else if (diffDays(today, closes) > 0) state = 'after';
    else if (diffDays(today, opens) >= 0) state = 'inside';
    else state = 'before';
    return {
      ok: true, expiry: expiry, opens: opens, closes: closes, today: today, state: state,
      daysToOpen: diffDays(opens, today), daysToClose: diffDays(closes, today), daysToExpiry: diffDays(expiry, today)
    };
  }

  /* Reminder dates: the day the window opens, 7 days before it closes, the day it closes.
     Only today or later. If fewer than 2 remain while the window is still open, today is added. */
  function reminderDates(w) {
    if (!w || !w.ok || w.state === 'after' || w.state === 'expired') return [];
    var out = [], seen = {};
    var push = function (p) { var k = iso(p); if (!seen[k] && diffDays(p, w.today) >= 0 && diffDays(p, w.closes) <= 0) { seen[k] = 1; out.push({ date: p }); } };
    push(w.opens); push(addDays(w.closes, -7)); push(w.closes);
    if (out.length < 2 && w.state === 'inside') { push(w.today); }
    out.sort(function (a, b) { return diffDays(a.date, b.date); });
    var kinds = ['opens', 'week', 'closes'];
    var keys = [iso(w.opens), iso(addDays(w.closes, -7)), iso(w.closes)];
    out.forEach(function (r) { var i = keys.indexOf(iso(r.date)); r.kind = i >= 0 ? kinds[i] : 'today'; });
    return out;
  }

  var TEXT = {
    es: {
      opens: 'DACA: hoy abre el plazo que USCIS recomienda para presentar tu renovación',
      week: 'DACA: falta una semana para que cierre el plazo que USCIS recomienda',
      closes: 'DACA: hoy es el último día del plazo que USCIS recomienda para presentar tu renovación',
      today: 'DACA: estás dentro del plazo que USCIS recomienda para presentar tu renovación',
      desc: 'Recordatorio hecho en tu navegador. No es asesoría legal. Revisa las reglas actuales en https://www.uscis.gov/es/DACA y habla con ayuda legal gratuita.'
    },
    en: {
      opens: 'DACA: the window USCIS recommends for filing your renewal opens today',
      week: 'DACA: one week left in the window USCIS recommends for filing your renewal',
      closes: 'DACA: today is the last day of the window USCIS recommends for filing your renewal',
      today: 'DACA: you are inside the window USCIS recommends for filing your renewal',
      desc: 'Reminder made in your browser. Not legal advice. Check the current rules at https://www.uscis.gov/DACA and talk to free legal help.'
    }
  };

  // RFC 5545 helpers
  function icsEscape(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function utf8Len(ch) { var c = ch.codePointAt(0); return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4; }
  function fold(line) { // lines longer than 75 octets are folded with CRLF + space; never split a character
    var out = '', cur = 0, chars = Array.from(line);
    for (var i = 0; i < chars.length; i++) {
      var n = utf8Len(chars[i]);
      if (cur + n > 75) { out += '\r\n '; cur = 1; }
      out += chars[i]; cur += n;
    }
    return out;
  }
  function dateKey(p) { return pad(p.y, 4) + pad(p.m, 2) + pad(p.d, 2); }

  /* All-day events (VALUE=DATE, so no time zone), each with an alarm at 9:00 local on the day. */
  function buildIcs(reminders, lang, w) {
    lang = lang === 'en' ? 'en' : 'es';
    var t = TEXT[lang];
    var stamp = dateKey(w.today) + 'T000000Z';
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//renueva-daca-az//DACA renewal window//' + lang.toUpperCase(), 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    reminders.forEach(function (r) {
      var end = addDays(r.date, 1);
      lines.push('BEGIN:VEVENT',
        'UID:daca-' + dateKey(w.expiry) + '-' + r.kind + '-' + dateKey(r.date) + '@renueva-daca-az',
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + dateKey(r.date),
        'DTEND;VALUE=DATE:' + dateKey(end),
        'SUMMARY:' + icsEscape(t[r.kind]),
        'DESCRIPTION:' + icsEscape(t.desc),
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(t[r.kind]), 'TRIGGER:PT9H', 'END:VALARM',
        'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  var api = { parseDate: parseDate, computeWindow: computeWindow, reminderDates: reminderDates, buildIcs: buildIcs, addDays: addDays, diffDays: diffDays,
    daysInMonth: daysInMonth, isLeap: isLeap, format: format, iso: iso, EARLIEST_DAYS: EARLIEST_DAYS, LATEST_DAYS: LATEST_DAYS, MONTHS: MONTHS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DacaWindow = api;
})(typeof self !== 'undefined' ? self : this);
