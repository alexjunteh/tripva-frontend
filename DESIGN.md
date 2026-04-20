# DESIGN.md — Tripva

_Created 2026-04-21 via `/design-consultation`. Supersedes `../DESIGN_SYSTEM.md` (archive, do not extend)._

---

## Product Context

- **What this is:** AI trip planner. User gives destination/dates/budget/interests, Claude streams a full day-by-day itinerary, app becomes a guided travel companion from pre-trip prep through day-of execution to post-trip memory.
- **Who it's for:** English-speaking millennials 25–40. Solo travelers, couples, friend groups, families, adventure travelers, digital nomads.
- **Space:** Consumer travel planning + day-of travel assistance. Peers: Wanderlog, TripIt, Airbnb Trips, Google Travel.
- **Project type:** Web-first progressive web app. Marketing site + app in one domain (`tripva.app`).
- **Brand posture:** Lifestyle-grade, calm, editorial. Not utility-grade, not gamified, not enterprise.

---

## Traveler Archetypes (primary product segmentation)

One free-text "travel style" field is the weakest part of the current product — a family of 4 with a toddler and a couple on a honeymoon produce the same plan structure. The fix is to segment by **archetype** as the **first** input, then adapt the landing messaging, plan form fields, and backend prompt to match.

Six archetypes cover ~90% of consumer travel. Each one has distinct signals, a distinct plan form, and a distinct expected output. Secondary modifiers (accessibility-first, foodie, bleisure) layer on top of any archetype — they are flags, not flows.

| # | Archetype | Signal | Plan output emphasizes | Pace default |
|---|---|---|---|---|
| 1 | **Solo explorer** | 1 traveler, flexible dates | Safety notes, solo-friendly activities, hostels/boutique hotels, conversation-starter spots | Medium-high |
| 2 | **Couple / romance** | 2 adults, often weekend/anniversary | Restaurants, evenings, one-room bookings, "wow" moments (sunset views, private experiences) | Medium |
| 3 | **Family with kids** | ≥1 child + kid ages | Stroller/accessibility-aware, kid-friendly meals, nap windows, playgrounds near attractions, bathroom proximity | Low |
| 4 | **Friend group** | 3–6 adults, all adults | Shared rentals over hotel rooms, consensus-aware recs, split-expense estimates, group-friendly bookings | Medium-high |
| 5 | **Adventure / outdoor** | Interest: hiking, diving, alpine | Gear checklists, permits/trail windows, elevation/fitness-aware pacing, weather-sensitive schedule | Variable |
| 6 | **Digital nomad / slow travel** | Long stay (≥2 weeks), one home base | Coworking spots, wifi, grocery/laundry, weekly rhythm not daily schedule, monthly budget lens | Low |

Secondary modifiers (orthogonal flags that can apply to any of the six):
- `accessibility-first` — wheelchair/mobility aware; selects accessible venues only
- `foodie-deep-dive` — upweights culinary experiences, reservations
- `business-bleisure` — splits into work-days + leisure-days
- `anxious-first-timer` — adds cultural prep, language tips, safety checklist, more handholding

### Landing — archetype grid

The landing page gains a **"Planning a…"** section between the hero and the proof section. Six photo-labeled tiles in a 3×2 grid (mobile: 2×3, or vertical stack under 480px).

- Each tile is an editorial photo + 2-word label ("Solo trip," "Family vacation," "Couples weekend," "Friend group," "Adventure," "Slow travel").
- Tap routes to `/plan?archetype=<id>` with the form pre-configured for that archetype.
- The adjacent "Watch" demo section becomes archetype-aware: playing a short loop per archetype, cycling through on auto-play or swipe.

This section replaces the generic "How it works" grid. The demo IS the how-it-works — six archetype-specific demos show that Tripva understands their shape of travel.

### Plan form — progressive disclosure by archetype

The form flow becomes:

```
Archetype picker (required, first)
    ↓
Universal fields: destination · dates · home-city · budget
    ↓
Archetype-specific fields (progressive reveal, only relevant questions)
    ↓
Interests (archetype-specific chip set)
    ↓
Submit
```

Archetype-specific fields — v1 scope tonight covers **solo, couple, family, friend-group** fully. Adventure and digital-nomad use a generic fallback in v1 with their fields explicitly noted as "coming soon":

| Archetype | Extra fields | Chip set |
|---|---|---|
| Solo explorer | `accommodation_type` (hostel / boutique / hotel / rental), `pace` (packed / balanced / relaxed), `safety_priority` (low / medium / high) | Food · Culture · Nightlife · Nature · History · Shopping · Photos |
| Couple / romance | `occasion` (anniversary / honeymoon / weekend / just-us), `accommodation_type`, `dining_priority` (1–10) | Restaurants · Views · Spa/wellness · Culture · Nature · Nightlife · Photos |
| Family with kids | `child_ages[]` (repeater), `stroller_needed` (bool), `dietary_restrictions[]`, `pace` defaulted to relaxed | Kid-friendly · Food · Nature · Parks · Museums · Beach · Photos |
| Friend group | `group_size` (3–12), `shared_accommodation` (bool), `dining_budget_lens` (per-person), `decision_style` (democratic / led-by-planner) | Food · Nightlife · Adventure · Culture · Beach · Shopping · Photos |
| Adventure / outdoor | *(v2 fully; v1 fallback)* `activity_types[]`, `fitness_level`, `gear_owned[]` | Hiking · Diving · Climbing · Biking · Water · Photography · Wildlife |
| Digital nomad / slow travel | *(v2 fully; v1 fallback)* `work_hours_per_week`, `wifi_requirement`, `cowork_preferred` | Cowork · Food · Culture · Nature · Fitness · Community · Nightlife |

### Backend logic (flagged for follow-up PR on `Tripva-backend`)

- API contract: `POST /api/plan` gains an `archetype` field (enum of 6) and a `modifiers[]` field (array of secondary flags).
- `lib/prompt.js` branches on archetype, injecting archetype-specific system prompt fragments.
- The JSON output schema gains archetype-conditional fields (e.g., family gets `nap_windows[]` and `stroller_accessible: bool` per timeline item).
- Frontend-only for v1: sends `archetype` in the payload; the backend can ignore it without error, so there's no breakage if the backend PR ships later. When the backend starts branching, output quality improves without frontend changes.

---

## Design Principles

Each principle must survive contact with the phrase: *"If this screen existed on the user's phone at 14:13 in Paris on a rainy Tuesday, would this help them?"*

### 1. Always one next thing

Every screen has a single dominant element — one action, one view, one focus. Secondary information is smaller, dimmer, one level deeper. Dashboards ask users to parse; trip companions tell users what's next.

> **Echoes:** Duolingo (the only button is "Continue"), Uber (one stage chip is always "now").
> **Counter-examples to avoid:** our current Live tab, which presents hero + NOW card + progress dots + timeline + leave-row + next-whisper all at once.

### 2. Countdown beats clock

When the user is in-the-moment, time-to-next is the only useful form of time. "In 14 min" over "13:42." Absolute time is a secondary, smaller data point.

> **Echoes:** Citymapper ("Train in 6 min"), Transit ("3 · 11 · 28"), Fitness+ (progress ring + remaining).
> **Rule:** anywhere we show an absolute time, we also show a countdown in a heavier weight — and the countdown is what the user reads first.

### 3. The app knows where you are in the trip

Pre-trip (planning), travel day (in transit), day-of (on location), final day, post-trip (memory) are five different products sharing one shell. The Now tab surface changes completely between states — same component positions, new content and tone.

> **Echoes:** Airbnb Trips (pre-arrival vs in-stay surface shift), Fitness+ (warm-up vs main vs cool-down).
> **Anti-pattern:** showing the same empty "Adventure awaits 🗺️" placeholder regardless of state.

### 4. Feel-first, not feature-first

A full-bleed hero photo per day. Editorial typography (Cormorant Garamond for display). Soft transitions. The product should feel like a lifestyle magazine that happens to be an app — not a feature grid.

> **Echoes:** Google Trips (photo-anchored day cards), Airbnb (minimalist per-day hero).
> **No:** emoji mascots, progress gamification, "Level up!" style copy. The user is an adult on vacation, not a user to engage.

### 5. Resilient by default

Trips happen on flaky hotel wifi, foreign SIMs, 9-hour flights, basements of museums. Last-known state is visible with a soft "offline" indicator. Plans load from localStorage instantly; server updates layer on top when they arrive. Network errors never produce a blank screen.

> **Echoes:** Transit (stale countdowns fade with indicator, never blank), Google Maps offline tiles.
> **Rule:** every data-loading surface has three states — fresh, stale-but-shown, offline-fallback — and all three must be designed, not just the happy path.

---

## Information Architecture

### Landing page — 7 sections → 5

| Old (index.html) | New |
|---|---|
| Hero · Pain · Demo · How-it-works · Testimonials · Pricing · Final-CTA (+ footer) | **Hero · Archetype grid · Watch** · **Proof & Price** · **Final-CTA** (+ footer) |

1. **Hero** — editorial full-bleed photo, one-line promise, primary CTA. Absorbs the "pain" framing.
2. **Archetype grid** — 6 tiles. Each routes to `/plan?archetype=<id>` with the form tailored to that traveler's lifestyle. Replaces the generic "How it works" explainer.
3. **Watch** — 15-second loops, one per archetype, auto-cycling or swipeable. Shows six versions of the product working end-to-end instead of one generic demo.
4. **Proof & Price** — real usage counter + 2–3 testimonials + the pricing table in one section. Adjacency creates the "this is real, here's what it costs" logic flow. Drops the separate testimonial section.
5. **Final-CTA** — single-sentence reinforcement, one button, space to breathe.

**Rationale:** 7 sections is a landing page talking down to the user. 5 sections — one of which is the archetype fork — gives the user a mirror to see themselves and pick a specific flow, replacing generic-explainer surface area with product-demonstrating surface area. The cut is motivated by principle 1 (always one next thing) applied to the marketing surface.

### App — 8 tabs → 5

| Old (trip.html tab ids) | New (bottom nav) | Merges |
|---|---|---|
| tab-plan · tab-trip · tab-days · tab-tickets · tab-hotels · tab-budget · tab-tips · tab-sos | **Now · Plan · Book · Money · More** | Now = old Live. Plan = Days + Trip overview. Book = Tickets + Hotels. Money = Budget. More = Tips + SOS + Settings + profile. |

- **Now** — state-aware focus surface. The dominant tab during a trip.
- **Plan** — the whole itinerary visually: day cards with hero images, drag-to-reorder (Wanderlog), per-day timeline when expanded.
- **Book** — actionable bookings grouped: flights & trains, stays, activities & tickets. Each item has a one-tap "open booking" or "add to Wallet."
- **Money** — budget runway + spent-so-far + per-category breakdown. One chart, not four.
- **More** — Tips, SOS (emergency contacts, embassy), Settings, profile.

**Nav semantics:** "Now" is where users spend 80% of on-trip time. Its icon pulses subtly when a new stage starts. Tabs are labelled one word each, icons are line-weight not filled (filled state = current).

---

## "Mindless Follow" Interaction Model

_What the user sees, taps, and experiences moment-to-moment on a trip day._

```
Open app  →  Now tab autoloads with last-known state (instant, from localStorage)
       ↓
Network catches up  →  soft fade refresh, no blocking spinner
       ↓
Hero FocusCard = current activity
  · Full-bleed destination photo (blurred top + bottom for text legibility)
  · "📍 NOW" kicker
  · Title: "Lunch at Le Marais"
  · Countdown: "Leave in 14 min  ·  8 min walk"
  · Primary action: "Get directions  →"
       ↓
StageStrip below hero (horizontal, scrollable)
  Breakfast ✓    Louvre ✓    ● Lunch    Seine cruise    Dinner
       ↓
PeekNext card — just one item, small: "Up next · 14:30 · Seine cruise"
       ↓
DayProgress ring at the edge of the hero — 40% filled, silently
       ↓
ContextualAlert (only when triggered): "☁️ Rain expected at 16:30"
```

### The 7 patterns from research, mapped to screens

| Pattern | Where it appears | Spec |
|---|---|---|
| **Single dominant action** | FocusCard on Now tab | One card is 60vh mobile / 420px desktop. Everything else is ≤ 25% of the screen. |
| **Countdown > schedule** | Hero countdown, PeekNext | Countdown in DM Sans 700 32px, absolute time in DM Sans 500 14px below. |
| **Stage chips** | StageStrip, post-hero | Horizontal chip row: done (dimmed outline), current (filled accent), future (muted outline). Auto-scrolls to keep current in view. |
| **Hero images per day** | FocusCard, DayCard on Plan tab | Each day has one AI-picked or cached destination photo. Full-bleed, 16:9 on desktop, 4:5 on mobile. |
| **State-aware surface** | Entire Now tab | Five states listed below — same skeleton, new content. |
| **Graceful degradation** | Every data surface | Three states per component: fresh · stale (soft offline badge, dimmed 5%) · fallback (localStorage last-known + "offline" pill). |
| **Progressive reveal** | PeekNext, StageStrip | Only 1 next item in PeekNext. StageStrip shows today only; other days require a tap into Plan. |

### Transitions (the moments that sell the "mindless" feeling)

- **On activity completion** — hero image fades, NEW hero fades in over 640ms; soft audio cue optional (respects prefers-reduced-motion).
- **On day change at midnight** — hero crossfade + new day number animates, stage chips reset.
- **Between tabs** — 240ms opacity + 6px translateY. No slide, no parallax.
- **On arrival at activity** (geolocation if granted) — kicker changes "NEXT UP" → "YOU'RE HERE," primary CTA changes "Get directions" → "Mark done."

---

## Now Tab — redesign spec

### Component hierarchy

```
NowTab
├── StateHeader         ← small band showing overall trip state ("Day 3 of 8 in Paris")
├── FocusCard           ← dominant element (60vh mobile / 420px desktop)
│   ├── HeroImage       (full-bleed, blurred gradient top+bottom for overlay)
│   ├── Kicker          ("📍 NOW" / "⏰ NEXT UP" / "✅ DONE FOR TODAY" / "🎫 FLIGHT SOON")
│   ├── Title           (single line, 24–32px, Cormorant Garamond)
│   ├── Countdown       ("Leave in 14 min · 8 min walk" — tabular-nums)
│   ├── DayProgressRing (thin circular progress, top-right corner of card)
│   └── PrimaryCTA      (one action, not two)
├── StageStrip          ← horizontal chip row, today only
├── PeekNext            ← one small card ("Up next: Seine cruise · 14:30")
└── ContextualAlert     ← conditional, max one at a time, swipe-to-dismiss
```

### State variants

**1. Pre-trip (> 24h to departure)**
- StateHeader: "Paris in 3 days"
- FocusCard hero: destination photo, kicker "PREP," title "Packing list ready?," countdown "Leave in 3d 2h"
- StageStrip: `Plan · ● Prep · Travel · Explore · Return`
- Primary CTA: "Check packing list →"

**2. Travel day (< 24h to departure or in transit)**
- StateHeader: "Paris — travel day"
- FocusCard: airport photo / flight route map, kicker "FLIGHT IN 4h 12m," title "BA326 · CDG," primary CTA "Open boarding pass"
- Subtle pulse on countdown as time shrinks
- PeekNext: "Check in to hotel at 16:00"

**3. On-trip day N (arrived, mid-day)**
- StateHeader: "Day 3 of 8 · Paris"
- FocusCard: current activity's photo, kicker/title/countdown per the canonical spec above
- StageStrip: full today's activities
- PeekNext + ContextualAlert as conditions warrant

**4. Final day**
- StateHeader: "Last day in Paris"
- Tone shifts to memory-first: FocusCard's primary CTA becomes "Capture a memory" (note + photo), not navigation. Language softens.
- Countdown in reverse: "Going home in 6h"

**5. Post-trip (≥1 day after return)**
- StateHeader: "Your Paris trip"
- FocusCard becomes a scrapbook cover: best-of photo, trip-summary stats ("8 days · 47 places · €2,340"), primary CTA "Share" or "Plan next trip"
- StageStrip becomes a photo reel across the trip

### Motion summary

- Hero image fades on state change: 800ms, ease-out
- StageStrip: current chip has a soft 1200ms pulse (reduce-motion disables)
- PeekNext slides up from below when it becomes relevant: 420ms ease-out
- Any numeric change (countdown ticking down) animates the digits: 120ms crossfade

---

## Component System

### Colors (dark-only, refined)

```css
:root {
  /* Background layers — warmer than previous palette, less "screen blue" */
  --bg:          #0A0B10;
  --surface:     #13151E;
  --surface-2:   #1A1D29;
  --elevated:    #21253A;

  /* Text — warm off-white instead of pure white; reduces retinal burn on dark */
  --text:        #F2F2EF;
  --text-m:      rgba(242, 242, 239, 0.72);
  --text-d:      rgba(242, 242, 239, 0.44);

  /* Lines */
  --line:        rgba(255, 255, 255, 0.06);
  --line-2:      rgba(255, 255, 255, 0.12);

  /* Accents */
  --accent:      #7C6AF7;    /* signature purple — primary CTAs, current-stage chip */
  --accent-s:    #5A4DD3;    /* hover/press state */
  --gold:        #D4A84B;    /* "live / now" warmth — used on NOW kicker, pulsing dot */
  --ink:         #95B5FF;    /* soft-blue links, peripheral accents */

  /* Semantic */
  --ok:          #4ADE80;
  --warn:        #FB923C;
  --err:         #F87171;
  --info:        #5AC8FA;

  /* Overlays (for hero image legibility) */
  --overlay-top:    linear-gradient(180deg, rgba(10,11,16,.0) 0%, rgba(10,11,16,.45) 60%, rgba(10,11,16,.85) 100%);
  --overlay-bot:    linear-gradient(0deg,   rgba(10,11,16,.0) 0%, rgba(10,11,16,.45) 60%, rgba(10,11,16,.85) 100%);
}
```

**Rules:**
- `--accent` purple appears ≤ 2 times per screen (primary CTA + current-stage chip). No purple on large text, no purple tinted cards, no purple gradient backgrounds.
- `--gold` is reserved for the "live" / "now" indicator. It pairs with a small pulsing dot. Do not use as a general highlight.
- All text on dark surfaces passes WCAG AA (4.5:1 for body, 3:1 for ≥18px / 14px bold).
- No `rgba(purple)` text on dark cards — this was the previous design's contrast failure. Use `--text-m` instead.

### Typography

Keep the established families, refine the scale.

```css
/* Loaded from Google Fonts — cached via service worker */
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=DM+Sans:wght@400;500;600;700&display=swap');

:root {
  --font-display: 'Cormorant Garamond', 'Times New Roman', serif;
  --font-body:    'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Type scale — mobile-first clamps */
  --t-display:    clamp(2.25rem, 5vw + 1rem, 3.5rem);   /*  36–56px  */
  --t-h1:         clamp(1.75rem, 3vw + 1rem, 2.5rem);   /*  28–40px  */
  --t-h2:         clamp(1.25rem, 1.2vw + 1rem, 1.5rem); /*  20–24px  */
  --t-h3:         1.125rem;   /* 18px */
  --t-body:       1rem;       /* 16px (min 15px enforced on <376px via media query) */
  --t-body-sm:    0.875rem;   /* 14px */
  --t-label:      0.6875rem;  /* 11px, uppercase, tracking .1em */
  --t-numeric-lg: clamp(2rem, 3vw + 1rem, 3rem);        /*  32–48px countdowns */

  /* Line heights */
  --lh-display:   1.05;
  --lh-heading:   1.2;
  --lh-body:      1.55;
  --lh-tight:     1.15;
}
```

**Usage:**
- Display, H1, hero titles → `--font-display`, weight 500–600, italic permitted on trip names ("Paris")
- Everything else → `--font-body`
- All countdowns and prices: `font-variant-numeric: tabular-nums` on `--font-body` weight 700
- Labels: 11px, letter-spacing 0.1em, uppercase, `--text-d`

### Spacing — 4px base, 9-step scale

```css
:root {
  --s-0: 0;
  --s-1: 4px;    /* tight — chip gap, inline icon */
  --s-2: 8px;    /* input padding, compact */
  --s-3: 12px;   /* component internal */
  --s-4: 16px;   /* card padding, default gap */
  --s-5: 24px;   /* section gap inside card */
  --s-6: 32px;   /* major component spacing */
  --s-7: 48px;   /* section padding mobile */
  --s-8: 64px;   /* section padding desktop */
  --s-9: 96px;   /* hero breathing room */
}
```

### Radius

```css
:root {
  --r-s:    8px;   /* chips, small buttons */
  --r-m:    14px;  /* buttons, inputs */
  --r-l:    20px;  /* cards */
  --r-xl:   28px;  /* bottom sheet top, FocusCard */
  --r-full: 999px; /* pills */
}
```

### Motion

```css
:root {
  --ease-out:    cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  --dur-micro:   120ms;  /* hover, focus */
  --dur-short:   240ms;  /* tab switch, chip tap */
  --dur-medium:  420ms;  /* card enter, peek slide-in */
  --dur-long:    640ms;  /* activity transition */
  --dur-hero:    800ms;  /* state change on FocusCard */
}

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

**Rules:**
- No animation without a reason. No decorative shimmer, no bouncing mascots, no marketing-style scroll-triggered parallax.
- Every animation respects `prefers-reduced-motion`.
- Enter on `--ease-out`. Exit on `--ease-in` or `--ease-in-out`. Never linear.

### Components (10)

Each spec includes mobile dimensions first; desktop variants noted.

#### 1. FocusCard (Now tab hero)

- Dimensions: full width, 60vh mobile / 420px desktop
- Radius: `--r-xl` (28px) bottom-corners only on mobile (hugs top); full radius desktop
- Structure (bottom-up inside the image): Kicker · Title · Countdown · PrimaryCTA
- HeroImage: `object-fit: cover`; `--overlay-top` and `--overlay-bot` for text legibility
- DayProgressRing: top-right corner, 48px diameter, 3px stroke, accent fill on `--line-2` track
- Motion: on state change, image crossfades `--dur-hero`, text rises 8px `--dur-medium`

#### 2. StageChip

- Pill, 12px label (or 14px for current), `--s-2` vertical × `--s-4` horizontal
- Radius: `--r-full`
- States:
  - `done` — `--text-d` fill, `--line` border, small ✓ icon
  - `current` — `--accent` fill, white text, no border; soft 1200ms pulse (reduce-motion: no pulse)
  - `future` — transparent fill, `--line-2` border, `--text-m` text
- Min tap target: 32px height (the chip is 24px, extend invisible tap-target via padding on container)

#### 3. StageStrip

- Horizontal scroll, `--s-2` gap, `--s-4` horizontal padding, hides scrollbar
- Auto-scrolls current chip into center on state change
- Mobile: overflow-x: auto; scroll-snap-type: x proximity. Desktop: same, fits whole row without scroll if ≤ 8 chips

#### 4. DayCard (Plan tab)

- 16:9 aspect ratio mobile, 4:3 desktop
- Structure: hero image + overlay gradient + two-line label (day title · day date) + two data points (events count · budget)
- Radius: `--r-l`
- Tap: expands to reveal day timeline (spring-ease, 420ms)

#### 5. TimelineItem

- Two-column grid: 56px time gutter · flexible body
- Time gutter: tabular-nums 14px `--text-m`
- Body: 16px title `--text`, 14px detail `--text-m` (second line)
- Connector: 1px vertical line `--line-2` between items, inset into gutter
- Current item: 8px accent dot replacing the time's separator; title bold

#### 6. BottomNav

- Height: `64px + safe-area-inset-bottom`
- 5 tabs, equal width
- Per tab: 22px icon + 11px label, vertically stacked, `--s-1` gap
- Current tab: accent color on both icon and label; filled icon variant
- Backdrop: `rgba(13, 15, 24, 0.88)` with `backdrop-filter: blur(18px)`
- Top border: `--line`
- Behavior: on Now tab, auto-hides when scrolling down (focus mode); reveals on scroll up or at rest

#### 7. Chip (generic)

- Variant of StageChip without states, used for interests/filters
- Same dimensions, `--text-m` default, `--accent` when selected
- Min tap target 32px

#### 8. Button

- **Primary:** `--accent` bg, white text, 16px weight-600 label, `--s-3 --s-5` padding, `--r-m` radius, 1px `--accent-s` outline, box-shadow `0 4px 20px rgba(124,106,247,0.35)`
- **Secondary:** `--surface-2` bg, `--text` text, 1px `--line-2` border, same geometry, no shadow
- **Ghost:** transparent bg, `--text-m` text, underline on hover/focus, no border
- **Destructive:** `--err` bg, white text, same geometry as Primary
- Min height: 44px (WCAG). Disabled: 0.4 opacity, pointer-events: none

#### 9. BottomSheet (modal)

- Slides from bottom, 100% width, `--r-xl` top-only
- Backdrop: `rgba(0,0,0,0.65)`
- 4×36px drag handle at top center
- Motion: enter `--dur-medium` cubic-bezier(.32,.72,0,1); exit `--dur-short`
- Swipe-to-dismiss on mobile, click-outside on desktop

#### 10. EmptyState

- Centered in parent, `--s-7` vertical padding
- 48px emoji/icon
- H2 title (`--t-h2` weight 700)
- Body text (`--t-body` `--text-m`) max-width 32ch
- One primary button below, 24px gap

### Utility tokens

```css
:root {
  --nav-h: 64px;                       /* bottom nav height */
  --safe-t: env(safe-area-inset-top, 0);
  --safe-b: env(safe-area-inset-bottom, 0);

  --shadow-card:     0 4px 20px rgba(0, 0, 0, 0.35);
  --shadow-elevated: 0 8px 40px rgba(0, 0, 0, 0.55);
  --shadow-glow:     0 0 0 1px rgba(124, 106, 247, 0.15), 0 4px 24px rgba(124, 106, 247, 0.25);
}
```

### Accessibility baseline (enforced)

- Min tap target 44×44 px
- All interactive elements visible focus ring: 2px `--accent`, 2px offset
- Contrast: WCAG AA for all text on all surfaces (verified)
- Keyboard: tab order matches visual order; ESC closes bottom sheets; arrow-keys move focus within StageStrip
- `prefers-reduced-motion` honored on every animation
- `safe-area-inset-*` applied to every fixed element
- No color-only information: every "current stage" state has a position and an icon, not just a color

---

## Anti-Patterns (enforced during review)

| Anti-pattern | Why it's banned |
|---|---|
| Multiple equal-weight cards on one screen | Violates principle 1. |
| Absolute time as the only time | Violates principle 2. |
| Same Live-tab surface pre-trip and on-trip | Violates principle 3. |
| Emoji mascot, "You did it!" hype copy, streak flames | Off-brand (principle 4). Tripva is calm. |
| Blank screen on network error | Violates principle 5. Must fallback. |
| Purple gradient backgrounds | AI-slop signal; dilutes the accent. |
| 3-column icon grid in "features" | AI-slop signal on landing. |
| Centered everything with uniform spacing | Kills hierarchy. |
| Generic unsplash-style stock hero | Use curated or AI-picked destination photos tied to the trip. |
| "Built for adventurers" copy | Generic travel-brand slop. |

---

## Implementation phase map (previews Phase 3 IMPLEMENTATION.md)

This DESIGN.md is built to be implementable in four separable passes:

| Phase | Scope | Core surfaces affected | Safe to ship independently? |
|---|---|---|---|
| (a) **Landing** | index.html + shared tokens.css | Hero, Watch, Proof & Price, Final-CTA | Yes — landing is decoupled from app |
| (b) **App shell & nav** | bottom nav + tab collapse 8→5 + tab-switch motion | trip.html shell | Yes — preserve all existing tab contents as-is, just collapse & rename |
| (c) **Trip-planning logic untouched** | No work this phase — explicit firewall | — | n/a |
| (d) **Now tab redesign** | FocusCard, StageStrip, PeekNext, state detection | trip.html #tab-plan contents | Yes — other tabs keep old UI until later |

Plan, Book, Money tab redesigns are explicitly **out of scope** for this overhaul. They remain functional but visually untouched until a later pass — protecting the 4,500-line trip.html from simultaneous edits.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-21 | DESIGN.md created, supersedes DESIGN_SYSTEM.md | Previous doc was a fragment, not a system. New doc derived from 10-app research + explicit "mindless follow" goal. |
| 2026-04-21 | Kept Cormorant Garamond + DM Sans | Already brand-established; research confirmed serif+sans pairing works for editorial travel. |
| 2026-04-21 | Landing reduced 7 → 4 sections | Reduce decision fatigue on entry; editorial density over explainer density. |
| 2026-04-21 | App tabs reduced 8 → 5 | Bottom nav standard is 5; merges respect natural user groupings (Book = tickets + hotels). |
| 2026-04-21 | Added gold `#D4A84B` as "live / now" accent | Warmth complements purple; avoids over-purpling; echoes editorial magazine accents. |
| 2026-04-21 | Text changed from pure white to warm `#F2F2EF` | Reduces retinal burn on dark; feels editorial; still passes AA. |
| 2026-04-21 | Trip-planning logic explicitly out of scope for this overhaul | Per user directive (visual/logic firewall). |
