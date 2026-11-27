// Regression: My Trips said "Saved 3d ago" for a trip edited minutes ago, because it read created_at.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../mytrips.html', import.meta.url), 'utf8');
test('own-trip card label uses the last save time', () => {
  assert.match(html, /'Saved ' \+ timeAgo\(lastSavedAt\(trip\)\)/);
  const s = html.indexOf('function lastSavedAt'), e = html.indexOf('function escHtml');
  const { lastSavedAt, timeAgo } = new Function(html.slice(s, e) + '; return { lastSavedAt, timeAgo };')();
  const now = Date.now();
  const trip = { created_at: new Date(now - 3 * 86400e3).toISOString(), updated_at: new Date(now - 5 * 60e3).toISOString() };
  assert.equal(timeAgo(lastSavedAt(trip)), '5m ago');
  assert.equal(timeAgo(lastSavedAt({ created_at: trip.created_at })), '3d ago');
  assert.equal(lastSavedAt({}), '');
});
