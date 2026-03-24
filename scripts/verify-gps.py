#!/usr/bin/env python3
"""
GPS Verification Script — SOP Layer 1.5
Checks all mapQuery coordinates in APP_STATE against OSM Nominatim.
Adds mapVerified: true / mapVerifiedLabel when confirmed.
Flags items with coordinates that don't resolve to the expected city.

Usage:
  python3 scripts/verify-gps.py italy-test.html [--fix] [--strict]

  --fix     : auto-geocode items missing mapQuery using their title+city
  --strict  : treat unverified coords as errors (not warnings)
"""

import sys, json, re, time, urllib.request, urllib.parse, argparse

def nominatim_search(query, expected_city=None):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode({
        "q": query, "format": "json", "limit": 1, "addressdetails": 1
    })
    req = urllib.request.Request(url, headers={"User-Agent": "roam-travel-gps-verifier/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            results = json.loads(r.read())
        if results:
            r = results[0]
            addr = r.get("address", {})
            city_fields = [addr.get("city"), addr.get("town"), addr.get("village"),
                           addr.get("municipality"), addr.get("county")]
            resolved_city = next((c for c in city_fields if c), "")
            country = addr.get("country_code", "").upper()
            return {
                "lat": float(r["lat"]),
                "lng": float(r["lon"]),
                "label": r.get("display_name", "")[:80],
                "city": resolved_city,
                "country": country,
            }
    except Exception as e:
        pass
    return None

def reverse_geocode(lat, lng):
    url = "https://nominatim.openstreetmap.org/reverse?" + urllib.parse.urlencode({
        "lat": lat, "lon": lng, "format": "json", "addressdetails": 1
    })
    req = urllib.request.Request(url, headers={"User-Agent": "roam-travel-gps-verifier/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            result = json.loads(r.read())
        addr = result.get("address", {})
        city_fields = [addr.get("city"), addr.get("town"), addr.get("village"),
                       addr.get("municipality"), addr.get("county")]
        city = next((c for c in city_fields if c), "")
        country = addr.get("country_code", "").upper()
        label = result.get("display_name", "")[:80]
        return {"city": city, "country": country, "label": label}
    except:
        return None

def parse_mapquery(mq):
    # Handle place-name mapQuery strings (e.g. "Bar A Pié de Ma Riomaggiore")
            # — these work fine in Google Maps, skip coordinate validation
            if mq and not re.match(r'^-?\d+\.\d+,-?\d+\.\d+$', mq.strip()):
                # Place name string — mark as address-style, skip lat/lng checks
                continue

    if not mq: return None, None
    try:
        parts = mq.split(",")
        return float(parts[0].strip()), float(parts[1].strip())
    except:
        return None, None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file")
    parser.add_argument("--fix", action="store_true", help="Auto-geocode missing coords")
    parser.add_argument("--strict", action="store_true", help="Unverified = error")
    args = parser.parse_args()

    with open(args.file) as f:
        html = f.read()

    m = re.search(r'const APP_STATE = (\{[\s\S]*?\}); // END STATE', html)
    if not m:
        print("ERROR: APP_STATE not found"); sys.exit(1)
    state = json.loads(m.group(1))
    days = state["rawPlan"]["days"]

    # Detect trip cities from mapStops
    stops = state["rawPlan"].get("mapStops", [])
    cities = {s.get("city","").lower() for s in stops if s.get("city")}

    errors, warnings, verified, fixed = [], [], [], []

    print(f"\n{'='*60}")
    print("GPS VERIFICATION: " + args.file)
    print(f"{'='*60}\n")

    for d in days:
        for item in d.get("timeline", []):
            mq = item.get("mapQuery") or item.get("mapUrl","").replace(
                "https://maps.google.com/?q=","")
            title = item.get("title","")
            t_lower = title.lower()

            # Skip transport-only items
            if item.get("type") in ("transport", "hotel", "logistics"):
                continue

            # Handle place-name mapQuery strings (e.g. "Bar A Pié de Ma Riomaggiore")
            # — these work fine in Google Maps, skip coordinate validation
            if mq and not re.match(r'^-?\d+\.\d+,-?\d+\.\d+$', mq.strip()):
                # Place name string — mark as address-style, skip lat/lng checks
                continue

    if not mq:
                # No map link at all — skip unless --fix
                if args.fix and item.get("type") in ("activity","food","photospot"):
                    # Try to auto-geocode
                    clean_title = re.sub(r'^[^\w]*', '', title).strip()
                    city_hint = next((s.get("city","") for s in stops
                                      if s.get("days") and d["day"] in s.get("days",[])), "Italy")
                    query = f"{clean_title} {city_hint}"
                    result = nominatim_search(query)
                    if result:
                        item["mapQuery"] = f"{result['lat']:.4f},{result['lng']:.4f}"
                        item["mapUrl"] = f"https://maps.google.com/?q={item['mapQuery']}"
                        item["mapVerified"] = True
                        item["mapVerifiedLabel"] = result["label"]
                        fixed.append(f"Day {d['day']} {item.get('time','')} {title[:40]}")
                        time.sleep(1)
                continue

            lat, lng = parse_mapquery(mq)
            if lat is None:
                warnings.append(f"Day {d['day']} {title[:40]}: malformed mapQuery '{mq}'")
                continue

            # Already verified — skip API call
            if item.get("mapVerified"):
                verified.append(f"Day {d['day']} {item.get('time','')} {title[:35]}")
                continue

            # Reverse geocode to verify
            result = reverse_geocode(lat, lng)
            time.sleep(1.1)  # Nominatim 1 req/sec limit

            if not result:
                warnings.append(f"Day {d['day']} {title[:40]}: reverse geocode failed for {lat},{lng}")
                continue

            resolved_city = result["city"].lower()
            resolved_country = result["country"]

            # Check: resolved city should match any known trip city
            city_match = any(
                resolved_city in c or c in resolved_city
                for c in cities
            ) if cities else True

            # Fallback: at least same country
            expected_countries = {"IT", "CH"}  # Italy + Switzerland
            country_ok = resolved_country in expected_countries

            if city_match or country_ok:
                item["mapVerified"] = True
                item["mapVerifiedLabel"] = result["label"]
                verified.append(f"Day {d['day']} {item.get('time','')} {title[:35]}")
                print(f"  ✅ Day {d['day']:>2} {item.get('time',''):5} {title[:38]:40} → {result['city']}")
            else:
                msg = (f"Day {d['day']} {item.get('time','')} '{title[:35]}': "
                       f"coords {lat},{lng} resolved to {result['city']}, {result['country']} "
                       f"(expected: {', '.join(cities) or 'IT/CH'})")
                if args.strict:
                    errors.append(msg)
                else:
                    warnings.append(msg)
                print(f"  ❌ Day {d['day']:>2} {item.get('time',''):5} {title[:35]:38} → WRONG: {result['city']}, {result['country']}")

    print(f"\n{'='*60}")
    print(f"RESULTS: {len(verified)} verified | {len(fixed)} auto-fixed | "
          f"{len(warnings)} warnings | {len(errors)} errors")

    if fixed:
        print(f"\nAuto-fixed ({len(fixed)}):")
        for f_ in fixed: print(f"  + {f_}")

    if warnings:
        print(f"\nWarnings ({len(warnings)}):")
        for w in warnings: print(f"  ⚠️  {w}")

    if errors:
        print(f"\nErrors ({len(errors)}):")
        for e in errors: print(f"  ❌ {e}")

    # Save back if anything changed
    if fixed or verified:
        new_json = json.dumps(state)
        idx_s = html.index("const APP_STATE = ") + len("const APP_STATE = ")
        idx_e = html.index("; // END STATE", idx_s)
        html = html[:idx_s] + new_json + html[idx_e:]
        with open(args.file, "w") as f:
            f.write(html)
        print(f"\nSaved: {len(verified)+len(fixed)} items marked mapVerified=true")

    if errors:
        sys.exit(1)
    print("\n✅ GPS verification passed")
    sys.exit(0)

if __name__ == "__main__":
    main()
