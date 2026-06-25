import { mkdir, writeFile } from 'node:fs/promises';

const pages = [
  { slug: '7-day-italy-itinerary', title: '7-Day Italy Itinerary', destination: 'Italy', days: 7, budget: '$2,000-3,500', angle: 'Rome, Florence, Venice, and train-friendly pacing for first-time visitors.' },
  { slug: 'tokyo-with-kids', title: 'Tokyo With Kids Itinerary', destination: 'Tokyo, Japan', days: 6, budget: '$2,500-4,500', angle: 'Family-friendly neighborhoods, short transfers, character stops, and flexible rest blocks.' },
  { slug: 'bali-on-1500', title: 'Bali on $1,500 Itinerary', destination: 'Bali, Indonesia', days: 7, budget: '$1,500', angle: 'A realistic beach, food, temple, and Ubud plan without blowing the budget.' },
  { slug: 'paris-first-timer', title: 'Paris First-Timer Itinerary', destination: 'Paris, France', days: 5, budget: '$1,800-3,000', angle: 'The classic Paris route with smarter sequencing, fewer backtracks, and photo-friendly timing.' },
  { slug: 'europe-by-train-2-weeks', title: 'Europe by Train 2-Week Itinerary', destination: 'Paris, Amsterdam, Berlin, Prague, Vienna', days: 14, budget: '$3,500-6,000', angle: 'A rail-first route for travellers who want multiple countries without airport days.' },
  { slug: 'japan-10-day-itinerary', title: 'Japan 10-Day Itinerary', destination: 'Tokyo, Kyoto, Osaka', days: 10, budget: '$3,000-5,500', angle: 'A balanced first Japan trip with city energy, temples, food, trains, and day trips.' },
  { slug: 'thailand-10-day-budget', title: 'Thailand 10-Day Budget Itinerary', destination: 'Bangkok, Chiang Mai, Krabi', days: 10, budget: '$1,200-2,200', angle: 'Street food, temples, beaches, and low-cost transport without a rushed route.' },
  { slug: 'switzerland-by-train-7-days', title: 'Switzerland by Train 7-Day Itinerary', destination: 'Zurich, Lucerne, Interlaken, Zermatt', days: 7, budget: '$3,500-6,500', angle: 'A scenic rail plan built around lakes, alpine viewpoints, and efficient transfers.' },
  { slug: 'seoul-5-day-itinerary', title: 'Seoul 5-Day Itinerary', destination: 'Seoul, South Korea', days: 5, budget: '$1,200-2,500', angle: 'Palaces, shopping streets, food markets, cafes, and nightlife grouped by district.' },
  { slug: 'singapore-3-day-itinerary', title: 'Singapore 3-Day Itinerary', destination: 'Singapore', days: 3, budget: '$700-1,500', angle: 'A compact stopover plan with hawker food, gardens, neighborhoods, and easy MRT routing.' },
];

const css = `*{box-sizing:border-box}body{margin:0;background:#0a0a12;color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.62}a{color:inherit}nav{height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(10,10,18,.92);position:sticky;top:0;z-index:10}.logo{font-size:20px;font-weight:900;text-decoration:none;background:linear-gradient(135deg,#fff,#9b87f5);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.navlinks{display:flex;gap:18px;align-items:center;color:rgba(248,250,252,.72);font-size:14px}.cta{background:#7c6af7;color:#fff;text-decoration:none;border-radius:8px;padding:10px 14px;font-weight:800}main{max-width:1040px;margin:0 auto;padding:84px 24px}.eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#9b87f5}h1{font-size:clamp(42px,7vw,76px);line-height:1.03;letter-spacing:-2px;margin:14px 0 18px}p.lead{font-size:20px;color:rgba(248,250,252,.76);max-width:760px}.meta{display:flex;flex-wrap:wrap;gap:10px;margin:28px 0 42px}.pill{border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);border-radius:999px;padding:8px 12px;color:rgba(248,250,252,.8);font-size:14px}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:22px;align-items:start}.card{border:1px solid rgba(255,255,255,.11);background:rgba(255,255,255,.05);border-radius:8px;padding:24px}.card h2{font-size:20px;margin:0 0 14px}.days{display:grid;gap:10px}.day{padding:12px 0;border-top:1px solid rgba(255,255,255,.08);color:rgba(248,250,252,.76)}.day b{color:#fff}.planbox{position:sticky;top:84px}.btn{display:flex;justify-content:center;background:#7c6af7;color:#fff;text-decoration:none;border-radius:8px;padding:14px 16px;font-weight:900;margin-top:16px}.small{font-size:13px;color:rgba(248,250,252,.58)}footer{padding:40px 24px;color:rgba(248,250,252,.55);text-align:center}@media(max-width:780px){.grid{grid-template-columns:1fr}.navlinks a:not(.cta){display:none}.planbox{position:static}}`;

function pageHtml(page) {
  const encodedDest = encodeURIComponent(page.destination);
  const planUrl = `../plan.html?destination=${encodedDest}&days=${page.days}&source=seo_${page.slug}`;
  const canonical = `https://tripva.app/itineraries/${page.slug}.html`;
  const dayIdeas = [
    'Arrival, check-in, and an easy first neighborhood walk.',
    'Main landmarks grouped by geography to avoid backtracking.',
    'Food, markets, and local streets with realistic travel time.',
    'One flexible day trip or slower recovery block.',
    'Final highlights, shopping, and departure logistics.',
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="canonical" href="${canonical}">
  <meta name="description" content="${page.title}: ${page.angle} Generate a custom Tripva plan in 30 seconds.">
  <meta property="og:title" content="${page.title} - Tripva">
  <meta property="og:description" content="${page.angle}">
  <meta property="og:image" content="https://tripva.app/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://tripva.app/og-image.png">
  <title>${page.title} - Tripva</title>
  <link rel="icon" type="image/svg+xml" href="../icon.svg">
  <style>${css}</style>
</head>
<body>
  <nav><a class="logo" href="../">Tripva</a><div class="navlinks"><a href="../blog/">Blog</a><a href="../about.html">About</a><a class="cta" href="${planUrl}">Plan this trip</a></div></nav>
  <main>
    <div class="eyebrow">AI itinerary template</div>
    <h1>${page.title}</h1>
    <p class="lead">${page.angle} Use this as a starting point, then let Tripva build the exact day-by-day itinerary around your dates, pace, hotel area, and budget.</p>
    <div class="meta"><span class="pill">${page.days} days</span><span class="pill">${page.destination}</span><span class="pill">Typical budget: ${page.budget}</span></div>
    <div class="grid">
      <section class="card">
        <h2>What the route should cover</h2>
        <div class="days">
          ${dayIdeas.map((idea, i) => `<div class="day"><b>Block ${i + 1}:</b> ${idea}</div>`).join('')}
        </div>
      </section>
      <aside class="card planbox">
        <h2>Generate the full plan</h2>
        <p>Tripva will fill in hotels, transport, maps, food stops, attraction timing, tickets, and budget notes for your real dates.</p>
        <a class="btn" href="${planUrl}">Plan this ${page.days}-day trip</a>
        <p class="small">No credit card required. Edit the plan after generation.</p>
      </aside>
    </div>
  </main>
  <footer>Tripva - AI trip planning in 30 seconds</footer>
</body>
</html>
`;
}

await mkdir(new URL('../itineraries/', import.meta.url), { recursive: true });
await Promise.all(pages.map((page) => writeFile(new URL(`../itineraries/${page.slug}.html`, import.meta.url), pageHtml(page))));
console.log(`Generated ${pages.length} SEO itinerary pages.`);
