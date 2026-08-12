const BLOCKED_PATHS = new Set([
  '/docs/MEMORY.md',
  '/italy-test.html.bak',
  '/state/trip-state.json',
]);

function isPrivateArtifact(pathname) {
  return pathname.startsWith('/tickets/') || BLOCKED_PATHS.has(pathname);
}

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);

  if (!isPrivateArtifact(pathname)) {
    return context.next();
  }

  return new Response('Gone', {
    status: 410,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}
