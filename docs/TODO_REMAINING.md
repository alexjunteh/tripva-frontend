# Remaining work log

**Logged:** 2026-04-21
**Context:** Backend + frontend archetype overhaul is live. This is the queue for what's left.

## Needs Alex action (blockers — I can't do these)
- [ ] **Drop Cloudflare firewall rule `90f3f1a949954f649dbd0b0c700fd855`** — blocks non-MY traffic + CI audit
- [ ] **Stripe keys** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel env
- [ ] **Real affiliate IDs** — Booking.com, GetYourGuide, Trainline, Rentalcars
- [ ] **Google + Apple OAuth app registration** — needed for one-tap signup wiring
- [ ] **Real testimonials** — current landing uses fake Jamie/Sofia/David, swap when real users exist

## I can build (executing this session, top→bottom)

Quick wins (≤ 30 min each):
- [ ] Edit-trip modal stale `tripMeta` fix — should repopulate from `plan.trip` on open
- [ ] Scroll-hide bottom nav on Now tab (DESIGN.md principle 1 — maximize FocusCard)

Substantive work:
- [ ] Adventure archetype full fields (`activity_types[]`, `fitness_level`, `gear_owned[]`) — both frontend + backend
- [ ] Nomad archetype full fields (`work_hours_per_week`, `wifi_requirement`, `cowork_preferred`) — both frontend + backend
- [ ] Now-tab 5-state machine: travel-day + final-day + post-trip refinements
- [ ] Archetype prompt iteration — generate 6 test trips, compare, tune `getArchetypeInstruction` on any gaps
- [ ] Trip sharing OG cards (dynamic Open-Graph images per trip)
- [ ] Packing endpoint unit tests + archetype fixtures
- [ ] PWA install polish — custom prompt, app icon, offline shell

Deferred (intentionally — see why):
- App-shell 8→5 tab merge — surgery on 4.5k-line `trip.html`, needs dedicated session with careful regression testing
- Vercel AI SDK migration — project-wide backend refactor (`ai` + `@ai-sdk/openai`), scope larger than a polish session
- Six-archetype Watch demo loops on landing — content-heavy (needs 6× 15-second product videos)
- Search/browse public landing pages — strategic decision about SEO strategy

## Rules this session
- Visual audit (`./tests/visual/audit.sh --quick`) after every commit that touches production HTML
- If audit fails, fix until it passes; don't ship broken
- Commit each distinct fix atomically
- Keep this doc updated (check off items as they ship)
