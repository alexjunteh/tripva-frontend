# Product Roadmap — Roam (AI Trip Planner)
_Last updated: 2026-03-26 · Covers moat features + convenience improvements_

---

## 🗺️ Roadmap Overview

| Phase | Timeline | Theme | Goal |
|-------|----------|-------|------|
| **Phase 0** | Done | Core MVP | Generate → Dashboard → Book |
| **Phase 1** | Week 1–4 | Revenue + Retention | First $ + daily active use |
| **Phase 2** | Month 2–3 | Lock-in Layer | Switching cost + virality |
| **Phase 3** | Month 3–5 | Social + Collaboration | Multi-user moat |
| **Phase 4** | Month 5–8 | Intelligence Layer | AI learns you |
| **Phase 5** | Month 8–12 | Platform Layer | B2B + integrations |

---

## ✅ Phase 0 — DONE (Shipped)

| Feature | Status | Notes |
|---------|--------|-------|
| AI trip generation (SSE streaming) | ✅ Done | Claude + Zod schema |
| 6-tab dashboard (Live/Trip/Days/Tickets/Book Now/Budget) | ✅ Done | trip.html |
| Affiliate booking links | ✅ Done | lib/affiliate.js (placeholder IDs) |
| Save/load trips via GitHub Gists | ✅ Done | /api/save + /api/trip |
| PWA + service worker | ✅ Done | manifest.json + sw.js |
| Landing page + email capture | ✅ Done | index.html + Formspree |
| Pricing page (Free/Pro/Business) | ✅ Done | index.html |
| Stats API (/api/stats) | ✅ Done | returns {trips: N} |
| Admin dashboard | ✅ Done | admin.html (pw: roam2026) |
| Investor pitch deck | ✅ Done | pitch.html (16 slides) |

---

## 🔴 Phase 1 — Revenue + Retention (Week 1–4)

_Goal: First real affiliate commission + daily returning users_

### 1.1 Real Affiliate IDs (Alex action — Day 1)
**Effort:** 2 hours | **Impact:** Immediate revenue

- Sign up: Booking.com Affiliate (24hr approval)
- Sign up: GetYourGuide Partner Portal
- Sign up: Trainline Affiliate
- Sign up: Rentalcars.com Affiliate
- Add to Vercel env: `ROAM_BOOKING_ID`, `ROAM_GYG_ID`, `ROAM_TRAINLINE_ID`, `ROAM_RENTALCARS_ID`
- **Build:** Nothing — already wired in `lib/affiliate.js`

---

### 1.2 Affiliate Click Analytics
**Effort:** 1 day | **Impact:** Conversion intelligence (data moat starts here)

- Backend: Log every affiliate click to `/api/track-click`
  - Fields: `tripId`, `linkType` (hotel/activity/transport), `destination`, `tripDuration`, `clickedAt`
- Store in: Vercel KV or simple JSON append to GitHub (cheap at start)
- Dashboard: Add "Affiliate Clicks" tab to admin.html
- **Stack:** Node.js + Vercel KV

```js
// api/track-click.js
POST { tripId, linkType, destination, duration }
→ store in KV: clicks:{date}
→ aggregate in /api/stats
```

---

### 1.3 Smart Push Notifications (PWA)
**Effort:** 2 days | **Impact:** Daily active use, app stays on home screen

- Use Web Push API (already have PWA + sw.js)
- Notification triggers:
  - "Your [destination] trip is in 14 days — 3 things still to book"
  - "Hotel price dropped for your [destination] stay"  
  - "Visa required for [destination] — apply 4 weeks before travel"
- Store notification preferences in localStorage (no backend needed initially)
- **Stack:** Web Push API + sw.js + VAPID keys (free via web-push npm)

```js
// sw.js addition
self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge.png',
    data: { tripId: data.tripId }
  });
});
```

---

### 1.4 Real-time Currency Converter in Budget Tab
**Effort:** 4 hours | **Impact:** Removes constant friction for international travelers

- API: `https://api.exchangerate-api.com/v4/latest/USD` (free, no key)
- Detect destination currency from trip `destination` field
- Show every budget item as: `€18 = $19.80 USD = RM 88`
- User sets home currency in localStorage settings
- **Stack:** Free exchange rate API + frontend JS

---

### 1.5 Offline Emergency Card
**Effort:** 4 hours | **Impact:** Keeps app permanently on home screen

- New tab or modal in trip.html: "Emergency Info"
- Pre-populated from trip data: destination country emergency numbers
- Hardcoded lookup: country → { police, ambulance, fire, tourist police }
- Show hotel address + phone in local script (Japanese, Arabic, Chinese)
- Copy as text / screenshot prompt
- **Stack:** Pure frontend, JSON lookup table

---

### 1.6 Packing List AI
**Effort:** 1 day | **Impact:** Genuinely useful, no competitor does this integrated

- New endpoint: `POST /api/packing`
- Input: destination, dates, activities from trip plan, weather forecast (Open-Meteo already integrated)
- Output: categorised packing list (clothing, documents, electronics, toiletries)
- Renders as checklist in trip.html — checkboxes persist in localStorage
- **Stack:** Claude mini call + Open-Meteo weather data

```js
// lib/prompts/packing.js
const packingPrompt = (destination, activities, weather) => `
Generate a packing list for a trip to ${destination}.
Activities: ${activities.join(', ')}
Expected weather: ${weather}
Format: JSON { clothing: [], documents: [], electronics: [], toiletries: [], misc: [] }
`
```

---

## 🟡 Phase 2 — Lock-in Layer (Month 2–3)

_Goal: Switching cost compounds — every feature makes leaving painful_

### 2.1 Auth + My Trips (Supabase — Alex to provide keys)
**Effort:** 3 days | **Impact:** #1 retention driver

- Magic link email auth (no password friction)
- My Trips page: all saved trips, sorted by date
- Auto-save on generation (if logged in)
- Free tier: 3 trips saved | Pro: unlimited
- **Stack:** Supabase Auth + Supabase DB (trips table)
- **Blocked by:** SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

```sql
-- trips table
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users,
  gist_id TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2.2 Travel Profile
**Effort:** 2 days | **Impact:** Data that accumulates = switching cost

Profile fields (stored in Supabase user metadata):
- Nationality (auto-fills visa requirements)
- Home city (used for mapStops filtering)
- Travel style (budget/mid-range/luxury)
- Dietary restrictions
- Preferred airline + loyalty number
- Hotel chain preferences + loyalty number
- Home currency

Used by AI to personalise every generated trip:
> *"Based on your profile: boutique hotels, vegetarian-friendly restaurants, mid-morning starts"*

---

### 2.3 Post-trip Memory + Trip Diary
**Effort:** 3 days | **Impact:** Full lifecycle ownership, sharing virality

- Trip status: PLANNING → ACTIVE → COMPLETED
- On completion: "How was your trip?" prompt
- Generate shareable "Trip Diary" page:
  - Summary stats (days, cities, spend, km travelled)
  - Top moments (from timeline)
  - Budget breakdown chart
  - "Planned by Roam" badge + share button
- Instagram-ready trip card (canvas-based image generation)
- **Stack:** HTML Canvas for image + new route in trip.html

---

### 2.4 Clone a Trip
**Effort:** 4 hours | **Impact:** Virality — every shared trip can be cloned

- On any public trip.html page: "Clone this trip for my dates" button
- Opens index.html pre-filled with same destination, style, duration
- Generates new trip for the user's dates
- **Stack:** URL params — already have this pattern

---

### 2.5 Trip Report (Shareable PDF/Web)
**Effort:** 2 days | **Impact:** Social sharing → new user acquisition

- After trip: one-tap "Generate Trip Report"
- Beautiful auto-generated web page:
  - Cover photo (Unsplash API for destination)
  - Day-by-day summary
  - Total spend + category breakdown  
  - Top 5 moments
  - Map route
- Share URL: `roam.app/report/[id]`
- **Stack:** New HTML template + print-to-PDF

---

## 🟢 Phase 3 — Social + Collaboration (Month 3–5)

_Goal: Multi-user lock-in — one person can't leave without breaking the group_

### 3.1 Group Trip Collaboration
**Effort:** 5 days | **Impact:** K-factor + multi-user lock-in

- Share link → collaborators can view + suggest edits
- Real-time presence (who's viewing now)
- Comment/vote on activities
- Shared budget: each person marks what they've paid
- **Stack:** Supabase Realtime (already in Supabase) + trip_collaborators table

```sql
CREATE TABLE trip_collaborators (
  trip_id UUID REFERENCES trips,
  user_id UUID REFERENCES auth.users,
  role TEXT CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3.2 WhatsApp / Telegram Trip Sharing
**Effort:** 1 day | **Impact:** Distribution in the channel where travel planning actually happens

- "Share to WhatsApp" button → pre-filled message with trip URL
- Telegram bot: `/plan [destination] [dates]` → generates trip → returns URL
- When friend opens shared URL → "Plan your own version" CTA
- **Stack:** WhatsApp API (deep link) + Telegram Bot API

---

### 3.3 Social Trip Board (Browse + Discover)
**Effort:** 4 days | **Impact:** SEO content moat + social proof

- Public feed: trending destinations, most cloned trips
- Search: "7 days Tokyo" → shows community trips
- Each trip card: destination photo, days, budget tier, user rating
- Every public trip = indexed SEO page
- **Stack:** Supabase public trips query + new explore.html page

---

### 3.4 Travel Buddy Matching (Solo Travelers)
**Effort:** 5 days | **Impact:** Network effect moat

- Opt-in: "Looking for travel buddy"
- Match: same destination + overlapping dates + compatible travel style
- Private message to connect
- **Stack:** Supabase + simple matching algorithm

---

## 🔵 Phase 4 — Intelligence Layer (Month 5–8)

_Goal: AI that gets smarter with every trip — competitors can't catch up_

### 4.1 AI Preference Learning
**Effort:** 1 week | **Impact:** The Spotify Discover Weekly moat

After 3+ trips:
- Analyse: hotel tier, activity types, budget per day, meal style, trip pace
- Build user preference vector in Supabase
- Inject into every new generation prompt:
  > *"User profile: prefers boutique hotels $100-150/nt, street food + 1 nice dinner, 2-3 activities/day, slow mornings, beach destinations"*
- Gets dramatically better with each trip
- **Stack:** Claude analysis of past trips + Supabase user_preferences table

---

### 4.2 Gmail / Email Import (Auto-detect Bookings)
**Effort:** 1 week | **Impact:** The TripIt moat — once connected, never leave

- OAuth Google/Gmail read scope
- Detect: flight confirmations, hotel bookings, activity tickets
- Parse structured data (flight numbers, times, booking refs, addresses)
- Auto-populate trip timeline and tickets tab
- **Stack:** Google OAuth + Gmail API + Claude to parse email bodies

---

### 4.3 Live Flight + Price Monitoring
**Effort:** 1 week | **Impact:** Daily active use driver

- Monitor: hotel prices from affiliate partners for saved trips
- Alert: "Price dropped $20 on your saved hotel"
- Monitor: flight prices via Aviasales/Skyscanner API
- Push notification on significant changes
- **Stack:** Scheduled Vercel cron + price APIs + Web Push

---

### 4.4 Visa & Entry Requirements Engine
**Effort:** 3 days | **Impact:** Genuine utility — nobody does this integrated

- User nationality (from Travel Profile)
- Destination country
- Auto-fetch: visa requirements, processing time, cost, application URL
- Show in Book Now tab as urgent action if needed
- Data source: VisaDB API (free) or Sherpa API
- **Stack:** VisaDB/Sherpa API + nationality from user profile

---

### 4.5 "Roam Intelligence" — Destination Insights
**Effort:** 2 days | **Impact:** Proprietary data → PR + SEO

Aggregate from trip data:
- Most planned destinations by month
- Average budget by destination and travel style
- Top activities by destination (most included in plans)
- Best time to visit (based on when users plan, not weather only)

Publish as:
- Monthly "State of Travel Planning" blog post
- API endpoint for media: `/api/insights/[destination]`
- In-app: shown at top of each generated trip

*"According to 50,000 Roam trips, Tokyo rates 9.4/10 for first-time visitors in March."*

---

## ⚫ Phase 5 — Platform Layer (Month 8–12)

_Goal: B2B contracts + OS integrations = structural moats_

### 5.1 Calendar Integration
**Effort:** 3 days | **Impact:** Deep OS integration

- "Add to Calendar" → exports full itinerary as .ics file
- Each day = calendar event with address, booking ref, notes
- Google Calendar / Apple Calendar / Outlook
- **Stack:** ical.js library + .ics generation

### 5.2 Apple / Google Wallet Passes
**Effort:** 3 days | **Impact:** Every wallet open = Roam visible

- Hotel booking → Wallet pass with check-in date, address, confirmation
- Activity ticket → Wallet pass with QR code slot, time, location
- **Stack:** PassKit (Apple) + Google Wallet API

### 5.3 White-label B2B API
**Effort:** 2 weeks | **Impact:** Contract lock-in, 10× stronger than consumer

- API key management per client
- Custom branding + domain
- Webhook callbacks for booking events
- Usage dashboard + invoicing
- Target clients: travel agencies, credit card travel portals, airlines
- **Stack:** API key auth layer + client config in Supabase

### 5.4 Travel Agent Dashboard
**Effort:** 1 week | **Impact:** Agency adoption = guaranteed trip volume

- Agents generate trips for clients
- Client approval workflow
- Commission tracking
- White-label PDFs
- **Stack:** New agent.html + Supabase roles

---

## 📊 Feature Priority Matrix

| Feature | Effort | Impact | Moat | Build Phase |
|---------|--------|--------|------|-------------|
| Real affiliate IDs | 2hrs | 🔴 High | Data | **Now** |
| Currency converter | 4hrs | 🟡 Medium | UX | **Now** |
| Emergency card | 4hrs | 🟡 Medium | Retention | **Now** |
| Push notifications | 2d | 🔴 High | Retention | **Phase 1** |
| Affiliate analytics | 1d | 🔴 High | Data moat | **Phase 1** |
| Packing list AI | 1d | 🟡 Medium | UX | **Phase 1** |
| Auth + My Trips | 3d | 🔴 High | Lock-in | **Phase 2** |
| Travel Profile | 2d | 🔴 High | Lock-in | **Phase 2** |
| Clone a Trip | 4hrs | 🔴 High | Virality | **Phase 2** |
| Post-trip diary | 3d | 🟡 Medium | Lifecycle | **Phase 2** |
| Group collaboration | 5d | 🔴 High | Multi-user moat | **Phase 3** |
| Telegram bot | 1d | 🟡 Medium | Distribution | **Phase 3** |
| Trip board / explore | 4d | 🟡 Medium | SEO moat | **Phase 3** |
| Gmail import | 1wk | 🔴 High | TripIt moat | **Phase 4** |
| AI preference learning | 1wk | 🔴 High | Data flywheel | **Phase 4** |
| Visa engine | 3d | 🟡 Medium | Utility | **Phase 4** |
| Live price monitoring | 1wk | 🟡 Medium | Daily use | **Phase 4** |
| Calendar sync | 3d | 🟡 Medium | OS integration | **Phase 5** |
| White-label B2B API | 2wk | 🔴 High | Contract moat | **Phase 5** |
| Wallet passes | 3d | 🟢 Low | Visibility | **Phase 5** |

---

## 🚫 Blocked on Alex

| Feature | Blocked By |
|---------|-----------|
| Auth + My Trips (Phase 2) | Supabase keys: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` |
| Stripe payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Gmail import | Google OAuth client credentials |
| Domain + SSL | Domain purchase + DNS config |
| Real affiliate revenue | Sign up to affiliate programs (Booking.com, GYG, Trainline, Rentalcars) |

---

## Tech Stack Per Phase

| Phase | Stack Additions |
|-------|----------------|
| Phase 1 | Web Push API + VAPID keys + Vercel KV + ExchangeRate API |
| Phase 2 | Supabase Auth + Supabase DB + HTML Canvas |
| Phase 3 | Supabase Realtime + Telegram Bot API + WhatsApp deep links |
| Phase 4 | Google OAuth + Gmail API + VisaDB API + Aviasales API |
| Phase 5 | PassKit + Google Wallet API + API key management layer |

