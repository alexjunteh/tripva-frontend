# Tripva Brand Guidelines

_Last updated: 2026-07-18_

---

## 1. Brand Overview

**Name:** Tripva
**Domain:** tripva.app
**Operator:** Futurizta Tech Sdn Bhd
**Twitter:** @tripva
**Contact:** hello@tripva.app

### Positioning

Tripva is an AI trip planner that turns a destination idea into a complete itinerary dashboard in 30 seconds. It is built for travellers who want a usable plan, not a long text answer.

### Brand Posture

**Lifestyle-grade, calm, editorial.** The product should feel like a lifestyle magazine that happens to be an app. Not utility-grade, not gamified, not enterprise.

### Audience

English-speaking millennials 25-40. Solo travelers, couples, friend groups, families, adventure travelers, digital nomads.

---

## 2. Taglines

| Context | Copy |
|---|---|
| **Primary tagline** | Plan a trip in 30 seconds. |
| **Pain-point hook** | Trip planning takes 8 hours. Ours takes 30 seconds. |
| **Hero headline** | Wherever you're going next, _it's ready._ |
| **Hero kicker** | Your next trip -- planned in 30 seconds |
| **Press one-liner** | Tripva is an AI trip planner that turns a destination idea into a complete itinerary dashboard in 30 seconds. |
| **CTA** | Start my trip -- free |
| **CTA nudge** | No credit card. Any destination. |
| **Final CTA** | The hardest part is _deciding where._ The rest takes 30 seconds. |

---

## 3. Logo System

### Primary Wordmark

The Tripva logo is a custom wordmark with three integrated elements:

1. **"Tripv"** in clean sans-serif type
2. **The letter 'a'** rendered as a **red map pin** (`#e8594e`) with a **white lowercase 'a'** inside it — this is the brand's signature element
3. **An airplane trail arc** sweeping underneath the wordmark from left to right, ending near the pin

The dark variant uses white text; the light variant uses dark navy text. The red pin-'a' stays the same color in both.

| Variant | File | Usage |
|---|---|---|
| **Dark background (primary)** | `assets/brand/tripva-nav-logo-dark.png` | Navigation bars, dark surfaces, all marketing |
| **Light background** | `assets/brand/tripva-nav-logo.png` | Light surfaces, print, partner co-branding |
| Publisher logo | `icons/tripva-logo.png` | Schema.org structured data, press kit |

### App Icon / Favicon

A **red map pin** (`#e8594e`) with a **white center circle** on a transparent background. No letter — clean symbol that stays crisp at 16px.

| Asset | File | Size |
|---|---|---|
| SVG source | `icon.svg` | 512x512 viewBox |
| Favicon | `favicon.ico`, `favicon.png` | Multi-size / 32x32 |
| PWA standard | `icons/icon-192.png` | 192x192 |
| PWA large | `icons/icon-512.png` | 512x512 |
| PWA maskable | `icons/icon-maskable-512.png` | 512x512 |

### OG / Social Card

The social preview card features the dark gradient background, the TRIP/VA app icon with stylized plane, the wordmark, and the primary tagline.

| Asset | File | Size |
|---|---|---|
| SVG source | `og-image.svg` | 1200x630 |
| PNG render | `og-image.png` | 1200x630 |

### Logo Usage Rules

**Do:**
- Use the dark variant on dark backgrounds (`#0a0a12` or darker)
- Use the light variant on white or light surfaces
- Maintain clear space of at least 1x the pin height around the logo
- Use the pin icon alone (no 'a') when space is tight (favicon, app icon, notification badge)

**Don't:**
- Place the wordmark on busy photography without a dark overlay
- Rotate, stretch, or recolor the logo or the red pin
- Add effects (drop shadow, glow, outline) to the logo
- Use the logo smaller than 80px wide (wordmark) or 16px (pin icon alone)
- Recreate the logo in a different font
- Use old brand concept explorations from `brand-concepts/` — that folder is an archive of rejected directions

---

## 4. Color System

### Primary Colors

| Name | Hex | RGB | Usage |
|---|---|---|---|
| **Purple** (brand primary) | `#7c6af7` | 124, 106, 247 | Primary CTAs, buttons, accent highlights, active states |
| **Purple Light** | `#a78bfa` | 167, 139, 250 | Links, hover states, eyebrow labels, secondary accent |
| **Indigo** | `#6d5ee0` | 109, 94, 224 | Button gradients (paired with Purple), press states |
| **Pin Red** | `#e8594e` | 232, 89, 78 | App icon only -- not used in UI or marketing |

### Accent Colors

| Name | Hex | Usage |
|---|---|---|
| **Ink Blue** | `#95b5ff` | Soft blue links, peripheral accents, kicker text in OG images |
| **Green** | `#6ee7b7` | Success states, checkmarks, feature ticks, price highlights |
| **Amber** | `#f59e0b` | Warnings, live indicators, star ratings, highlights |
| **Red** | `#f87171` | Error states, destructive actions only |
| **Gold** | `#D4A84B` | "Live/now" warmth indicator, pulsing dot |
| **Info Blue** | `#5AC8FA` | Informational semantic color |

### Background System (dark-only product)

| Name | Hex | Usage |
|---|---|---|
| **Background** | `#0a0a12` | Primary app background, `<meta theme-color>` |
| **Background Dark** | `#080810` | Deeper layer for contrast sections |
| **Background Secondary** | `#0f0f1c` | Demo sections, waitlist, secondary areas |
| **Surface** | `rgba(255,255,255,0.04)` | Card backgrounds, surface elements |
| **Surface 2** | `rgba(255,255,255,0.07)` | Secondary surface, elevated cards |
| **Surface 3** | `#22222f` | Tertiary surface |
| **Card** | `#16162a` | Card fill in trip view |
| **Elevated** | `#21253A` | Elevated surface (modals, sheets) |

### Text Colors

| Name | Value | Usage |
|---|---|---|
| **Primary Text** | `#f0f0f8` | Main body text, headings |
| **Muted** | `rgba(240,240,248,0.55)` | Secondary text, captions, timestamps |
| **Muted 2** | `rgba(240,240,248,0.80)` | Medium-weight secondary text |

### Border Colors

| Name | Value |
|---|---|
| **Border** | `rgba(255,255,255,0.08)` |
| **Border 2** | `rgba(255,255,255,0.14)` |

### Gradients

| Name | Values | Usage |
|---|---|---|
| **CTA gradient** | `#6d5ee0` to `#7c6af7` | Primary submit buttons |
| **OG background** | `#080810` to `#151137` to `#061b25` | Social cards, marketing backgrounds |
| **Brand text** | `#ffffff` to `#c4d9ff` to `#9b87f5` | Display text on dark marketing surfaces |
| **Accent line** | `#7c6af7` to `#6ee7b7` | Decorative accent strokes |

### Blog Category Colors

| Category | Hex |
|---|---|
| Destinations | `#95b8ff` |
| Photo spots | `#6ee7b7` |
| Budget | `#fbbf24` |
| Itineraries | `#c084fc` |

### Shadow Tokens

| Name | Value | Usage |
|---|---|---|
| **Card** | `0 0 0 1px rgba(0,0,0,.06), 0 1px 2px -1px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.12)` | Default card elevation |
| **Elevated** | `0 0 0 1px rgba(0,0,0,.08), 0 4px 12px -2px rgba(0,0,0,.14), 0 8px 24px rgba(0,0,0,.18)` | Modals, sheets, popovers |
| **Purple glow** | `0 0 0 1px rgba(124,106,247,.15), 0 4px 24px rgba(124,106,247,.25)` | Featured cards, active elements |

---

## 5. Typography

### Font Stack

| Role | Font | Weights | Usage |
|---|---|---|---|
| **Display** | Cormorant Garamond | 500, 600, 700, 500i, 600i | Hero headlines, trip names (italic), editorial headings |
| **Body** | DM Sans | 300, 400, 500, 600, 700 | Body text, buttons, UI labels, navigation |
| **System fallback** | -apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Helvetica, Arial | -- | Pages where custom fonts aren't loaded |

### Type Scale

| Token | Size | Usage |
|---|---|---|
| Display | `clamp(2.25rem, 5vw + 1rem, 3.5rem)` (36-56px) | Hero headlines, landing page h1 |
| H1 | `clamp(1.75rem, 3vw + 1rem, 2.5rem)` (28-40px) | Page titles, section headers |
| H2 | `clamp(1.25rem, 1.2vw + 1rem, 1.5rem)` (20-24px) | Subsection headers |
| H3 | `1.125rem` (18px) | Card titles, tertiary headers |
| Body | `1rem` (16px) | Default body text |
| Body small | `0.875rem` (14px) | Captions, metadata, secondary text |
| Label | `0.6875rem` (11px) | Uppercase labels, tracking 0.1em |
| Numeric large | `clamp(2rem, 3vw + 1rem, 3rem)` (32-48px) | Countdowns, stats |

### Line Heights

| Context | Value |
|---|---|
| Display | 1.05 |
| Heading | 1.2 |
| Body | 1.55 |
| Tight | 1.15 |

### Typography Rules

- **Cormorant Garamond** is the editorial voice -- use it for hero text, trip names, and anywhere the brand needs to feel like a magazine
- **DM Sans** handles everything else -- buttons, labels, body, UI
- Never use more than 2 weights on a single screen
- Trip names in italic Cormorant Garamond are a signature brand element
- All-caps text uses letter-spacing of at least 0.08em

---

## 6. Imagery

### Photography Style

- **Editorial travel photography** -- real places, golden hour and blue hour preferred, human scale (people in scenes but not posed stock photos)
- **Destination-forward** -- the location is the hero, not a generic "traveller with backpack" stock image
- Self-hosted destination images at 1024x512px for itinerary day cards
- All landing and demo images must be self-hosted (no Unsplash, Pexels, or external CDN in production)

### Image Treatment

- On dark backgrounds: images sit in cards with `border-radius: 12-16px` and subtle border (`rgba(255,255,255,0.08)`)
- No image filters, overlays, or color tinting unless for text readability
- Hero images use `object-fit: cover` with center gravity
- OG images follow the branded dark gradient template

### What to Avoid

- Generic stock travel photos (person at airport, suitcase on beach)
- Over-saturated or HDR-processed images
- Images with visible watermarks
- AI-generated imagery for destination photos (use real photography)

---

## 7. Spacing & Layout

### Spacing Scale (4px base)

| Token | Value | Usage |
|---|---|---|
| s-1 | 4px | Tight: chip gap, inline icon margin |
| s-2 | 8px | Input padding, compact spacing |
| s-3 | 12px | Component internal padding |
| s-4 | 16px | Card padding, default gap |
| s-5 | 24px | Section gap inside cards |
| s-6 | 32px | Major component spacing |
| s-7 | 48px | Section padding (mobile) |
| s-8 | 64px | Section padding (desktop) |
| s-9 | 96px | Hero breathing room |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| r-s | 8px | Chips, small buttons |
| r-m | 14px | Buttons, inputs |
| r-l | 20px | Cards |
| r-xl | 28px | Bottom sheet, focus cards |
| r-full | 999px | Pills, tags |

### Motion

| Duration | Value | Usage |
|---|---|---|
| Micro | 120ms | Hover, focus states |
| Short | 240ms | Tab switch, chip tap |
| Medium | 420ms | Card enter, slide-in |
| Long | 640ms | Activity transitions |
| Hero | 800ms | Major state changes |

**Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for exits, `cubic-bezier(0.65, 0, 0.35, 1)` for in-out.

### Layout Breakpoints

| Breakpoint | Layout |
|---|---|
| < 480px | Single column, stacked |
| 480-1023px | Single column, wider cards |
| >= 1024px | Desktop: sidebar nav, two-panel days, wider centered content |

---

## 8. Voice & Tone

### Writing Principles

1. **Speed is the story.** Every piece of copy should reinforce that Tripva removes the 8 hours of planning, not that AI is cool.
2. **Calm confidence.** State what the product does. No exclamation marks, no hype words ("amazing!", "incredible!", "game-changing!").
3. **Second person, present tense.** "You tell Tripva where. It builds the plan." Not "Users can leverage our AI-powered platform."
4. **Short sentences.** If a sentence has a comma, consider splitting it.
5. **Concrete over abstract.** "Hotels, day-by-day plan, budget, tickets" beats "comprehensive travel solutions."

### Do

- Lead with the traveller's intent, not the technology
- Use "plan" and "itinerary" (what users think in), not "output" or "generation"
- Reference specific plan components: hotels, budget, tickets, day-by-day, photo spots
- Use contractions naturally (it's, you'll, doesn't)
- Keep CTAs to 4 words or fewer

### Don't

- Use "AI-powered" as a feature -- it's the mechanism, not the benefit
- Write in passive voice ("plans are generated")
- Use emoji in product copy or marketing headlines
- Use filler words: "simply", "just", "easily", "seamlessly"
- Write "Built for adventurers" or any generic travel copy
- Use streak flames, badges, gamification language, or "You did it!" celebration copy
- Add purple gradient backgrounds to marketing materials (it's an accent, not a background)

### Tone by Context

| Context | Tone | Example |
|---|---|---|
| Landing page | Confident, editorial | "Trip planning takes 8 hours everywhere else. Here it takes 30 seconds." |
| Error/empty states | Helpful, brief | "That trip page is gone. Start a fresh itinerary or open the live demo." |
| Onboarding | Direct, no handholding | "Tell Tripva your dream. The AI builds the whole itinerary." |
| Blog | Expert, warm | "Expert itineraries, hidden gems, and real traveller tips." |
| Press | Factual, precise | "Tripva is for travellers who want the speed of AI and the structure of a real itinerary." |

---

## 9. Social Media

### Handles

| Platform | Handle |
|---|---|
| Twitter/X | @tripva |
| Domain | tripva.app |
| Email | hello@tripva.app |

### Social Image Specs

| Platform | Size | Template |
|---|---|---|
| OG / Twitter card | 1200x630 | `og-image.svg` -- dark gradient, wordmark, tagline |
| Per-trip OG | 1200x630 | Dynamic via `/api/og` -- trip hero photo, destination, dates |

### Social Post Style

- Lead with the destination or traveller pain point, not the product
- Use the primary tagline or pain-point hook as the anchor
- One clear CTA per post
- No emoji-heavy or hashtag-stuffed posts
- Photography over illustrations

---

## 10. Anti-Patterns (Explicitly Banned)

These patterns are incompatible with Tripva's brand:

| Pattern | Why |
|---|---|
| Emoji mascots | Not lifestyle-grade |
| "You did it!" hype copy | Gamified, not editorial |
| Streak flames / badges | Gamification |
| "Built for adventurers" | Generic, says nothing |
| Purple gradient backgrounds | Purple is an accent, not a surface |
| Stock "person at airport" photos | Generic, not destination-forward |
| Exclamation-heavy copy | Undermines calm confidence |
| Feature-list marketing ("AI-powered, cloud-based, enterprise-grade") | Tech jargon over user benefit |
| Rounded-bubbly illustration style | Doesn't match editorial serif typography |

---

## 11. Brand Kit File Index

```
tripva-frontend/
  icon.svg                              # App icon SVG source (512x512)
  favicon.ico                           # Multi-size favicon
  favicon.png                           # 32x32 PNG favicon
  logo.svg                              # Full wordmark SVG (embedded PNG)
  logo-inverse.svg                      # Inverse wordmark SVG
  og-image.svg                          # Social card SVG template (1200x630)
  og-image.png                          # Social card PNG render
  assets/brand/
    tripva-nav-logo-dark.png            # Nav logo for dark backgrounds
    tripva-nav-logo.png                 # Nav logo for light backgrounds
  icons/
    icon-192.png                        # PWA icon 192x192
    icon-512.png                        # PWA icon 512x512
    icon-maskable-512.png               # PWA maskable icon
    tripva-logo.png                     # Publisher/schema.org logo
  brand-concepts/                       # ARCHIVE — rejected explorations, do NOT use
  press-kit/
    tripva-press-kit.zip                # Downloadable press kit
    screenshots/                        # Desktop + mobile screenshots
    video/exports/                      # Demo videos (16:9, 1:1, 9:16)
```

---

## 12. Quick Reference Card

For fast brand decisions on any new marketing asset:

| Element | Value |
|---|---|
| Primary color | `#7c6af7` (purple) |
| Background | `#0a0a12` (near-black) |
| Text | `#f0f0f8` (warm white) |
| Accent | `#95b5ff` (ink blue) |
| Success | `#6ee7b7` (green) |
| Display font | Cormorant Garamond, serif |
| Body font | DM Sans, sans-serif |
| Tagline | Plan a trip in 30 seconds. |
| CTA | Start my trip -- free |
| Tone | Calm, confident, editorial |
| Photography | Editorial travel, destination-forward, self-hosted |
| Never | Emoji mascots, hype copy, purple backgrounds, stock photos |
