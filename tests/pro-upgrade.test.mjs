// Regression: the home "Get Pro" button went to plan.html?upgrade=pro, which
// nothing read, so visitors who clicked to pay never reached checkout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const index = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mytrips = readFileSync(new URL('../mytrips.html', import.meta.url), 'utf8');

test('home Get Pro button lands on a page that handles the upgrade', () => {
  const m = index.match(/class="price-btn price-btn-pro" href="([^"]+)"/);
  assert.ok(m, 'Get Pro button present');
  assert.equal(m[1], '/mytrips.html?upgrade=pro');
});

function loadHelpers(store, fetchImpl, toasts, nav) {
  const s = mytrips.indexOf('var UPGRADE_KEY');
  const e = mytrips.indexOf('// Handle auth callback');
  assert.ok(s > 0 && e > s, 'upgrade helpers present');
  const localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  const location = { search: '', set href(v) { nav.push(v); } };
  return new Function('localStorage', 'location', 'fetch', 'showToast', 'setSession', 'BACKEND', 'URLSearchParams',
    mytrips.slice(s, e) + '; return { wantsUpgrade, startCheckout, location };')(
    localStorage, location, fetchImpl, t => toasts.push(t), () => {}, 'https://b', URLSearchParams);
}

test('signed-in checkout sends the token and goes to the Stripe URL', async () => {
  const store = { tripva_pending_upgrade: String(Date.now()) }, toasts = [], nav = [], bodies = [];
  const h = loadHelpers(store, async (u, o) => { bodies.push([u, JSON.parse(o.body)]); return { status: 200, json: async () => ({ url: 'https://checkout.stripe.com/x' }) }; }, toasts, nav);
  assert.equal(h.wantsUpgrade(), true);
  await h.startCheckout('TOK');
  assert.deepEqual(bodies, [['https://b/api/stripe/checkout', { token: 'TOK' }]]);
  assert.deepEqual(nav, ['https://checkout.stripe.com/x']);
  assert.equal(store.tripva_pending_upgrade, undefined, 'intent cleared so checkout does not reopen');
});

test('remembered intent expires after 30 minutes', () => {
  const store = { tripva_pending_upgrade: String(Date.now() - 31 * 60 * 1000) };
  assert.equal(loadHelpers(store, null, [], []).wantsUpgrade(), false);
});

test('503 and 409 give a clear message instead of failing silently', async () => {
  for (const [status, want] of [[503, /not available/], [409, /already have Tripva Pro/]]) {
    const toasts = [], nav = [];
    const h = loadHelpers({}, async () => ({ status, json: async () => ({}) }), toasts, nav);
    await h.startCheckout('T');
    assert.equal(nav.length, 0); assert.match(toasts.at(-1), want);
  }
});
