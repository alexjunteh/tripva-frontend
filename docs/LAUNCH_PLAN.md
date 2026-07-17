# Tripva Launch + GTM Plan
_Last updated: 2026-07-17_

## ICP
- Age: 25-40
- Segment: English-speaking millennial travelers (solo, couples, friend groups)
- Core pain: planning takes too long and booking is fragmented across too many tabs

## Positioning
- Product: AI trip operating system (not only planning, but in-trip execution)
- Promise: plan in minutes, travel with one live dashboard
- Primary CTA: `Generate free trip`

## What's Live (as of July 2026)
- 30-second itinerary generation with streaming build
- 8 destination demos on landing (Tokyo, Santorini, Kyoto, Bali, Paris, Iceland, Queenstown, Barcelona) — each with 3-day itineraries, photo galleries, photo spots, transport events, local tips
- Animated "Watch it work" demo on landing — typewriter → shimmer → cascade sequence
- Saved trips via Supabase auth (Google + magic link)
- Shareable trip dashboards with OG previews
- PWA install + offline support
- Affiliate links: Travelpayouts (hotels/flights), GetYourGuide (activities), Klook (Asia activities), Rail Ninja (Japan/Korea/Taiwan rail), Trip.com, Booking.com, Trainline
- Affiliate click tracking via `affiliate_clicks` Supabase table
- Rate limiting via Upstash Redis (sliding window, 3 req/min costly endpoints)
- JWT auth middleware (ready but not yet enabled for anonymous generation)
- Blog + SEO itinerary templates
- SerpAPI Google Flights integration

## Channels
- SEO: destination + itinerary intent pages (`"7 day italy itinerary"`, `"amalfi coast luxury itinerary"`)
- Instagram Reels: short itinerary transformations + in-trip dashboard demos
- TikTok: fast planning demos, "before/after" planning time reduction
- Product Hunt: maker-led launch and social proof spike
- Reddit (`r/travel`, `r/solotravel`, `r/digitalnomad`): value-first posts + templates

## Launch Sequence
1. Soft launch (friends + warm audience) and fix usability friction — DONE
2. Reach 500 active users through content + communities
3. Show affiliate proof (tracked clicks + first commissions)
4. Scale with repeatable SEO + creator partnerships

## 3-Week Execution Sprint
### Week 1 (Reddit + Show HN — lowest friction)
- Publish 3 value-first Reddit posts (see LAUNCH_PACK.md)
- Publish Show HN post with demo link
- Comment support runbook: answer all comments in <12h
- Capture high-performing hooks into reusable copy bank

### Week 2 (Product Hunt + content ramp)
- Finalize PH assets: tagline, 5 screenshots (use demo destinations), demo URL, maker comment
- Publish Product Hunt launch post Tuesday 12:01am PT
- Activate launch-day checklist: comments in first hour, update reply cadence, ask warm network for early support
- Start daily TikTok/Reels (see SOCIAL_MEDIA_GROWTH_STRATEGY_2026.md)

### Week 3 (Influencer outreach)
- Outreach to 30 micro creators (10k-150k followers) in travel + lifestyle
- Offer custom co-branded demo itineraries and tracked affiliate landing links
- Convert top 5 creators into recurring monthly content partners

## KPI Targets
- Week 1: 100 generated trips, 20 share links, 5 waitlist signups/day
- Week 2: 250 generated trips, 5000 landing sessions, first affiliate clicks from generated plans
- Week 3: 500 generated trips total, affiliate conversion baseline established

## Measurement Stack
- Acquisition: UTM by channel/campaign
- Activation: trip generated rate, generation completion rate
- Revenue: affiliate click-through rate, affiliate conversion rate, earnings per generated trip
- Retention: returning visitors, repeat trip generation within 30 days

## Immediate Next Actions
- [ ] Pick launch week start date (recommend a Tuesday)
- [ ] Record 3 screen-capture demo videos for Reddit/PH/HN posts
- [ ] Prepare 10 SEO landing pages for highest-intent city + duration keywords

---

## Moat-Building Timeline
_Updated 2026-07-17_

The goal: build compounding advantages that competitors cannot replicate even if they copy the product.

### DONE — Data Layer (completed)

| Action | Status |
|--------|--------|
| Wire real affiliate IDs (Travelpayouts, GYG, Klook, Rail Ninja, Trip.com, Booking, Trainline) | DONE |
| Log affiliate clicks + outcomes per trip (`affiliate_clicks` table in Supabase) | DONE |
| Track which itinerary items lead to bookings | DONE — backend logging on every affiliate link click |
| 8 demo destination trip pages indexed on landing | DONE |

**Next milestone**: First real affiliate commission earned. Screenshot it. Worth $1M in investor conversations.

---

### NOW — Month 1–3 (Lock-In Layer)

| Action | Why | Status |
|--------|-----|--------|
| Launch My Trips (Supabase auth) | Switching cost compounds with every saved trip | DONE — Google + magic link auth, saved trips |
| Group trip sharing | Multi-user lock-in + K-factor >1 | DONE — shareable trip links with OG previews |
| Post-trip recap | Full lifecycle ownership → can't leave without losing memories | TODO — end-of-trip summary, photos prompt, "Plan next trip like this" CTA |
| 20 SEO destination pages | Content moat — first to index wins permanently | IN PROGRESS — 8 demo destinations live on landing, 12 more needed |

**Milestone**: User with 3+ saved trips. Retention data. Return visit rate >20%.

---

### Month 3–6 (Distribution Layer)

| Action | Why | How |
|--------|-----|-----|
| 5–10 creator partnerships | Exclusive distribution + viral attribution | Offer affiliate revenue share on their audience's bookings |
| "Planned by Tripva" badge on shared trips | Attribution on every shared URL → organic discovery | Already shipped — ensure prominent on all public trip pages |
| Telegram/WhatsApp bot | Meet travelers where they plan: in group chats | Bot generates trip on demand in any travel group chat |
| "Tripva Intelligence" destination scores | Proprietary data → PR + SEO + product feature | Publish monthly "Most-planned destinations" from trip data |

**Milestone**: Creator partner live. First creator-attributed trip generated. SEO pages ranking.

---

### Month 6–12 (Strategic Layer)

| Action | Why | How |
|--------|-----|-----|
| White-label B2B API | Contract lock-in 10× stronger than consumer | Pitch 3 travel agencies + 1 credit card travel portal |
| Strategic investor with distribution | JetBlue Ventures = JetBlue integration. Amadeus = GDS. | Target in Series A / travel VC conversations |
| Affiliate relationship upgrade | Better commission tiers require performance history | 6 months of conversion data → negotiate preferred rates |
| Proprietary trip graph published | Media citation moat ("According to Tripva data...") | Annual "State of Travel Planning" report from Tripva data |

**Milestone**: First B2B white-label contract signed. Strategic investor letter of intent.

---

### Why This Order Matters

```
Data collected NOW → trains better AI later
SEO indexed NOW  → can never be replicated later
Creators signed EARLY → locked before competitors think to do it
B2B signed LATER → needs 6 months of performance proof first
```

The compounding flywheel:
```
More trips → better affiliate data → smarter AI → higher conversion
     ↓                                                    ↓
More SEO pages                                    More revenue
     ↓                                                    ↓
More organic traffic ←————————————————————— Reinvest in growth
```

**Nobody can buy 6 months of conversion data. Start collecting it today.**
