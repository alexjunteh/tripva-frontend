/* Day cover photos from Wikipedia, checked against where the day actually is.
   Used by trip.html (window.TripvaDayPhotos) and tested in Node (module.exports).

   Why the location check: a loose Wikipedia search turns "Skyline cocktails at
   New York Bar" (Shinjuku) into "Buffalo, New York". Every candidate page must
   carry coordinates within MAX_KM of the stop the traveller sleeps at that day,
   so a Tokyo day can never show Kyoto, and nothing can show another country. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripvaDayPhotos = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX_KM = 60;
  const MIN_WIDTH = 800;
  const THUMB = 1280;
  const MAX_QUERIES = 5; // per day, keeps a 14-day trip well under Wikipedia's rate limits
  const BAD_FILE = /(\.svg|map|flag|logo|locator|location|emblem|seal|coat_of_arms|diagram|chart|icon)/i;
  // Articles that match a place name but are not a picture of the place.
  const BAD_TITLE = /(\(disambiguation\)|^list of|^history of|^timeline of|\b(fire|attack|bombing|bombings|disaster|riot|riots|massacre|shooting|earthquake|flood|tsunami|election|olympics|university|college|diocese|archdiocese|airport|station|railway line|football club|f\.c\.)\b)/i;
  const FILLER = /\b(arrival|arrive|arriving|departure|depart|departing|return|returning|travel|transfer|exploring|explore|discovering|discover|adventure|adventures|relaxing|relax|slow|final|last|first|day|days|highlights|views?|from|to|at|in|of|the|and|via|break|calm|mornings?|afternoon|evening|night|dinner|lunch|breakfast|grand|group|farewell|culinary|shopping|dining|food|trails?|heights|coves|beach days|art|history|heart|eternal city|spa|sports|atmosphere|crossing|ferry|market)\b/gi;

  function haversineKm(a, b) {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // The stop for this day: a stop named by the day's heroSeed wins ("Return to
  // Tokyo" on the last day), else the last stop whose start day <= dayNum.
  function stopForDay(plan, dayNum, heroSeed) {
    const stops = ((plan && plan.mapStops) || [])
      .filter(s => s && typeof s.lat === 'number' && typeof s.lng === 'number')
      .sort((a, b) => (a.day || 0) - (b.day || 0));
    if (!stops.length) return null;
    const seed = String(heroSeed || '').toLowerCase().trim();
    if (seed) {
      const named = stops.find(s => String(s.name || '').toLowerCase().trim() === seed);
      if (named) return named;
    }
    let pick = stops[0];
    for (const s of stops) if ((s.day || 0) <= dayNum) pick = s;
    return pick;
  }

  // "Rua Rasada Hotel, Trang" -> "Trang"; "Karon / Kata / Rawai" -> "Karon".
  function placeName(stop) {
    const n = String((stop && stop.name) || '');
    return n.split(',').pop().split('/')[0].trim();
  }
  // "Mahé, Praslin & La Digue, Seychelles" -> "Seychelles".
  function countryOf(plan) {
    const t = (plan && plan.trip) || {};
    const parts = String(t.destination || t.name || '').split(',');
    return parts.length > 1 ? parts.pop().trim() : '';
  }

  const clean = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s\-']/g, ' ').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Search terms, best first. Place hints only: the backend heroSeed, the day
  // title, then the stop itself. Timeline titles are left out on purpose
  // (restaurant and bar names produced wrong-city matches).
  function seedsForDay(day, stop, country) {
    const out = [];
    const push = s => { const t = clean(s); if (t.length > 2 && !out.includes(t)) out.push(t); };
    const place = stop ? placeName(stop) : '';
    const inCountry = place && country && place.toLowerCase() !== country.toLowerCase() ? `${place} ${country}` : '';
    const title = clean(String((day && day.title) || '')
      .replace(/^(arrival in|arrive in|travel to|transfer to|return to|depart(?:ure)? from|final day in|day \d+:?)\s+/i, '')
      .replace(/\b(and|&)\s+departure\b/i, ''));
    // Proper place names in the title: "Views from Victoria Peak" -> "Victoria Peak".
    const names = (String((day && day.title) || '').match(/[A-Z][\w'\u2019\u00C0-\u024F-]+(?:\s+(?:de|la|du|di|del|of)?\s*[A-Z][\w'\u2019\u00C0-\u024F-]+)*/g) || [])
      .map(n => clean(n.replace(FILLER, ' '))).filter(n => n.length > 3);
    // The landmark named in the day's first highlights beats a bare heroSeed:
    // "fushimi" alone found Fushimi Castle for a "Fushimi Inari torii gates" day.
    // One proper name per highlight, always paired with the place. Only names of
    // two or more capitalised words: every highlight starts with a capital, so a
    // single word ("Cultural immersion") is usually not a place.
    const hl = (day && Array.isArray(day.highlights) ? day.highlights : []).slice(0, 2);
    for (const h of hl) {
      const n = (String(h || '').match(/[A-Z][\w'’À-ɏ-]+(?:\s+(?:de|la|du|di|del|of)?\s*[A-Z][\w'’À-ɏ-]+)+/g) || [])
        .map(x => clean(x.replace(FILLER, ' '))).find(x => x.length > 3 && x.includes(' ') && (!place || x.toLowerCase() !== place.toLowerCase()));
      // Bare name: the 60 km check keeps it in the right place, and adding the
      // place let any page titled with it ("Mahé highlands") pass the title match.
      if (n) push(n);
    }
    if (day && day.heroSeed) { push(`${day.heroSeed} ${place}`); push(day.heroSeed); }
    // The country disambiguates common names ("Victoria" -> Victoria, Seychelles).
    if (inCountry) push(inCountry);
    for (const n of names) { if (place && !n.toLowerCase().includes(place.toLowerCase())) push(`${n} ${place}`); push(n); }
    if (title) push(`${title} ${place}`);
    if (place) push(place);
    return out;
  }

  function searchUrl(q) {
    return 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*' +
      '&generator=search&gsrlimit=5&gsrsearch=' + encodeURIComponent(q) +
      '&prop=pageimages%7Ccoordinates&piprop=thumbnail&pithumbsize=' + THUMB;
  }

  // Pick the first acceptable page from one search response.
  const words = s => clean(s).toLowerCase().split(' ').filter(w => w.length > 3);
  function pickFromResponse(json, center, used, query) {
    const pages = Object.values((json && json.query && json.query.pages) || {})
      .sort((a, b) => (a.index || 0) - (b.index || 0));
    // Only pages whose title shares a word with the query: a nearby but
    // unrelated page ("La Digue" for a Beau Vallon day, 45 km away) is wrong.
    const qw = words(query || '');
    // Whole title words, so "port" does not match "Important". A long joined
    // seed ("sainteanne") may still match the title with its spaces removed.
    const matches = p => {
      const t = clean(p.title).toLowerCase(), tw = t.split(' ');
      return qw.some(w => tw.includes(w) || (w.length >= 7 && t.replace(/\s/g, '').includes(w)));
    };
    const ordered = qw.length ? pages.filter(matches) : pages;
    for (const p of ordered) {
      const th = p.thumbnail;
      if (!th || !th.source || (th.width || 0) < MIN_WIDTH) continue;
      if (BAD_TITLE.test(p.title || '')) continue;
      let file = th.source.split('?')[0].split('/').pop() || '';
      try { file = decodeURIComponent(file); } catch (e) {}
      if (BAD_FILE.test(file)) continue;
      if (used && used.has(th.source)) continue;
      const c = p.coordinates && p.coordinates[0];
      if (center) {
        if (!c) continue;
        if (haversineKm(center, { lat: c.lat, lng: c.lon }) > MAX_KM) continue;
      }
      return { url: th.source, title: p.title, width: th.width };
    }
    return null;
  }

  // fetchJson(url) -> parsed JSON (or throws). cache: optional {get(k), set(k,v)}.
  // A fetch error is rethrown so the caller can stop instead of hammering a
  // rate-limited API; null means "searched, nothing suitable".
  async function pickDayPhoto(plan, day, used, fetchJson, cache) {
    const stop = stopForDay(plan, (day && day.day) || 1, day && day.heroSeed);
    if (!stop) return null; // no coordinates to check against: keep the placeholder
    const center = { lat: stop.lat, lng: stop.lng };
    for (const q of seedsForDay(day, stop, countryOf(plan)).slice(0, MAX_QUERIES)) {
      let json = cache && cache.get(q);
      if (!json) {
        json = await fetchJson(searchUrl(q));
        if (cache && json) cache.set(q, json);
      }
      const hit = pickFromResponse(json, center, used, q);
      if (hit) { if (used) used.add(hit.url); return { ...hit, query: q }; }
    }
    return null;
  }

  return { MAX_KM, placeName, countryOf, haversineKm, stopForDay, seedsForDay, searchUrl, pickFromResponse, pickDayPhoto };
});
