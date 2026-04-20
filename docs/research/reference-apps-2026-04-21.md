# Reference-app research for Tripva UI/UX overhaul

**Date:** 2026-04-21
**Budget:** 10 apps (scoped, not expansive)
**Target goal:** "mindless follow" day-of travel — reduce stress and decision fatigue
**Method:** For each app, extract 2–4 **concrete mechanics** worth stealing. Not vibes.

---

## Category A — Trip-planning apps (3)

### 1. Wanderlog

Map-first collaborative itinerary. Market leader in "planning group trips."

**Steal:**
- **Map + list split:** the left column is the per-day list; the right is a live map with pins that highlight on hover. Every list item has a one-tap "show on map" affordance.
- **Drag-to-reorder day cards:** users physically feel the itinerary. Reduces fear of "breaking" a plan.
- **Inline expense splitter per item:** attaches cost to the moment, not to a separate budget tab.

**Don't steal:** the crowded power-user toolbar. Too many features surfaced at once.

### 2. TripIt

The "magic" unified trip view, still class-defining for email-to-itinerary.

**Steal:**
- **One-screen unified day:** flights, hotels, activities all rendered in a single vertical timeline sorted by time, not by category. No tabs needed on trip day.
- **Countdown hero:** "Flight boards in 1h 32m" at the top of the current day — the only thing that matters *right now*.
- **Pro alerts (gate change, flight delay):** push notifications that update the single source of truth, not ghost duplicates.

**Don't steal:** the dense metadata display. Too many fields, not enough hierarchy.

### 3. Google Travel / Google Trips (legacy)

Minimalist timeline, hero image per day, excellent information density.

**Steal:**
- **Hero image per day:** a full-bleed destination photo as the day's anchor. Makes day boundaries unmistakable and emotionally anchored.
- **Day-segmented timeline:** morning/afternoon/evening band of 2–4 activities per slot. Easier to grok than a 14-row list.
- **"Next best thing to do" suggestions:** contextual recs inside the day flow, not siloed in a separate tab.

**Don't steal:** the reliance on Gmail data harvesting — not a pattern we want.

---

## Category B — "Follow mindlessly" apps (3)

### 4. Duolingo

The gold standard for "one action at a time" consumer UX.

**Steal:**
- **The only button:** "Continue" / "Start lesson" — the app never asks "what next?" with 4 options. It *tells* you the one next thing.
- **Streak + gentle nudge:** motivation is intrinsic to the flow, not a separate stats screen.
- **Progressive reveal:** only the current lesson is visible. Future lessons are locked until current is done.

**Don't steal:** the cartoon mascot guilt-tripping. Off-brand for Tripva's adult traveler audience.

### 5. Headspace

Best-in-class "today's practice" hero + guided audio auto-advance.

**Steal:**
- **"Today's practice" card:** the entire home screen is one dominant card — a single, named activity for today, with time estimate and a hero image.
- **Auto-advancing segments:** inside a session, stages (intro / breathing / closing) auto-advance with soft audio cues. User never taps.
- **Progress bar that reflects state, not clock:** "You're halfway through" more than "5:23 remaining."

**Don't steal:** the session-library "explore" overload. Too many choices collapses the single-action clarity.

### 6. Airbnb Trips

Per-day hero cards, minimalist timeline, cooperative UX with host.

**Steal:**
- **Minimalist per-day card:** one photo, one title, two data points (time + location). Stripped of everything non-essential.
- **Home / Eat / See tabs are horizontal, not nested:** flat hierarchy. Every tap is one level deep.
- **"You're here" state:** when the app detects you're at the property, the UI shifts from pre-arrival (check-in instructions hero) to in-stay (wifi, house rules, local recs).

**Don't steal:** the reservation-vs-trip split. Confusing in the mobile app.

---

## Category C — Live / real-time day-of UX (3)

### 7. Citymapper "GO" mode

The definitive "next move" app. Nothing beats it for turn-by-turn urban navigation.

**Steal:**
- **Next-move card at top with countdown:** "Walk to platform · 4 min · train arrives in 6 min." The card is big, colorful, and updates in real time.
- **Glanceable step chips:** each leg of the journey is a chip (walk / train / transfer / walk / dest). Current chip is highlighted. User can see past + present + future at a glance.
- **"Rain soon" contextual alerts:** weather is surfaced *only when relevant to the next move*. Not a separate weather widget.
- **Arrival estimation updates inline:** ETA refines as you move. No reload.

**Don't steal:** Citymapper's power-user "route options" (compare 4 routes) — that's planning, not executing.

### 8. Uber

Stage-based status chips + live driver tracking.

**Steal:**
- **Stage chips:** "Searching → Driver assigned → Arriving in 3 min → On trip → Arrived." Each stage has a distinct visual language.
- **Action chip under hero:** "Share trip" / "Call driver" / "Cancel" appears contextually under the stage. Not always visible.
- **Smooth state transitions:** the UI morphs between stages without a reload flash — continuity reinforces the "one trip" mental model.

**Don't steal:** the constant upsells. Trip-mode should be monetization-quiet.

### 9. Transit (app)

Live transit departures with countdowns.

**Steal:**
- **Countdown-first presentation:** every stop shows "3 min · 11 min · 28 min" — time-to-next, not schedule. The schedule is a leaky abstraction; time-to-next is the truth.
- **GO button below:** when a route is chosen, a big GO button anchors the screen. Single action always clear.
- **Offline-tolerant display:** last-known countdowns fade with a stale indicator when network drops, rather than going blank. Users can still plan.

**Don't steal:** the settings depth. Three-dots menus layered six deep.

---

## Category D — Wildcard (1)

### 10. Apple Fitness+ workout player

**Rationale:** Fitness+ is the closest commercial analogue to "walk through day 3 of your Rome trip" — a guided, auto-advancing flow where the user follows along without making decisions. A day on a Tripva trip has the same shape: a sequence of moves with transitions, timers, and optional pauses.

**Steal:**
- **Big current move + small next-move preview:** the screen is dominated by "what you're doing now." Below, a small band shows "Up next: lunch at 13:00, 6 min walk."
- **Transition micro-moments:** a soft audio + visual cue at each hand-off ("Nice. Next up — 5-minute walk to Le Marais"). Celebrates completion and primes the next step.
- **Progress ring + elapsed/remaining dual display:** a ring showing the whole day's progress, alongside "2h 14m done · 4h 46m left." Users orient temporally without doing math.
- **Pause = everything freezes:** one tap pauses the whole flow. The day doesn't lose its place. Resume is always obvious.

**Don't steal:** the heart-rate overlay — we don't have biometric data and shouldn't fake context.

---

## Cross-cutting principles extracted

Out of the 10, these themes repeat and deserve first-class treatment in Tripva's DESIGN.md:

1. **Single dominant action per screen.** Duolingo, Headspace, Uber, Fitness+ all share this. The Live tab should be built around one primary thing to do right now.
2. **Countdown > schedule.** Citymapper, Transit, Fitness+, TripIt. When the user is in-the-moment, time-to-next is always more useful than absolute time.
3. **Stage chips for flow context.** Uber, Citymapper. Let users see *where in the overall flow* they are without losing focus on now.
4. **Hero images anchor days emotionally.** Google Trips, Airbnb. A destination photo per day makes the itinerary feel like a journey, not a spreadsheet.
5. **State-aware surface.** Airbnb (pre-arrival vs in-stay), Citymapper (weather-when-relevant), Uber (stage). The UI adapts to where the user is, not what tab they tapped.
6. **Graceful degradation.** Transit's offline-tolerant display. Plans should be visible even when network / backend is flaky — especially for travelers on flaky connections abroad.
7. **Progressive reveal.** Duolingo, Headspace. Future content is visible but not overwhelming. Tomorrow's day is a peek, not a forced decision.

These are the seven patterns to test DESIGN.md against in Phase 3.

---

## Current Tripva vs. reference apps — gap summary

| Pattern | Tripva today | Gap |
|---|---|---|
| One dominant action | "Next Move" card exists but competes with hero, timeline, stats all visible at once | Reduce visual weight of everything else; make NOW card the hero |
| Countdown > schedule | Timeline shows absolute times only | Add "in 14 min" / "leave by 13:50" countdowns to now + next |
| Stage chips | None | Add a flow strip: pre-trip → day 1 → day 2 → ... → return |
| Hero images per day | Day cards have images, but Live tab hero is abstract | Use day-specific destination photo on Live tab |
| State-aware surface | Live tab same pre-trip and on-trip | Adapt: "Trip starts in 3 days" → "Currently in Rome" → "Final day" |
| Graceful degradation | localStorage fallback exists | Extend to work offline mid-trip — critical for travelers |
| Progressive reveal | Days tab shows full list at once | Focus on today; peek tomorrow; hide later days behind a "+" |
