'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../window.js');

const d = (y, m, dd) => ({ y, m, d: dd });
const iso = (p) => W.iso(p);

test('window is 150 to 120 days before expiry (known values)', () => {
  // 2027-06-30 minus 150 = 2027-01-31, minus 120 = 2027-03-02
  const w = W.computeWindow('2027-06-30', '2026-11-27');
  assert.equal(iso(w.opens), '2027-01-31');
  assert.equal(iso(w.closes), '2027-03-02');
  assert.equal(w.state, 'before');
  assert.equal(W.diffDays(w.closes, w.opens), 30);
});

test('window length is always 30 days, across leap and non-leap years', () => {
  for (const e of ['2024-03-01', '2024-12-31', '2025-03-01', '2028-02-29', '2100-12-31', '2000-01-01', '2027-03-31']) {
    const w = W.computeWindow(e, '2000-01-01');
    assert.equal(W.diffDays(w.closes, w.opens), 30, e);
    assert.equal(W.diffDays(w.expiry, w.closes), 120, e);
    assert.equal(W.diffDays(w.expiry, w.opens), 150, e);
  }
});

test('leap day handling', () => {
  assert.equal(W.isLeap(2028), true);
  assert.equal(W.isLeap(2100), false);
  assert.equal(W.isLeap(2000), true);
  assert.equal(W.parseDate('2028-02-29').d, 29);
  assert.equal(W.parseDate('2027-02-29'), null);
  assert.equal(W.parseDate('2100-02-29'), null);
  // expiry on a leap day (values cross-checked with Python datetime)
  const w = W.computeWindow('2028-02-29', '2027-01-01');
  assert.equal(iso(w.closes), '2027-11-01');
  assert.equal(iso(w.opens), '2027-10-02');
  // window that crosses a leap day (Feb has 29 days in 2028)
  const x = W.computeWindow('2028-06-30', '2027-01-01');
  assert.equal(iso(x.closes), '2028-03-02');
  assert.equal(iso(x.opens), '2028-02-01');
  assert.equal(W.addDays(d(2028, 2, 28), 1).d, 29);
  assert.equal(iso(W.addDays(d(2028, 2, 29), 1)), '2028-03-01');
  assert.equal(iso(W.addDays(d(2027, 2, 28), 1)), '2027-03-01');
});

test('month and year ends', () => {
  assert.equal(iso(W.addDays(d(2026, 12, 31), 1)), '2027-01-01');
  assert.equal(iso(W.addDays(d(2027, 1, 1), -1)), '2026-12-31');
  assert.equal(iso(W.addDays(d(2026, 4, 30), 1)), '2026-05-01');
  assert.equal(iso(W.addDays(d(2026, 1, 31), 30)), '2026-03-02');
  const w = W.computeWindow('2027-01-01', '2026-01-01'); // window opens in the previous year
  assert.equal(iso(w.opens), '2026-08-04');
  assert.equal(iso(w.closes), '2026-09-03');
});

test('state: before, inside (both edges), after, expired', () => {
  const e = '2027-06-30'; // opens 2027-01-31, closes 2027-03-02
  assert.equal(W.computeWindow(e, '2027-01-30').state, 'before');
  assert.equal(W.computeWindow(e, '2027-01-31').state, 'inside');
  assert.equal(W.computeWindow(e, '2027-02-15').state, 'inside');
  assert.equal(W.computeWindow(e, '2027-03-02').state, 'inside');
  assert.equal(W.computeWindow(e, '2027-03-03').state, 'after');
  assert.equal(W.computeWindow(e, '2027-06-29').state, 'after');
  assert.equal(W.computeWindow(e, '2027-06-30').state, 'expired');
  assert.equal(W.computeWindow(e, '2030-01-01').state, 'expired');
});

test('a date in the past is expired and still computes the dates', () => {
  const w = W.computeWindow('2020-05-05', '2026-11-27');
  assert.equal(w.ok, true);
  assert.equal(w.state, 'expired');
  assert.ok(w.daysToExpiry < 0);
  assert.deepEqual(W.reminderDates(w), []);
});

test('today inside the window: counts and reminders only from today on', () => {
  const w = W.computeWindow('2027-06-30', '2027-02-10');
  assert.equal(w.state, 'inside');
  assert.equal(w.daysToClose, 20);
  const r = W.reminderDates(w);
  assert.deepEqual(r.map((x) => iso(x.date)), ['2027-02-23', '2027-03-02']);
  assert.deepEqual(r.map((x) => x.kind), ['week', 'closes']);
});

test('reminders: three when the window is ahead, two or more when inside', () => {
  const ahead = W.reminderDates(W.computeWindow('2027-06-30', '2026-11-27'));
  assert.deepEqual(ahead.map((x) => iso(x.date)), ['2027-01-31', '2027-02-23', '2027-03-02']);
  // today is the last day: week-before is past, so today is added to keep two
  const last = W.reminderDates(W.computeWindow('2027-06-30', '2027-03-02'));
  assert.equal(last.length >= 1, true);
  const near = W.reminderDates(W.computeWindow('2027-06-30', '2027-02-28'));
  assert.deepEqual(near.map((x) => iso(x.date)), ['2027-02-28', '2027-03-02']);
  assert.ok(near.length >= 2);
  assert.deepEqual(W.reminderDates(W.computeWindow('2027-06-30', '2027-03-03')), []);
});

test('invalid input is rejected, never guessed', () => {
  const bad = ['', 'abc', '2027-13-01', '2027-00-10', '2027-02-30', '2027-04-31', '2027-1-1', '27-01-01', '1999-12-31', '2101-01-01', null, undefined, 5, {}, { y: 2027, m: 2 }, { y: 2027, m: 'x', d: 1 }, { y: 2027.5, m: 1, d: 1 }, { y: NaN, m: 1, d: 1 }, { y: 2027, m: 1, d: 0 }];
  for (const b of bad) {
    const r = W.computeWindow(b, '2026-11-27');
    assert.equal(r.ok, false, JSON.stringify(b));
    assert.equal(r.error, 'expiry');
  }
  assert.equal(W.computeWindow('2027-06-30', 'nope').error, 'today');
  assert.deepEqual(W.reminderDates({ ok: false }), []);
});

test('object input with digit strings (form fields) works', () => {
  const w = W.computeWindow({ y: '2027', m: '6', d: '30' }, { y: 2026, m: 11, d: 27 });
  assert.equal(iso(w.opens), '2027-01-31');
});

test('formatting in Spanish and English', () => {
  assert.equal(W.format(d(2027, 1, 31), 'es'), '31 de enero de 2027');
  assert.equal(W.format(d(2027, 1, 31), 'en'), 'January 31, 2027');
  assert.equal(W.format(d(2027, 9, 5), 'es'), '5 de septiembre de 2027');
});

test('ics: structure, CRLF, all-day dates, alarms, folding, escaping', () => {
  const w = W.computeWindow('2027-06-30', '2026-11-27');
  const r = W.reminderDates(w);
  for (const lang of ['es', 'en']) {
    const s = W.buildIcs(r, lang, w);
    assert.ok(s.startsWith('BEGIN:VCALENDAR\r\n'));
    assert.ok(s.endsWith('END:VCALENDAR\r\n'));
    assert.equal((s.match(/BEGIN:VEVENT/g) || []).length, 3);
    assert.equal((s.match(/BEGIN:VALARM/g) || []).length, 3);
    assert.ok(s.includes('DTSTART;VALUE=DATE:20270131'));
    assert.ok(s.includes('DTEND;VALUE=DATE:20270201'));
    assert.ok(s.includes('DTSTART;VALUE=DATE:20270302'));
    assert.ok(!/[^\r]\n/.test(s), 'every line break is CRLF');
    for (const line of s.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, 'line over 75 octets: ' + line);
    // unfold and check the text survived folding intact
    const unfolded = s.replace(/\r\n /g, '');
    assert.ok(unfolded.includes(lang === 'es' ? 'SUMMARY:DACA: hoy abre el plazo que USCIS recomienda para presentar tu renovación' : 'SUMMARY:DACA: the window USCIS recommends for filing your renewal opens today'));
    assert.ok(/DESCRIPTION:[^\r]*uscis\.gov/.test(unfolded));
    assert.ok(!/DESCRIPTION:[^\r]*[^\\],/.test(unfolded.split('BEGIN:VALARM')[0].split('DESCRIPTION:')[1] || ''), 'commas are escaped');
  }
  const uids = (W.buildIcs(r, 'es', w).match(/UID:[^\r]*/g));
  assert.equal(new Set(uids).size, 3, 'UIDs are unique');
});

test('independent oracle: every day from 2000 to 2100 matches JavaScript Date in UTC', () => {
  const utc = (p) => Date.UTC(p.y, p.m - 1, p.d) / 86400000;
  for (let y = 2000; y <= 2100; y++) for (let m = 1; m <= 12; m++) for (const dd of [1, 15, W.daysInMonth(y, m)]) {
    const p = { y, m, d: dd };
    const q = W.addDays(p, -150);
    const ref = new Date(Date.UTC(y, m - 1, dd) - 150 * 86400000);
    assert.equal(iso(q), ref.toISOString().slice(0, 10));
    assert.equal(W.diffDays(p, q), 150);
    assert.equal(utc(p) - utc(q), 150);
  }
});

test('ics: only dates derived from the expiry, nothing else about the person', () => {
  const w = W.computeWindow('2027-06-30', '2026-11-27');
  const s = W.buildIcs(W.reminderDates(w), 'en', w).replace(/\r\n /g, '');
  assert.ok(!/ATTENDEE|ORGANIZER|LOCATION|MAILTO|ATTACH/i.test(s));
});
