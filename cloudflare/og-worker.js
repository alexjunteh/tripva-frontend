// Cloudflare Worker — dynamic OG meta tags for shared trip URLs.
//
// Deploy path: route `tripva.app/trip*` to this Worker via CF dashboard or
// `wrangler deploy`. Worker fetches the trip from the Vercel backend, then
// uses HTMLRewriter to inject the trip-specific og:image/title/description
// into the static trip.html response before sending it back to the crawler.
//
// Regular users get identical behavior — the DOM still loads trip.html and
// hydrates from localStorage/backend. Crawlers (Facebook, Twitter, iMessage,
// Slack, etc.) see the personalized preview card. Big virality unlock.
//
// Bypass for JS consumers: only rewrite when User-Agent looks like a bot,
// OR always if ?og=1 is in the URL (manual testing). Non-crawler requests
// pass through unmodified for lowest latency.

const BACKEND = 'https://tripai-backend.vercel.app';
const OG_ENDPOINT = BACKEND + '/api/og';
const SITE_NAME = 'Tripva';

// Bot detection — crawlers identify themselves pretty honestly.
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|slackbot|discordbot|googlebot|bingbot|yandex|baiduspider|embedly|skype|vkshare|preview|pinterest|iframely/i;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Only handle /trip + /trip.html paths; everything else passes through.
    // (This worker should be routed only on /trip* — defensive check.)
    if (!/^\/trip(\.html)?\/?$/.test(url.pathname)) return fetch(request);

    const tripId = url.searchParams.get('id');
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = BOT_RE.test(userAgent) || url.searchParams.get('og') === '1';

    // Non-bot + no trip id → pass through untouched (99% of real-user hits).
    const response = await fetch(request);
    if (!tripId || !isBot) return response;

    // Bot + trip id → rewrite meta tags. Fetch trip data in parallel with
    // the HTML response so we don't add serial latency.
    const planPromise = fetchTrip(tripId).catch(() => null);
    const ogImageUrl = `${OG_ENDPOINT}?id=${encodeURIComponent(tripId)}`;
    const plan = await planPromise;
    const meta = buildMeta(plan, tripId, ogImageUrl);

    // Use HTMLRewriter to patch the static meta tags with dynamic values.
    const rewriter = new HTMLRewriter()
      .on('meta[property="og:title"]',       { element: e => e.setAttribute('content', meta.title) })
      .on('meta[property="og:description"]', { element: e => e.setAttribute('content', meta.description) })
      .on('meta[property="og:image"]',       { element: e => e.setAttribute('content', meta.image) })
      .on('meta[name="twitter:title"]',      { element: e => e.setAttribute('content', meta.title) })
      .on('meta[name="twitter:description"]',{ element: e => e.setAttribute('content', meta.description) })
      .on('meta[name="twitter:image"]',      { element: e => e.setAttribute('content', meta.image) })
      .on('meta[name="description"]',        { element: e => e.setAttribute('content', meta.description) })
      .on('title',                            { element: e => e.setInnerContent(meta.title) });

    return rewriter.transform(response);
  }
};

async function fetchTrip(id) {
  const r = await fetch(`${BACKEND}/api/trip?id=${encodeURIComponent(id)}`, {
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!r.ok) return null;
  const data = await r.json();
  return (data && data.rawPlan) ? (data.rawPlan.rawPlan || data.rawPlan) : data;
}

function buildMeta(plan, tripId, imageUrl) {
  const trip = (plan && plan.trip) || {};
  const dest = trip.destination || trip.name || '';
  const dayCount = (plan && plan.days && plan.days.length) || 0;
  const dates = (trip.startDate && trip.endDate)
    ? `${fmtDate(trip.startDate)} → ${fmtDate(trip.endDate)}`
    : (trip.dates || '');
  const archetype = trip.archetype;

  const title = dest
    ? `${dest}${dates ? ' · ' + dates : ''} · ${SITE_NAME}`
    : `${SITE_NAME} — AI Trip Planner`;

  const descBits = [];
  if (dayCount) descBits.push(`${dayCount}-day itinerary`);
  if (archetype) descBits.push(`for ${archetype} travelers`);
  descBits.push('built in 30 seconds with Tripva');
  const description = descBits.join(' ') + '. Plan your own at tripva.app';

  return { title, description, image: imageUrl };
}

function fmtDate(ymd) {
  const m = String(ymd || '').match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return ymd || '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m[2]-1]} ${+m[3]}`;
}
