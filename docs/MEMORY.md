# MEMORY.md — TravelAppDevBot
_Last updated: 2026-03-24 (heartbeat wave — all tasks complete)_

## The Product: Roam (AI Trip Planner)

### What It Is
Lifestyle-grade AI travel planning app. Input trip requirements → AI generates full itinerary dashboard → user travels with it.

### App Name
**Roam** — short, universal, one word. Domain targets: roam.travel / getroam.app

### Business Model: Affiliate-First (Level 1)
Pre-filled affiliate deep-links in every generated plan. User clicks "Book" → goes to partner site with affiliate tracking → commission earned on completed bookings.
- Booking.com: 4–6% commission
- Trainline: 2–4%
- GetYourGuide: 8%
- Rentalcars: 5–8%
Affiliate IDs are env vars; fallback placeholders: `ROAM_BOOKING_ID`, `ROAM_TRAINLINE_ID`, `ROAM_GYG_ID`, `ROAM_RENTALCARS_ID`

---

## Codebase

### Frontend Dashboard
- **File**: `/home/alex/.openclaw/workspace-travel/planner-template/italy-test.html`
- **Sync copy**: `/home/alex/.openclaw/workspace-travel/planner-template/italy-state.html`
- **Legacy backup**: `/home/alex/.openclaw/workspace-travel/planner-template/italy-legacy.html`
- **Live URL**: https://futuriztaos.github.io/trip-planner/italy-test.html
- **Architecture**: Single HTML file, state-driven, no build step
- **State source**: Embedded `APP_STATE` JS object (from trip-state.json) + fallback for file:// protocol
- **State format**: `normalizedVersion: 2`, entities: stays, segments, activities, food, reservations

### State File
- `/home/alex/.openclaw/workspace-travel/planner-template/state/trip-state.json`
- `planVersion: 20260322-v53`, `tripId: italy-switzerland-2026-03`
- Update pattern: edit JSON → regex-embed into HTML → write both italy-test.html + italy-state.html → git push

### Backend API
- **Path**: `/home/alex/.openclaw/workspace-travel/tripai-backend/`
- **Stack**: Node.js 18+, ESM (`"type": "module"`), Anthropic SDK, Zod
- **Status**: Built locally, NOT yet deployed to Vercel
- **Endpoints**:
  - `POST /api/plan` — AI generates full trip-state.json from user requirements
  - `POST /api/patch` — AI edits existing plan
  - `GET /api/health` — uptime check

### Backend Files
| File | Purpose |
|------|---------|
| `api/plan.js` | AI trip generation (streaming + non-streaming) |
| `api/patch.js` | Plan patching |
| `api/health.js` | Health check |
| `lib/claude.js` | Anthropic SDK wrapper (3x retry) |
| `lib/prompt.js` | System prompt + output schema |
| `lib/affiliate.js` | Pre-filled booking deep-link generator |
| `lib/schema.js` | Input validation (Zod) |
| `lib/middleware.js` | CORS + rate limiting |
| `api/server.js` | Local dev server |

### Git
- **Frontend repo**: https://github.com/FuturiztaOS/trip-planner.git
- **GitHub token**: `/home/alex/.openclaw/workspace-travel/.github_token`
- **Backend repo**: https://github.com/FuturiztaOS/tripai-backend.git
- **Backend deployed**: https://tripai-backend.vercel.app

### Known Issues (backend)
- Real affiliate IDs not set (placeholder env vars: ROAM_BOOKING_ID, ROAM_GYG_ID, ROAM_TRAINLINE_ID, ROAM_RENTALCARS_ID)
- Vercel KV not used — plan storage uses GitHub Gists via GITHUB_TOKEN

### Backend API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/plan` | POST | Generate trip (SSE stream via ?stream=true) |
| `/api/patch` | POST | Patch existing plan |
| `/api/save` | POST | Save plan as GitHub Gist → returns `{ id, url }` |
| `/api/trip` | GET | Load plan by Gist ID via `?id=` |

---

## Dashboard Tabs
1. **Live** — Current day hero, NEXT MOVE chip, 2×2 stat tiles (time/weather/transport/hotel), timeline
2. **Trip** — Stats, route map (Leaflet.js), itinerary list
3. **Days** — Day pill strip + day cards with hour-by-hour
4. **Tickets** — Booked tickets with images (train, museum, flight icons)
5. **Book Now** — ACTION NEEDED / CONFIRMED STAYS / STILL TO ARRANGE segments
6. **Budget** — Booked/Paid (green) vs Pending (orange) segmented view

## UI Stack
- Vanilla JS (no framework)
- CSS custom properties (dark theme, lifestyle-grade)
- Leaflet.js + OpenStreetMap (route map, free, no API key)
- Open-Meteo API (live weather, free, no API key)
- PWA: manifest.json + sw.js (network-first for HTML, cache-first for icons)

---

## Current Trip Context (Alex's Live Trip)
- **Trip**: Italy + Switzerland, Mar 18–31, 2026
- **Travellers**: Alex (Teh Jia Jun, DOB 1997-12-24) + Khai Yee (Wong Khai Yee, DOB 1999-08-20)
- **Today**: Day 6, Mar 23 — Grindelwald day trip from Lucerne
- **Hotel now**: ibis Luzern City (Mar 22–24)
- **Flights out**: SQ365 FCO 11:40 Mar 31 → SIN, SQ132 SIN 08:00 → PEN 09:25 Apr 1
- **SQ booking ref**: DU7NVN

### Booked Tickets
- Grindelwald: SBB order 151420339818, CHF 90/person
- Luzern→Venice: SBB order 151419996814, EC 31 PNR RWXTWN
- Uffizi: PNR U556DQEH, Mar 27 09:15, €29 each
- Accademia: Order 22372112, Mar 27 16:00, €24 each
- Vatican: Visit 22385/2026-8, Code 2L2N0R202JVMU3NSR, Mar 30 16:30, €80 total

### Still to Book
- Florence hotel (Mar 26–28): Hotel Davanzati ~AUD 135/nt
- Rome hotel (Mar 28–31): Hotel Artemide ~AUD 145/nt
- Venice→Florence Frecciarossa (Mar 26)
- Florence→Rome Frecciarossa (Mar 28)
- Colosseum entry (Mar 29)
- Leonardo Express (airport transfer)

---

## Deployment
- Deploy method: `git push` → GitHub Actions → GitHub Pages (frontend)
- Backend deploy: `vercel --prod --yes` from `/home/alex/.openclaw/workspace-travel/tripai-backend/`
- Backend live: https://tripai-backend.vercel.app
- Vercel env vars set: ANTHROPIC_API_KEY, ALLOWED_ORIGIN, GITHUB_TOKEN
- Visual audit REQUIRED after every deploy: screenshot → verify changes landed

## localStorage Keys
- `tripai_dismissed` — dismissed Book Now items
- `tripai_plan` — trip data override

## Key URLs
- **Landing page**: https://futuriztaos.github.io/trip-planner/index.html
- **Trip dashboard** (dynamic): https://futuriztaos.github.io/trip-planner/trip.html
- **Alex's Italy trip** (static): https://futuriztaos.github.io/trip-planner/italy-test.html
- **Backend API**: https://tripai-backend.vercel.app
- State alternate: https://futuriztaos.github.io/trip-planner/italy-state.html
- Ticket images base: https://futuriztaos.github.io/trip-planner/tickets/

## Affiliate Sign-up (pending)
- Booking.com: https://www.booking.com/affiliateprogram/index.html
- Trainline: https://www.thetrainline.com/affiliates
- GetYourGuide: https://partner.getyourguide.com/
- Rentalcars: https://www.rentalcars.com/affiliates/

## Completed (2026-03-23)
- ✅ Backend .gitignore + GitHub repo + push
- ✅ Backend deployed to Vercel (ANTHROPIC_API_KEY + ALLOWED_ORIGIN + GITHUB_TOKEN set)
- ✅ Frontend wired to /api/plan (SSE streaming, planner overlay in italy-test.html)
- ✅ Plan save/load via GitHub Gists (/api/save + /api/trip)
- ✅ Landing page built (index.html)
- ✅ Dynamic trip dashboard built (trip.html — loads from ?id= or localStorage)
- ✅ Share URL flow: generate → save → trip.html?id=xxx
- ✅ Affiliate link env vars wired in backend

## Completed (2026-03-24) — Wave 1 launch blockers
- ✅ Progressive streaming backend (skeleton→day×N→done)
- ✅ Progressive streaming frontend (live build UI with day cards appearing one by one)
- ✅ E2E audit: Tokyo trip generated, all SSE events confirmed, save+load via Gist ID working
- ✅ OG meta tags: index.html (9 tags) + trip.html (8 tags) — og:title, og:image (loremflickr), twitter:card
- ✅ Email capture: Formspree xpwzkqdb wired in index.html with "You're on the list!" success state
- ✅ Plausible analytics: script added to index.html, trip.html, italy-test.html
- ✅ Error + timeout UX: 60s warning, 120s retry button, friendly catch block with retry CTA
- ✅ Mobile audit: No 390px overflow. All fonts clamp(), flex-wrap, vertical step layout
- ✅ trip.html render audit: All 6 tabs confirmed rendering (Live, Trip/map, Days, Tickets, Book Now, Budget)
- **Commit: d6b5921** (tasks 4-7), trip-planner repo

## Completed (2026-03-24) — Wave 2 + Wave 4 partial
- ✅ PWA manifest: name="Roam", short_name="Roam", theme_color="#0a0a0f", sw.js cache roam-v1
- ✅ Landing page polish: hero copy, "How it works" retitled, 4 feature cards section added
- ✅ Generated trip quality: 3/3 trips 100% timeline coverage (Paris 5d, Bangkok 5d, Bali 7d)
- ✅ Smooth tab transitions: fadeIn .15s + translateY reflow trick
- ✅ FAB (floating action button): Install/New Trip/Share with clipboard copy toast
- ✅ Empty states: all 5 tabs have friendly messages
- ✅ "✨ New Trip" button → index.html?dest=&start=&end= pre-fill flow
- ✅ Page load perf: preconnect to backend, dns-prefetch Formspree, manifest link
- ✅ ProductHunt launch kit written in LAUNCH_PLAN.md (tagline, description, maker comment, 5 screenshots)
- ✅ Demo trip: Paris+Amsterdam 7-day, URL: trip.html?id=2507ce159dae4b00
- ⏳ Social proof counter + "Planned by Roam" badge (subagent in progress)
- **Commits: 3fcc9ac (Wave 2), pending (tasks 29-30)**


## Completed (2026-03-24) — Wave 3 Pricing + Wave 4 Distribution (final)
- ✅ Pricing page: Free / Pro $12/mo / Business $49/mo cards in index.html, responsive 3-col→1-col, "Most Popular" badge on Pro, "Pricing" nav link
- ✅ Social proof counter: /api/stats endpoint on backend, live-fetches trip count in hero, returns {trips:47}
- ✅ "Planned by Roam" badge: Subtle footer badge in trip.html linking back to Roam
- **Commits: 0559e55 (pricing), 2db6372 (stats+badge)**

## Final Build State (2026-03-24)
- ALL build tasks complete except Supabase/Stripe/Domain (waiting on Alex)
- Live site: https://futuriztaos.github.io/trip-planner/index.html
- Backend: https://tripai-backend.vercel.app
- Stats API: https://tripai-backend.vercel.app/api/stats

## Blocked (needs Alex)
- Wave 3 auth/quota (tasks 18-22, 25): needs Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)
- Stripe (tasks 24-25): needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
- Domain (task 26): needs domain purchase + CNAME setup

## Open TODOs (Priority Order — waiting on Alex)
1. **Alex action needed**: Create Supabase project → share keys to unblock auth/quota (tasks 18-22)
2. **Alex action needed**: Buy domain (getroam.app / goroam.co) → wire CNAME
3. **Alex action needed**: Stripe keys to unblock payment integration (tasks 24-25)
4. Sign up to affiliate programs, replace placeholder IDs (ROAM_BOOKING_ID etc)
