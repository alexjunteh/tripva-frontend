import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
const middleware = await import(`data:text/javascript,${encodeURIComponent(source)}`);

async function request(pathname, next = async () => new Response('next')) {
  return middleware.onRequest({
    request: new Request(`https://tripva.app${pathname}`),
    next,
  });
}

test('blocks private ticket artifacts before static asset delivery', async () => {
  const response = await request('/tickets/alex-accademia.jpg');

  assert.equal(response.status, 410);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
});

test('blocks private state and documentation paths', async () => {
  for (const pathname of [
    '/state/trip-state.json',
    '/docs/MEMORY.md',
    '/italy-test.html.bak',
  ]) {
    assert.equal((await request(pathname)).status, 410, pathname);
  }
});

test('passes ordinary application routes through unchanged', async () => {
  let calls = 0;
  const response = await request('/plan', async () => {
    calls += 1;
    return new Response('planner', { status: 200 });
  });

  assert.equal(calls, 1);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'planner');
});
