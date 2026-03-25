# Photospot Contract — Roam Engine

## Rule: Photos are NEVER stored in state

`photoUrl` must **never** appear in `APP_STATE.rawPlan.days[].timeline[]`.  
Violation is an **audit error** that blocks commit.

## Why

Storing URLs in state causes:
- Stale/broken links when CDN changes (Wikimedia rate-limits, Unsplash IDs expire)
- Wrong photos (generic city shots instead of the actual landmark)
- Leaking infra concerns into data

## How photos are resolved

```
renderPhotospotCard(tl)
  → getSpotPhoto(tl.title, city)
    → scans SPOT_PHOTO_DB by keyword (longest match wins)
    → falls back to CITY_PHOTO_FALLBACK[city]
    → falls back to generic travel photo
```

Both `SPOT_PHOTO_DB` and `CITY_PHOTO_FALLBACK` live in the **JS engine code**,
not in state.

## Photospot item schema (state)

```json
{
  "time": "17:45",
  "type": "photospot",
  "title": "📸 Photospot: Bridge of Sighs",
  "tip": "Best angle is from Ponte della Paglia bridge, not from the bridge itself.",
  "mapQuery": "Bridge of Sighs Venice",
  "lat": 45.4337,
  "lng": 12.3411
}
```

**Required:** `type`, `title`  
**Recommended:** `tip`, `mapQuery` or `lat`+`lng`  
**Forbidden:** `photoUrl`, `photoSrc`, `imageUrl`, `imgUrl`

## Adding a new photo to the DB

Add one entry to `SPOT_PHOTO_DB` in the JS engine (search for `// ── PHOTOSPOT PHOTO ENGINE ──`):

```js
"keyword from spot title": "https://verified-cdn-url/photo.jpg",
```

Rules for the URL:
1. Test returns `HTTP 200 image/jpeg` via HEAD request
2. Title-verified — confirm the photo actually shows the right place
3. Prefer Flickr `live.staticflickr.com` (title-tagged by photographer) over random CDN IDs
4. Unsplash IDs are acceptable if the photo ID is confirmed correct

## Current SPOT_PHOTO_DB entries

| Keyword | Source | Location |
|---|---|---|
| bridge of sighs | Flickr (title-verified) | Venice |
| libreria acqua alta | Flickr (title-verified) | Venice |
| st mark | Unsplash | Venice |
| accademia bridge | Unsplash | Venice |
| scala contarini | Unsplash | Venice |
| vernazza | Flickr (title-verified) | Cinque Terre |
| manarola | Flickr (title-verified) | Cinque Terre |
| chapel bridge | Unsplash | Lucerne |
| eiger / grindelwald | Unsplash | Switzerland |
| piazzale michelangelo | Flickr (title-verified) | Florence |
| ponte vecchio | Flickr (title-verified) | Florence |
| trevi / trevi fountain | Flickr (title-verified) | Rome |
| pantheon | Flickr (title-verified) | Rome |

## Audit enforcement

`scripts/audit-itinerary.py` raises an **ERROR** (blocks commit) on:
- Any `photoUrl` field in a `photospot` timeline item
- Any `photospot` item without a `title`

Raises a **WARNING** on:
- Any `photospot` item without `mapQuery` or GPS coords
