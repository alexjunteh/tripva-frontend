// Regression: when a visitor ran out of free daily trips, /api/plan answered
// 429 "Daily trip limit reached. Sign in for more trips." but plan.html threw it
// away and showed "Generation paused before a draft was ready. Please retry."
// with a Retry button that could only fail again. The daily limit must turn into
// a sign-in prompt (anonymous) or an upgrade prompt (signed-in free), with no Retry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const plan = readFileSync(new URL('../plan.html', import.meta.url), 'utf8');

// Real 429 bodies, copied from tripai-backend api/plan.js (daily quota) and the
// per-minute limiter just above it.
const UPGRADE = { price: '$24.99/year', monthlyPrice: '$2.99/month', benefits: ['Unlimited trip generation'] };
const ANON = { error: 'Daily quota exceeded', message: 'Daily trip limit reached. Sign in for more trips.', quotaLimit: 3, quotaUsed: 4, tier: 'anonymous', upgrade: UPGRADE };
const FREE = { error: 'Daily quota exceeded', message: 'Daily trip limit reached. Upgrade to Pro for unlimited trips.', quotaLimit: 10, quotaUsed: 11, tier: 'free', upgrade: UPGRADE };
const PER_MINUTE = { error: 'Too many requests', message: 'Rate limit: 3 requests per minute', resetAt: '2026-11-28T10:00:40.000Z' };

function loadPrompt() {
  const s = plan.indexOf('// ── Daily limit (429)');
  const e = plan.indexOf('// ── end daily limit');
  assert.ok(s > 0 && e > s, 'daily-limit helper block present in plan.html');
  return new Function(plan.slice(s, e) + '; return _planLimitPrompt;')();
}

test('anonymous daily limit shows the backend message and a sign-in button', () => {
  const p = loadPrompt()(429, ANON, false);
  assert.equal(p.kind, 'signin');
  assert.equal(p.message, ANON.message);
  assert.match(p.label, /sign in/i);
  assert.equal(p.href, '/mytrips.html');
  assert.equal(p.retry, false);
});

test('signed-in free daily limit shows an upgrade button priced from the body', () => {
  const p = loadPrompt()(429, FREE, true);
  assert.equal(p.kind, 'upgrade');
  assert.equal(p.message, FREE.message);
  assert.match(p.label, /Upgrade to Pro/);
  assert.match(p.label, /\$2\.99\/month/);
  assert.equal(p.href, '/mytrips.html?upgrade=pro');
  assert.equal(p.retry, false);
});

test('tier comes from the body even when the local session disagrees', () => {
  // Expired token: the browser still holds a session but the backend counted the IP.
  assert.equal(loadPrompt()(429, ANON, true).kind, 'signin');
  assert.equal(loadPrompt()(429, FREE, false).kind, 'upgrade');
});

test('body without tier falls back to the local session; no price means a plain label', () => {
  const f = loadPrompt();
  const bare = { error: 'Daily quota exceeded', upgrade: {} };
  assert.equal(f(429, bare, false).kind, 'signin');
  assert.match(f(429, bare, false).message, /Sign in for more trips/);
  const up = f(429, bare, true);
  assert.equal(up.kind, 'upgrade');
  assert.equal(up.label, 'Upgrade to Pro');
});

test('per-minute limit is not the daily limit: wait message, retry stays, no sign-in', () => {
  const p = loadPrompt()(429, PER_MINUTE, false);
  assert.equal(p.kind, 'wait');
  assert.equal(p.retry, true);
  assert.equal(p.href, undefined);
  assert.match(p.message, /minute/);
});

test('non-429 statuses and junk bodies are left to the old error path', () => {
  const f = loadPrompt();
  for (const s of [400, 401, 409, 500, 503]) assert.equal(f(s, ANON, false), null, 'status ' + s);
  assert.equal(f(429, null, false).kind, 'wait');
  assert.equal(f(429, 'not json', false).kind, 'wait');
});

test('message from the body is shown as text, never as HTML', () => {
  const s = plan.indexOf('function _showGenerationLimit');
  assert.ok(s > 0, '_showGenerationLimit present');
  const body = plan.slice(s, plan.indexOf('\n}\n', s));
  assert.doesNotMatch(body, /innerHTML/);
});

test('the planner checks for 429 before the generic interrupted path', () => {
  const s = plan.indexOf('async function proceedToGeneration');
  const okCheck = plan.indexOf('if (!response.ok)', s);
  const limit = plan.indexOf('_planLimitPrompt(response.status', okCheck);
  const thrown = plan.indexOf('throw new Error', okCheck);
  assert.ok(okCheck > s && limit > okCheck && limit < thrown, '429 branch sits before the throw');
});

test('daily-limit prompts offer the free option too; the wait prompt does not', () => {
  const f = loadPrompt();
  assert.match(f(429, ANON, false).note, /free trips reset every day/);
  assert.match(f(429, FREE, true).note, /free trips reset every day/);
  assert.equal(f(429, PER_MINUTE, false).note, undefined);
});

test('a new generation clears the limit state left by a previous one', () => {
  const s = plan.indexOf('async function proceedToGeneration');
  const head = plan.slice(s, plan.indexOf('fetch(BACKEND', s));
  assert.match(head, /classList\.remove\('gen-limit'\)/);
  assert.match(head, /clearInterval\(window\._limitTick\)/);
  assert.match(head, /disabled = false/);
});
