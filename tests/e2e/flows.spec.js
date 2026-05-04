// @ts-check
const { test, expect } = require('@playwright/test');

const BACKEND = 'https://tripai-backend.vercel.app';

// ── Shared mock data ─────────────────────────────────────────────────────────

// Use Tbilisi — NOT in the curated SPOT_DATA list (rome/paris/tokyo/etc.), so the
// API mock is actually exercised. Curated destinations use hardcoded data and bypass
// the fetch entirely, producing a different card count and defeating the mock assertion.
const SPOT_DEST = 'Tbilisi';

const MOCK_SPOTS = {
  spots: [
    { name: 'Narikala Fortress', description: 'Ancient hilltop citadel watching over the Kura river gorge.', category: 'landmark', wikiSlug: 'Narikala' },
    { name: 'Old Town Tbilisi', description: 'Crumbling balconied houses and sulfur baths in a maze of cobblestones.', category: 'culture', wikiSlug: 'Abanotubani' },
    { name: 'Holy Trinity Cathedral', description: 'Sameba — Georgia\'s golden-domed centerpiece rising above the city.', category: 'temple', wikiSlug: 'Holy_Trinity_Cathedral_of_Tbilisi' },
    { name: 'Rustaveli Avenue', description: 'The elegant heart of the city — theatres, galleries, and Georgian wine bars.', category: 'street', wikiSlug: 'Rustaveli_Avenue' },
    { name: 'Bridge of Peace', description: 'Glass-and-steel pedestrian bridge glowing neon over the Kura at night.', category: 'landmark', wikiSlug: 'Bridge_of_Peace,_Tbilisi' },
    { name: 'Mtatsminda Park', description: 'Funicular to the hilltop park with the best panoramic view of the city.', category: 'view', wikiSlug: 'Mtatsminda' },
    { name: 'Dezerter Bazaar', description: 'The chaotic, colourful soul of Tbilisi — spices, churchkhela, and cheese.', category: 'market', wikiSlug: 'Dezerter_Bazaar' },
    { name: 'Gori-Jvari Monastery', description: 'Sixth-century monastery perched on a cliff where two rivers meet.', category: 'temple', wikiSlug: 'Jvari_Monastery' },
  ],
};

// Minimal valid plan — has budget so the budget-heal patch call is skipped
const MOCK_PLAN = {
  trip: {
    id: 'test-paris-couple-e2e',
    name: 'Paris Couple Getaway',
    destination: 'Paris',
    dates: 'Next week',
    people: 2,
    budget: '$3,000 total',
    days: 3,
    emoji: '🗼',
    heroSeed: 'paris',
  },
  days: [
    {
      day: 1,
      title: 'Arrival in Paris',
      subtitle: 'Check in, evening stroll',
      emoji: '✈️',
      heroSeed: 'paris',
      imageUrl: '',
      timeline: [
        { time: '14:00', title: 'Arrive at CDG', detail: 'Take RER B to centre.', type: 'transport' },
        { time: '16:00', title: 'Check in', detail: 'Boutique hotel in Montmartre.', type: 'hotel' },
      ],
      highlights: ['Sacré-Cœur'],
      photos: [],
    },
    {
      day: 2,
      title: 'Iconic Paris',
      subtitle: 'Eiffel Tower, Champs-Élysées',
      emoji: '🗼',
      heroSeed: 'paris',
      imageUrl: '',
      timeline: [
        { time: '10:00', title: 'Eiffel Tower', detail: 'Pre-book summit tickets.', type: 'activity' },
        { time: '13:00', title: 'Lunch near Trocadéro', detail: 'River views.', type: 'food' },
      ],
      highlights: [],
      photos: [],
    },
    {
      day: 3,
      title: 'Art & Departure',
      subtitle: 'Louvre, fly home',
      emoji: '🖼️',
      heroSeed: 'louvre',
      imageUrl: '',
      timeline: [
        { time: '09:00', title: 'Louvre', detail: 'Book timed entry online.', type: 'activity' },
        { time: '15:30', title: 'Head to CDG', detail: 'RER B, allow 60 min.', type: 'transport' },
      ],
      highlights: [],
      photos: [],
    },
  ],
  hotels: [
    { city: 'Paris', name: 'Hotel Montmartre Arts', nights: 3, price: '€120/night', tier: 'mid' },
  ],
  budget: [
    { label: 'Flights (return, 2 pax)', amount: '$1,200', note: 'Economy return', status: 'pending', category: 'transport' },
    { label: 'Hotel (3 nights)', amount: '$360', note: 'Hotel Montmartre Arts', status: 'pending', category: 'accommodation' },
    { label: 'Food & activities', amount: '$600', note: 'Meals, entries, transport', status: 'pending', category: 'misc' },
  ],
  urgent: [],
  tickets: [],
  mapStops: [{ name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'visit' }],
  mapRoute: [],
};

function makeSseBody(plan) {
  const start = `data: ${JSON.stringify({ type: 'start', message: 'Planning your Paris trip…' })}\n\n`;
  const done = `data: ${JSON.stringify({ type: 'done', data: { plan } })}\n\n`;
  return start + done;
}

function isoDate(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fillPlanForm(page, { dest = 'Paris', budget = '$3000' } = {}) {
  await page.fill('#f-dest', dest);
  await page.fill('#f-start', isoDate(7));
  await page.fill('#f-end', isoDate(10));
  await page.fill('#f-budget', budget);
  // Select at least one interest chip
  const chip = page.locator('#f-interests .chip-int').first();
  await chip.click();
  // Select travel archetype
  const arch = page.locator('.arch-pill').first();
  if (await arch.isVisible()) await arch.click();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Tripva E2E flows', () => {

  // ── 1. Homepage loads ────────────────────────────────────────────────────────
  test('homepage — h1 and CTA button are visible', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('.hero h1');
    await expect(h1).toBeVisible();
    await expect(h1).not.toBeEmpty();
    await expect(page.locator('.nav-cta').first()).toBeVisible();
  });

  // ── 2. SPOT SELECTOR — critical flow guard ───────────────────────────────────
  // This test ensures the spot selector appears between form submit and generation.
  // If this test fails, the spot selector is broken (e.g. API timeout, empty response,
  // silent fallthrough, or form validation blocking the flow).
  test('spot selector — appears after submit, spots load, selection gates generation', async ({ page }) => {
    // Mock /api/spots so the test is fast, free, and deterministic
    await page.route(`${BACKEND}/api/spots**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(MOCK_SPOTS),
      });
    });
    // Also mock /api/photospot (Vercel rewrites /api/spots → /api/photospot?selector=1)
    await page.route(`${BACKEND}/api/photospot**`, async route => {
      const url = route.request().url();
      if (url.includes('selector=1')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(MOCK_SPOTS),
        });
      } else {
        await route.continue();
      }
    });
    // Do NOT mock Wikipedia — let real fetches happen so blank/wrong-image bugs are caught.
    // Cards should always show at least loremflickr (instant placeholder) even if wiki is slow.

    await page.goto('/plan.html');
    await fillPlanForm(page, { dest: SPOT_DEST, budget: '$3000' });

    // Submit the form
    await page.click('#submitBtn');

    // CRITICAL ASSERTION: spot screen must appear before generation screen
    await expect(page.locator('#spotScreen')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#genScreen')).not.toBeVisible();

    // Spot cards must render
    await expect(page.locator('#spotGrid .spot-card')).toHaveCount(8, { timeout: 10_000 });

    // Cards must NOT be blank — every card must have a non-empty img src (loremflickr at minimum)
    await expect(page.locator('#spotGrid .spot-card img.loaded').first()).toBeVisible({ timeout: 8_000 });

    // The "Generate" button in spot footer should be visible
    await expect(page.locator('.spot-go-btn')).toBeVisible();

    // Select 3 spots
    const cards = page.locator('#spotGrid .spot-card');
    await cards.nth(0).click();
    await cards.nth(1).click();
    await cards.nth(2).click();

    // Footer count should reflect selection (#spotCountRow shows "3 places selected…")
    await expect(page.locator('#spotCountRow')).toContainText('3', { timeout: 2_000 });

    // Now mock /api/plan before clicking generate
    await page.route(`${BACKEND}/api/plan**`, async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: makeSseBody(MOCK_PLAN),
      });
    });
    await page.route(`${BACKEND}/api/patch**`, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify(MOCK_PLAN) });
    });
    await page.route(`${BACKEND}/api/user/magic-link**`, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    // Click generate, then handle the email gate modal that appears post-generation
    await page.locator('.spot-go-btn').click();

    // Wait for auth email gate to appear, fill email, submit, then wait for redirect
    await expect(page.locator('#authModalBg.open')).toBeVisible({ timeout: 20_000 });
    await page.fill('#authEmailInput', 'test@e2e.example.com');
    await Promise.all([
      page.waitForURL(/\/trip(\.html)?(\?|$)/, { timeout: 15_000 }),
      page.locator('#authSubmitBtn').click(),
    ]);

    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10_000 });
  });

  // ── 3. Trip generation — direct SSE stream (no spot selector, uses ?skipSpots) ─
  test('trip generation — form submit streams SSE, dashboard renders', async ({ page }) => {
    await page.route(`${BACKEND}/api/plan**`, async route => {
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*',
        },
        body: makeSseBody(MOCK_PLAN),
      });
    });
    await page.route(`${BACKEND}/api/patch**`, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify(MOCK_PLAN) });
    });
    await page.route(`${BACKEND}/api/user/magic-link**`, async route => {
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });
    // Mock spots so selector loads fast, then immediately click generate
    await page.route(`${BACKEND}/api/spots**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(MOCK_SPOTS),
      });
    });
    await page.route(`${BACKEND}/api/photospot**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(MOCK_SPOTS),
      });
    });

    await page.goto('/plan.html');
    await fillPlanForm(page, { dest: SPOT_DEST, budget: '$3000' });

    await page.click('#submitBtn');

    // Wait for spot screen, then immediately click generate (0 spots selected is OK)
    await expect(page.locator('#spotScreen')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#spotGrid .spot-card')).toHaveCount(8, { timeout: 10_000 });

    // Click generate, handle email gate, then wait for redirect
    await page.locator('.spot-go-btn').click();
    await expect(page.locator('#authModalBg.open')).toBeVisible({ timeout: 20_000 });
    await page.fill('#authEmailInput', 'test@e2e.example.com');
    await Promise.all([
      page.waitForURL(/\/trip(\.html)?(\?|$)/, { timeout: 15_000 }),
      page.locator('#authSubmitBtn').click(),
    ]);

    await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#tab-days')).toBeVisible();
  });

  // ── 4. Shared trip URL — viewer banner shown to unauthenticated user ──────────
  test('shared trip URL — viewer banner shown to unauthenticated cold visitor', async ({ page }) => {
    const SHARED_ID = 'e2e-demo-shared-paris-2026';
    await page.route(`${BACKEND}/api/trip**`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rawPlan: MOCK_PLAN }),
      });
    });
    await page.goto('/trip.html');
    await page.evaluate(() => {
      localStorage.removeItem('tripva_session');
      localStorage.setItem('tripva_plan', JSON.stringify({
        trip: { id: 'my-own-completely-different-trip', name: 'My Rome Trip' },
        days: [],
      }));
    });
    await page.goto(`/trip.html?id=${SHARED_ID}`);
    await expect(page.locator('#viewerBanner')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.viewer-banner-cta')).toBeVisible();
  });

  // ── 5. Auth gate ─────────────────────────────────────────────────────────────
  test('mytrips — shows login prompt when no session exists', async ({ page }) => {
    await page.goto('/mytrips.html');
    await expect(page.locator('#authSection')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#authEmail')).toBeVisible();
    await expect(page.locator('#authSendBtn')).toBeVisible();
  });

  // ── 6. Mobile viewport ───────────────────────────────────────────────────────
  test.describe('mobile viewport (375×812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('homepage renders correctly on mobile', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('.hero h1')).toBeVisible();
    });

    test('trip dashboard renders correctly on mobile', async ({ page }) => {
      await page.goto('/trip.html?demo=1');
      await expect(page.locator('.bottom-nav')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('#tab-days')).toBeVisible();
    });

    test('spot selector is usable on mobile', async ({ page }) => {
      await page.route(`${BACKEND}/api/spots**`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(MOCK_SPOTS),
        });
      });
      await page.route(`${BACKEND}/api/photospot**`, async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify(MOCK_SPOTS),
        });
      });
      await page.goto('/plan.html');
      await fillPlanForm(page, { dest: SPOT_DEST, budget: '$3000' });
      await page.click('#submitBtn');
      await expect(page.locator('#spotScreen')).toBeVisible({ timeout: 10_000 });
      await expect(page.locator('#spotGrid .spot-card')).toHaveCount(8, { timeout: 10_000 });
      // Cards must be tappable on mobile
      await page.locator('#spotGrid .spot-card').first().click();
      await expect(page.locator('#spotCountRow')).toContainText('1');
    });
  });
});
