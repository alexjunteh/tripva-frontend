#!/usr/bin/env python3
"""gen_campaign_images.py — Generate Tripva FB/IG campaign images via Codex OAuth (GPT-Image-2).

Uses the FuturiztaOS Codex OAuth pipeline to generate marketing creatives
for the Tripva Facebook + Instagram campaign.

Usage:
  python3 scripts/gen_campaign_images.py                    # generate all
  python3 scripts/gen_campaign_images.py --posts 1 3 5      # specific posts only
  python3 scripts/gen_campaign_images.py --list              # show all post prompts
"""
from __future__ import annotations

import argparse
import base64
import io
import json
import sys
import time
import urllib.request
from pathlib import Path

from PIL import Image

CODEX_AUTH = Path.home() / ".codex" / "auth.json"
CODEX_URL = "https://chatgpt.com/backend-api/codex/responses"
OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "campaign"

BRAND_INSTRUCTION = (
    "You are a world-class travel brand creative director. "
    "You produce editorial, lifestyle-grade marketing images for Tripva — "
    "an AI trip planner (tripva.app). "
    "Brand style: calm confidence, magazine-quality, destination-forward. "
    "Color palette: deep navy/dark backgrounds (#0a0a12), accent purple (#7c6af7), "
    "warm red (#e8594e for the brand pin icon). "
    "Typography feel: modern serif + clean sans-serif. "
    "NO emoji, NO gamification, NO stock photo aesthetic, NO hype. "
    "Images should feel like high-end travel magazine editorial spreads. "
    "Real photography aesthetic — even when generated, images must look like "
    "they could appear in Conde Nast Traveler or Monocle."
)

POSTS = [
    {
        "id": 1,
        "name": "launch-announcement",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "A premium dark marketing graphic for a travel app launch. "
            "Deep navy-black background (#0a0a12). Center: a modern smartphone (edge-to-edge screen) "
            "displaying a clean trip dashboard interface with a Tokyo itinerary — showing day cards, "
            "a map pin, hotel listing, and schedule blocks in soft purple (#7c6af7) and warm white tones. "
            "Behind the phone: a subtle atmospheric glow in soft purple gradient. "
            "The overall mood is calm, premium, editorial — like a luxury tech product announcement. "
            "No text overlays, no logos, no UI chrome outside the phone screen. "
            "Photorealistic rendering, studio-quality lighting with subtle rim light on the phone edges."
        ),
    },
    {
        "id": 2,
        "name": "before-after",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "A split-screen marketing comparison image. "
            "LEFT HALF: chaos — a laptop screen showing 15+ browser tabs open, sticky notes scattered, "
            "a messy desk with a phone showing Google Maps, printed hotel confirmations, "
            "a stressed person's hands on keyboard. Warm cluttered lighting, slight visual noise. "
            "RIGHT HALF: calm — a single phone on a clean marble surface showing a beautiful "
            "trip dashboard with an organized Paris itinerary (day cards, map, hotel). "
            "Clean lighting, breathing room, a coffee cup nearby. "
            "The contrast should be stark: overwhelm vs simplicity. "
            "Thin vertical divider line between halves. Photorealistic, editorial quality."
        ),
    },
    {
        "id": 3,
        "name": "santorini-destination",
        "size": "1024x1280",
        "out_px": (1080, 1350),
        "prompt": (
            "Santorini, Greece — editorial travel photography. "
            "Golden hour view from Oia: white-washed buildings cascading down the caldera cliff, "
            "famous blue-domed churches, deep Aegean Sea in the background turning amber-gold. "
            "A couple walking along a narrow stone path, seen from behind (small in frame — "
            "the landscape is the hero). Warm golden light, long shadows. "
            "Shot composition: slightly wide angle, leading lines from the path. "
            "Quality: Conde Nast Traveler cover worthy. Natural, not oversaturated. "
            "No text, no overlays, no logos."
        ),
    },
    {
        "id": 4,
        "name": "planner-friend",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "A relatable lifestyle scene: a group of four friends (diverse, mid-20s to 30s) "
            "sitting at a cafe table. Three friends are relaxed, laughing, drinking coffee. "
            "The fourth friend (the trip planner) is stressed, hunched over a laptop with "
            "multiple browser tabs visible, phone in other hand showing a map app, "
            "notebook with scribbled lists. The contrast between the relaxed friends and "
            "the overwhelmed planner should be humorous but sympathetic. "
            "Warm natural cafe lighting, lifestyle photography aesthetic. "
            "Shot like a candid editorial moment. No text overlays."
        ),
    },
    {
        "id": 5,
        "name": "bali-destination",
        "size": "1024x1280",
        "out_px": (1080, 1350),
        "prompt": (
            "Bali, Indonesia — editorial travel photography. "
            "Tegallalang Rice Terraces at early morning golden hour. "
            "Lush emerald green cascading terraces filling the frame, "
            "palm trees creating natural framing at edges, "
            "soft morning mist in the valley below. "
            "A single person walking along a narrow terrace path (small in frame, "
            "wearing light travel clothing). "
            "Natural warm light filtering through palm fronds. "
            "Shot composition: slightly elevated angle showing the depth of terraces. "
            "Quality: National Geographic travel feature. Natural color grading, "
            "rich greens without being oversaturated. No text, no overlays."
        ),
    },
    {
        "id": 6,
        "name": "ai-comparison",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "A marketing comparison image for a travel app. Clean dark background (#0a0a12). "
            "LEFT: a phone screen showing a generic AI chat interface with a long wall of "
            "plain text — a boring paragraph-style trip plan with no structure, no images, "
            "no organization. The text should look dense and uninviting. "
            "RIGHT: another phone screen showing a beautiful trip dashboard with organized "
            "day cards, colorful destination photos, hotel cards with star ratings, "
            "a budget section, and a small map — vibrant and organized with purple (#7c6af7) accents. "
            "Both phones float on the dark background with subtle shadow. "
            "The visual message: raw AI text vs usable dashboard. "
            "Clean studio lighting, premium product photography feel."
        ),
    },
    {
        "id": 7,
        "name": "kyoto-destination",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "Kyoto, Japan — editorial travel photography. "
            "Fushimi Inari shrine's famous vermilion torii gates at dawn. "
            "Endless tunnel of bright orange-red gates receding into soft golden morning light. "
            "Completely empty path (early morning, no tourists). "
            "Dappled sunlight filtering through gaps between gates. "
            "Shot from inside the tunnel looking forward — strong leading lines. "
            "A single person in the far distance walking through the gates (tiny figure, "
            "creating scale). Quality: award-winning travel photography. "
            "Rich warm reds and golds, natural light. No text, no overlays."
        ),
    },
    {
        "id": 8,
        "name": "iceland-adventure",
        "size": "1024x1280",
        "out_px": (1080, 1350),
        "prompt": (
            "Iceland — editorial travel photography. "
            "Jokulsarlon glacier lagoon: massive blue-white icebergs floating in still water, "
            "reflecting the dramatic sky. In the foreground, Diamond Beach — "
            "crystal-clear ice chunks scattered on black volcanic sand. "
            "A lone photographer standing at the water's edge (small figure, creating scale). "
            "Overcast sky with dramatic silver-blue light breaking through clouds. "
            "The mood: vast, humbling, otherworldly. "
            "Shot composition: wide angle, low horizon line. "
            "Quality: high-end landscape photography. Natural cold blue tones. "
            "No text, no overlays."
        ),
    },
    {
        "id": 9,
        "name": "couples-trip",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "A couple sitting together on a balcony overlooking a Mediterranean coastal town "
            "at golden hour. They are sharing a single tablet between them, both looking "
            "at the screen which shows a clean trip itinerary interface. "
            "The view behind them: terracotta rooftops, a harbor with small boats, "
            "warm golden evening light. They look relaxed, collaborative, happy — "
            "the planning is easy, not stressful. A simple clean stone balcony railing, "
            "no table, no glasses, no food — just the couple, the tablet, and the view. "
            "Editorial lifestyle photography, warm tones, shallow depth of field "
            "on the background. Candid moment. No text, no overlays."
        ),
    },
    {
        "id": 10,
        "name": "solo-traveler",
        "size": "1024x1280",
        "out_px": (1080, 1350),
        "prompt": (
            "A solo female traveler (late 20s) walking through a narrow European old town alley "
            "— cobblestones, weathered stone buildings, hanging flower baskets. "
            "She is casually glancing at her phone (trip dashboard visible but not the focus), "
            "looking confident and relaxed. Small daypack, travel clothing. "
            "Warm afternoon light creating long shadows down the alley. "
            "Shot from behind at slight angle — she is walking away from camera into "
            "the beautiful alley. The mood: independence, confidence, adventure. "
            "Editorial travel photography. Natural warm tones. "
            "No text, no overlays."
        ),
    },
    {
        "id": 11,
        "name": "barcelona-food",
        "size": "1024x1024",
        "out_px": (1080, 1080),
        "prompt": (
            "Barcelona food scene — editorial food + travel photography. "
            "A vibrant pintxos spread at a tapas bar in Poble Sec. "
            "Multiple small plates: patatas bravas, jamón ibérico on crusty bread, "
            "grilled octopus, pan con tomate, small glasses of cava. "
            "Rustic wooden bar counter, warm ambient lighting, "
            "blurred background showing the lively bar scene. "
            "Overhead-angle food photography, natural and appetizing. "
            "Quality: Bon Appetit or Eater feature. "
            "No text, no overlays, no branded elements."
        ),
    },
    {
        "id": 12,
        "name": "queenstown-adventure",
        "size": "1024x1280",
        "out_px": (1080, 1350),
        "prompt": (
            "Queenstown, New Zealand — editorial adventure photography. "
            "Lake Wakatipu with The Remarkables mountain range reflected in still morning water. "
            "A kayaker on the lake (small figure, creating scale). "
            "Dawn light painting the snow-capped peaks in pink and gold. "
            "Crystal clear turquoise-blue lake water in the foreground. "
            "Shot composition: panoramic feel with strong reflection symmetry. "
            "Quality: Tourism New Zealand campaign photography. "
            "Vivid natural colors. No text, no overlays."
        ),
    },
]


def load_token() -> str:
    data = json.loads(CODEX_AUTH.read_text())
    return data["tokens"]["access_token"]


def generate_one(access_token: str, prompt: str, gen_size: str) -> Image.Image:
    content = [{"type": "input_text", "text": prompt}]

    payload = json.dumps({
        "model": "gpt-5.5",
        "store": False,
        "stream": True,
        "instructions": BRAND_INSTRUCTION,
        "tools": [{"type": "image_generation", "size": gen_size,
                    "quality": "high", "output_format": "png"}],
        "input": [{"role": "user", "content": content}],
    }).encode()

    req = urllib.request.Request(
        CODEX_URL, data=payload,
        headers={"Authorization": f"Bearer {access_token}",
                 "Content-Type": "application/json"},
    )

    final_b64 = None
    with urllib.request.urlopen(req, timeout=180) as resp:
        for raw in resp:
            line = raw.decode().strip()
            if not line.startswith("data: "):
                continue
            try:
                ev = json.loads(line[6:])
            except Exception:
                continue
            t = ev.get("type", "")
            if t == "response.image_generation_call.partial_image":
                final_b64 = ev.get("partial_image_b64", "")
            elif t == "response.completed":
                break
            elif t == "response.failed":
                raise RuntimeError(f"Generation failed: {ev}")

    if not final_b64:
        raise RuntimeError("No image data received")

    padding = (4 - len(final_b64) % 4) % 4
    img_bytes = base64.b64decode(final_b64 + "=" * padding)
    return Image.open(io.BytesIO(img_bytes)).convert("RGB")


def resize_to_spec(img: Image.Image, out_px: tuple[int, int]) -> Image.Image:
    tw, th = out_px
    iw, ih = img.size
    scale = max(tw / iw, th / ih)
    new_w, new_h = int(iw * scale), int(ih * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - tw) // 2
    top = (new_h - th) // 2
    return img.crop((left, top, left + tw, top + th))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--posts", nargs="+", type=int, help="Generate specific post IDs only")
    parser.add_argument("--list", action="store_true", help="List all posts and exit")
    args = parser.parse_args()

    if args.list:
        for p in POSTS:
            print(f"  Post {p['id']:2d}: {p['name']} ({p['size']} → {p['out_px'][0]}x{p['out_px'][1]})")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    access_token = load_token()

    targets = POSTS
    if args.posts:
        targets = [p for p in POSTS if p["id"] in args.posts]

    print(f"Generating {len(targets)} campaign images...")

    for i, post in enumerate(targets, 1):
        out_path = OUT_DIR / f"post{post['id']:02d}_{post['name']}.png"
        if out_path.exists():
            print(f"  [{i}/{len(targets)}] Skip {post['name']} (exists)")
            continue

        print(f"  [{i}/{len(targets)}] Generating {post['name']} ({post['size']})...")
        try:
            img = generate_one(access_token, post["prompt"], post["size"])
            img = resize_to_spec(img, post["out_px"])
            img.save(str(out_path), "PNG", optimize=True)
            print(f"    → Saved {out_path.name} ({post['out_px'][0]}x{post['out_px'][1]})")
        except Exception as e:
            print(f"    ERROR: {e}", file=sys.stderr)

        if i < len(targets):
            time.sleep(2)

    print(f"\nDone. Images saved to: {OUT_DIR}")


if __name__ == "__main__":
    main()
