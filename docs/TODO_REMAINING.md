# Tripva Remaining Launch Work

**Updated:** 2026-06-25

## Local Status

- Backend tests pass: 11 files, 86 tests.
- Frontend E2E passes: 16/16 across Chromium and Firefox.
- Local launch route audit passes: 25 routes, 50 desktop/mobile checks, 41 same-origin links, zero broken links, zero missing images, zero console/page errors.
- Press kit zip is rebuilt with current logo/icon assets and final 30-second MP4 demo videos.

## Approval-Gated Before Production Launch

- [ ] Deploy latest frontend assets and fixes.
- [ ] Align `tripva.app` apex with the latest `www.tripva.app` / Vercel artifact. Current live check shows apex is stale while `www` matches newer local copy.
- [ ] Sync production Vercel env vars after Alex approval.

## Production Env Audit Snapshot

Read-only audit on 2026-06-25 found production has:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `ALLOWED_ORIGIN`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`
- `PUSH_CRON_TOKEN`
- `PEXELS_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `SERPAPI_KEY`
- `TRAVELPAYOUTS_TOKEN`
- `TRAVELPAYOUTS_MARKER`
- `AWIN_ACCESS_TOKEN`
- `AWIN_PUBLISHER_ID`
- `RAPIDAPI_KEY`

Missing from production compared with `.env.example`:

- `GYG_PARTNER_ID`
- `KLOOK_AID`
- `TRIPCOM_ALLIANCE_CODE`
- `KIWI_AFFILIATE_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO`
- `ADMIN_EMAILS`

Stripe remains skippable for initial launch because endpoints return graceful 503 responses without it. Affiliate/admin env sync still needs explicit approval before mutation.

## Public Launch Actions

These are prepared but require explicit approval before execution:

- Product Hunt post
- Show HN post
- Reddit posts
- Twitter/X thread
- IndieHackers post
- Micro-creator DMs
