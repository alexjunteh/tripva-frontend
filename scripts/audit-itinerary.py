#!/usr/bin/env python3
"""
Itinerary SOP Audit Script
Usage: python3 scripts/audit-itinerary.py italy-test.html
Exit: 0 = clean, 1 = errors found (blocks commit)
"""
import json, re, sys

def load_state(filepath):
    with open(filepath) as f:
        html = f.read()
    m = re.search(r'const APP_STATE = (\{[\s\S]*?\}); // END STATE', html)
    if not m:
        print("ERROR: Could not find APP_STATE in file")
        sys.exit(1)
    return json.loads(m.group(1))

def parse_time(t):
    """Parse HH:MM to minutes. Returns None for non-clock values."""
    try:
        h, mn = t.split(':')
        return int(h) * 60 + int(mn)
    except:
        return None

def audit(filepath):
    state = load_state(filepath)
    days  = state.get('rawPlan', {}).get('days', [])
    segs  = state.get('segments', [])
    acts  = state.get('activities', [])

    errors   = []  # block commit
    warnings = []  # show but don't block

    # Build segment index for drift check
    seg_map = {s['id']: s for s in segs}

    for d in days:
        day_num = d.get('day', '?')
        tl = d.get('timeline', [])
        prefix = f"Day {day_num:2} ({d.get('title','')[:30]})"

        # CHECK 1: Duplicate times within a day
        time_seen = {}
        for item in tl:
            t = item.get('time', '')
            mins = parse_time(t)
            if mins is None:
                continue
            if t in time_seen:
                errors.append(f"{prefix} | DUPLICATE TIME {t}: '{time_seen[t][:30]}' AND '{item['title'][:30]}'")
            else:
                time_seen[t] = item.get('title', '')

        # CHECK 2: Time ordering (within same day, clock times only)
        clock_items = [(parse_time(i.get('time','')), i.get('title','')) for i in tl if parse_time(i.get('time',''))]
        for i in range(1, len(clock_items)):
            if clock_items[i][0] < clock_items[i-1][0]:
                errors.append(f"{prefix} | OUT OF ORDER: '{clock_items[i][1][:30]}' ({clock_items[i][0]//60}:{clock_items[i][0]%60:02d}) after '{clock_items[i-1][1][:30]}'")

        # CHECK 3: Dinner venue category (≥20:00 food items containing bar/cicchetti/tapas keywords)
        DINNER_BAD = re.compile(r'\bcicchetti\b|\btapas\b|all\'arco|do mori', re.I)
        for item in tl:
            mins = parse_time(item.get('time', ''))
            if mins and mins >= 20*60 and item.get('type') == 'food':
                combined = (item.get('title','') + ' ' + item.get('detail','')).lower()
                if DINNER_BAD.search(combined):
                    warnings.append(f"{prefix} | DINNER VENUE: '{item['title'][:40]}' — cicchetti/bar keyword at dinner hour")

        # CHECK 4: ticketRequired but not booked
        for item in tl:
            if item.get('ticketRequired') and item.get('ticketState', 'pending') != 'booked':
                warnings.append(f"{prefix} | TICKET PENDING: '{item['title'][:40]}'")

        # CHECK 5: Advance-booking restaurants with no booking ref
        ADV_BOOK = re.compile(r'book \d+ weeks|weeks ahead', re.I)
        HAS_REF  = re.compile(r'✅|PNR|order \d+', re.I)
        for item in tl:
            detail = item.get('detail', '') or ''
            if ADV_BOOK.search(detail) and not HAS_REF.search(detail):
                warnings.append(f"{prefix} | UNBOOKED PREREQ: '{item['title'][:40]}' — weeks-ahead booking, no ref found")

    # CHECK 6: Segment ↔ timeline drift
    tl_index = {}
    for d in days:
        for item in d.get('timeline', []):
            tl_index[(d['day'], item.get('time',''))] = item

    for seg in segs:
        if not seg.get('bookingRequired'):
            continue
        day_num_s = int((seg.get('dayId','day-0').split('-')[1:2] or ['0'])[0])
        tl_item = tl_index.get((day_num_s, seg.get('time','')))
        if not tl_item:
            continue
        seg_booked = seg.get('bookingState') == 'booked'
        tl_booked  = '✅' in (tl_item.get('detail','') + tl_item.get('title',''))
        tl_pending = '⏳' in (tl_item.get('detail','') + tl_item.get('title',''))
        if seg_booked and tl_pending:
            errors.append(f"SYNC DRIFT: {seg['id']} — segment=booked but timeline shows ⏳")
        elif not seg_booked and tl_booked:
            errors.append(f"SYNC DRIFT: {seg['id']} — segment=pending but timeline shows ✅")

    # Report
    print(f"\n{'='*60}")
    print(f"ITINERARY AUDIT: {filepath}")
    print(f"{'='*60}")

        # ── CONTRACT: photoUrl must never be stored in state for photospots ──
    for d in days:
        for t in d.get('timeline', []):
            if t.get('type') == 'photospot':
                if 'photoUrl' in t:
                    errors.append(f"Day {d.get('day','?')} {t.get('time','?')} | PHOTOSPOT CONTRACT VIOLATION: 'photoUrl' in state for '{t.get('title','')}' — photos are engine-derived via SPOT_PHOTO_DB, never stored in state")
                if not t.get('title'):
                    errors.append(f"Day {d.get('day','?')} {t.get('time','?')} | PHOTOSPOT: missing 'title' field")
                if not t.get('mapQuery') and not (t.get('lat') and t.get('lng')):
                    warnings.append(f"Day {d.get('day','?')} {t.get('time','?')} | PHOTOSPOT: '{t.get('title','')}' has no mapQuery or GPS coords")

    if not errors and not warnings:
        print("✅ ALL CHECKS PASS — clean to commit\n")
        return 0

    if errors:
        print(f"\n❌ ERRORS ({len(errors)}) — fix before committing:")
        for e in errors:
            print(f"   ERROR: {e}")

    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}) — review before committing:")
        for w in warnings:
            print(f"   WARN:  {w}")

    print()
    return 1 if errors else 0

if __name__ == '__main__':
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'italy-test.html'
    sys.exit(audit(filepath))
