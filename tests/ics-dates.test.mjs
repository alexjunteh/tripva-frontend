import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// Pull the calendar helpers out of trip.html and run them on a saved-trip shape.
const html = readFileSync(new URL('../trip.html', import.meta.url), 'utf8');
const grab = name => { const i = html.indexOf(`function ${name}(`); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}' && --d === 0) break; } return html.slice(i, j + 1); };
const src = ['_icsTzForDestination', '_icsEscape', '_icsFmtLocal', '_icsBuild', '_icsDays', '_icsTz'].map(grab).join('\n');
const api = new Function(src + '; return { _icsBuild, _icsDays, _icsTz };')();

// Shape of the live saved trip a2ba2994…: trip.startDate, days without date.
const saved = { trip: { startDate: '2026-06-15', timezone: 'Europe/Paris', destination: 'Paris, France' },
  days: [1, 2, 3, 4].map(n => ({ day: n, timeline: [{ time: '10:00', title: 'A' }, { time: '14:00', title: 'B' }] })) };

test('days without a date get one from trip.startDate', () => {
  assert.deepEqual(api._icsDays(saved).map(d => d.date), ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18']);
});

test('saved trip calendar has one event per timeline item, in the trip time zone', () => {
  const ics = api._icsBuild(api._icsDays(saved), api._icsTz(saved), 'Paris');
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 8);
  assert.match(ics, /DTSTART;TZID=Europe\/Paris:20260618T140000/);
});

test('a day that already has a date keeps it', () => {
  const p = { trip: { startDate: '2026-06-15' }, days: [{ day: 1, date: '2026-07-01', timeline: [] }] };
  assert.equal(api._icsDays(p)[0].date, '2026-07-01');
});
