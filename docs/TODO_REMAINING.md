# Remaining work log

**Logged:** 2026-04-21
**Context:** Backend + frontend archetype overhaul is live. This is the queue for what's left.

## Needs Alex action (blockers — I can't do these)
- [ ] **Drop Cloudflare firewall rule `90f3f1a949954f649dbd0b0c700fd855`** — blocks non-MY traffic + CI audit
- [ ] **Stripe keys** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Vercel env
- [ ] **Real affiliate IDs** — Booking.com, GetYourGuide, Trainline, Rentalcars
- [x] ~~Google + Apple OAuth app registration~~ — handled via Supabase managed providers (not separate Google/Apple app reg). Frontend wires `signInWithOAuth({provider})`; Supabase dashboard owns the client-id/secret config.
- [ ] **Real testimonials** — current landing uses fake Jamie/Sofia/David, swap when real users exist

## I can build (executing this session, top→bottom)

Quick wins (≤ 30 min each):
- [x] Edit-trip modal stale `tripMeta` fix — `67a0c3d`
- [x] Scroll-hide bottom nav on Now tab — `3586d7a`

Substantive work:
- [x] Adventure archetype full fields — FE `1ba8a17`, BE `591bb84`
- [x] Nomad archetype full fields — FE `8befc9e`, BE `591bb84`
- [x] Now-tab 5-state machine — FE `bb0fe98`
- [x] Archetype prompt iteration — BE `b9455bf` + `5f7d1d6`. 6 test trips generated; found critical gap: `buildPlanPrompt` (non-streaming /api/plan) was archetype-blind. Wired it up + tuned solo/couple/family/friends/adventure prompts with explicit FAIL-style rules. Post-fix signals: family stroller 0→27, friends Airbnb 0→4 with correct hotel format "(Airbnb — N bedrooms)", adventure gear 0→8.
- [x] Trip sharing OG cards foundation — FE `d1c1ee3` (static meta + JS patch; per-trip CF Worker deferred)
- [x] Packing endpoint unit tests + archetype fixtures — BE `460955d` (11 tests pass)
- [x] PWA install polish — FE `64b93d4` (manifest fix + shortcuts + smart dismiss)

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
