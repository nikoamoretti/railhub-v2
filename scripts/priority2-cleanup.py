#!/usr/bin/env python3
"""
Priority 2 data cleanup for railhub-v2 facilities.

Fixes:
1. Fill missing states from zip codes (124 facilities)
2. Generate template descriptions for facilities without one (1,684)
3. Clean up location-like facility names (278)
4. Normalize duplicate railroad names (UP/Union Pacific, NS/Norfolk Southern, etc.)
5. Deduplicate railroad entries per facility

Usage:
    python3 scripts/priority2-cleanup.py --dry-run
    python3 scripts/priority2-cleanup.py
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

PROJECT_ROOT = Path(__file__).parent.parent
FACILITIES_JSON = PROJECT_ROOT / "public" / "facilities.json"

# ---------------------------------------------------------------------------
# 1. Zip code → state mapping (US 5-digit zips, first 3 digits)
# ---------------------------------------------------------------------------

# Zip prefix ranges to state. Source: USPS zip code prefix table.
ZIP_PREFIX_TO_STATE: Dict[str, str] = {}

_ZIP_RANGES = [
    ("005", "009", "PR"), ("010", "027", "MA"), ("028", "029", "RI"),
    ("030", "038", "NH"), ("039", "049", "ME"), ("050", "059", "VT"),
    ("060", "069", "CT"), ("070", "089", "NJ"), ("100", "149", "NY"),
    ("150", "196", "PA"), ("197", "199", "DE"), ("200", "205", "DC"),
    ("206", "219", "MD"), ("220", "246", "VA"), ("247", "268", "WV"),
    ("270", "289", "NC"), ("290", "299", "SC"), ("300", "319", "GA"),
    ("320", "349", "FL"), ("350", "369", "AL"), ("370", "385", "TN"),
    ("386", "397", "MS"), ("400", "427", "KY"), ("430", "459", "OH"),
    ("460", "479", "IN"), ("480", "499", "MI"), ("500", "528", "IA"),
    ("530", "549", "WI"), ("550", "567", "MN"), ("570", "577", "SD"),
    ("580", "588", "ND"), ("590", "599", "MT"), ("600", "629", "IL"),
    ("630", "658", "MO"), ("660", "679", "KS"), ("680", "693", "NE"),
    ("700", "714", "LA"), ("716", "729", "AR"), ("730", "749", "OK"),
    ("750", "799", "TX"), ("800", "816", "CO"), ("820", "831", "WY"),
    ("832", "838", "ID"), ("840", "847", "UT"), ("850", "865", "AZ"),
    ("870", "884", "NM"), ("889", "898", "NV"), ("900", "966", "CA"),
    ("967", "968", "HI"), ("970", "979", "OR"), ("980", "994", "WA"),
    ("995", "999", "AK"),
]

for lo, hi, st in _ZIP_RANGES:
    for prefix in range(int(lo), int(hi) + 1):
        ZIP_PREFIX_TO_STATE[f"{prefix:03d}"] = st


def state_from_zip(zip_code: str) -> Optional[str]:
    """Derive US state from a zip code."""
    digits = re.sub(r"\D", "", zip_code)
    if len(digits) >= 3:
        prefix = digits[:3]
        return ZIP_PREFIX_TO_STATE.get(prefix)
    return None


# ---------------------------------------------------------------------------
# 2. Facility type labels
# ---------------------------------------------------------------------------

TYPE_LABELS = {
    "TRANSLOAD": "transload",
    "TEAM_TRACK": "team track",
    "STORAGE": "rail storage",
    "WAREHOUSE": "warehouse",
    "REPAIR": "rail repair",
    "INTERMODAL": "intermodal",
    "PORT": "port",
    "INDUSTRIAL": "industrial",
    "YARD": "rail yard",
    "GRAIN_ELEVATOR": "grain elevator",
    "BULK_TRANSFER": "bulk transfer",
}


def generate_description(facility: dict) -> Optional[str]:
    """Generate a template description from facility metadata."""
    name = facility.get("name", "").strip()
    ftype = facility.get("type", "")
    loc = facility.get("location") or {}
    city = loc.get("city", "")
    state = loc.get("state", "")

    type_label = TYPE_LABELS.get(ftype, ftype.replace("_", " ").lower() if ftype else "")

    parts = []
    if city and state:
        parts.append(f"located in {city}, {state}")
    elif city:
        parts.append(f"located in {city}")
    elif state:
        parts.append(f"located in {state}")

    # Add capabilities if available
    caps = facility.get("capabilities") or {}
    services = []
    if caps.get("track_capacity"):
        services.append(f"{caps['track_capacity']} track capacity")
    if caps.get("indoor_storage"):
        services.append("indoor storage")
    if caps.get("outdoor_storage"):
        services.append("outdoor storage")
    if caps.get("hazmat"):
        services.append("hazmat handling")
    if caps.get("heavy_lift"):
        services.append("heavy lift capability")

    # Build description
    if type_label:
        desc = f"{name} is a {type_label} facility"
    else:
        desc = f"{name} is a rail-served facility"

    if parts:
        desc += f" {parts[0]}"

    if services:
        desc += f", offering {', '.join(services)}"

    # Add railroad info
    railroads = facility.get("railroads") or []
    rr_names = [r.get("railroad", {}).get("name", "") for r in railroads if r.get("railroad", {}).get("name")]
    if rr_names:
        if len(rr_names) == 1:
            desc += f". Served by {rr_names[0]}"
        else:
            desc += f". Served by {', '.join(rr_names[:-1])} and {rr_names[-1]}"

    desc += "."
    return desc


# ---------------------------------------------------------------------------
# 3. Location-like name cleanup
# ---------------------------------------------------------------------------

def clean_location_name(name: str, facility: dict) -> Optional[str]:
    """Fix names like 'Watco - Reno, NV' → 'Watco Reno Transload'."""
    ftype_label = TYPE_LABELS.get(facility.get("type", ""), "")

    # Pattern: "Operator - City, ST"
    m = re.match(r'^(.+?)\s*[-–]\s*(.+?),\s*([A-Z]{2})$', name)
    if m:
        operator = m.group(1).strip()
        # Skip if operator itself contains commas (e.g., "John Arambel Trucking, Inc.")
        if "," in operator:
            return None
        city = m.group(2).strip()
        if ftype_label:
            return f"{operator} {city} {ftype_label.title()}"
        return f"{operator} {city}"

    # Pattern: "City, ST" with no operator (only if we have a type to append)
    m = re.match(r'^([A-Za-z\s.]+),\s+([A-Z]{2})$', name)
    if m:
        city = m.group(1).strip()
        # Don't change "Port of X" names — they're proper nouns
        if city.lower().startswith("port of"):
            return None
        if ftype_label:
            return f"{city} {ftype_label.title()}"
        return None

    return None


# ---------------------------------------------------------------------------
# 4. Railroad name normalization
# ---------------------------------------------------------------------------

# Map aliases → canonical short name
RAILROAD_ALIASES: Dict[str, str] = {
    "Union Pacific": "UP",
    "Norfolk Southern": "NS",
    "BNSF Railway": "BNSF",
    "CSXT": "CSX",
    "CSXT via ATN": "CSX",
    "Paducah & Louisville": "PAL",
    "Paducah & Louisville Railway": "PAL",
    "Providence & Worcester": "P&W",
    "CSX/NS/BNSF/CN/UP/CPKC": None,  # Split into individual entries
}

# The multi-railroad entry to split
MULTI_RR_ENTRY = "CSX/NS/BNSF/CN/UP/CPKC"


def normalize_railroads(railroads: List[dict]) -> List[dict]:
    """Normalize railroad names and deduplicate."""
    seen = set()
    result = []

    for r in railroads:
        rr = r.get("railroad") or {}
        name = rr.get("name", "")
        if not name:
            continue

        # Handle multi-railroad entry
        if name == MULTI_RR_ENTRY:
            for sub_name in name.split("/"):
                sub_name = sub_name.strip()
                canonical = RAILROAD_ALIASES.get(sub_name, sub_name)
                if canonical and canonical not in seen:
                    seen.add(canonical)
                    result.append({"railroad": {"name": canonical}, "daysOfWeek": None, "notes": None})
            continue

        # Normal alias resolution
        canonical = RAILROAD_ALIASES.get(name, name)
        if canonical is None:
            continue
        if canonical not in seen:
            seen.add(canonical)
            result.append({**r, "railroad": {"name": canonical}})

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def build_city_state_map(facilities: List[dict]) -> Dict[str, str]:
    """Build city→state lookup from facilities that have both."""
    city_states: Dict[str, Counter] = {}
    for f in facilities:
        loc = f.get("location") or {}
        city = (loc.get("city") or "").strip().lower()
        state = loc.get("state", "")
        if city and state and len(state) == 2:
            if city not in city_states:
                city_states[city] = Counter()
            city_states[city][state] += 1
    # Take the most common state for each city
    return {city: counts.most_common(1)[0][0] for city, counts in city_states.items()}


# Canadian province abbreviations for detection
CANADIAN_PROVINCES = {"AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"}


def state_from_city_name(city: str) -> Optional[str]:
    """Extract state from city fields like 'Guernsey, SK' or 'North Bay, ON'."""
    m = re.match(r'^(.+?),\s*([A-Z]{2})\s*$', city)
    if m:
        return m.group(2)
    return None


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    facilities: List[dict] = json.loads(FACILITIES_JSON.read_text())
    total = len(facilities)

    # Pre-build city→state lookup
    city_state_map = build_city_state_map(facilities)

    stats = {
        "states_filled": 0,
        "states_filled_from_city_lookup": 0,
        "states_filled_from_city_field": 0,
        "descriptions_generated": 0,
        "names_cleaned": 0,
        "railroads_normalized": 0,
        "railroads_deduped": 0,
    }

    for f in facilities:
        loc = f.get("location") or {}

        # --- 1. Fill missing states ---
        if not loc.get("state"):
            filled = False

            # 1a. From zip code
            if loc.get("zip_code"):
                st = state_from_zip(str(loc["zip_code"]))
                if st:
                    if "location" not in f:
                        f["location"] = {}
                    f["location"]["state"] = st
                    stats["states_filled"] += 1
                    filled = True

            # 1b. From city field containing state (e.g., "Guernsey, SK")
            if not filled and loc.get("city"):
                st = state_from_city_name(loc["city"])
                if st:
                    # Extract clean city name
                    clean_city = loc["city"].split(",")[0].strip()
                    f["location"]["city"] = clean_city
                    f["location"]["state"] = st
                    stats["states_filled"] += 1
                    stats["states_filled_from_city_field"] += 1
                    filled = True

            # 1c. From city name lookup against other facilities
            if not filled and loc.get("city"):
                city_lower = loc["city"].strip().lower()
                st = city_state_map.get(city_lower)
                if st:
                    if "location" not in f:
                        f["location"] = {}
                    f["location"]["state"] = st
                    stats["states_filled"] += 1
                    stats["states_filled_from_city_lookup"] += 1
                    filled = True

        # --- 2. Clean location-like names (before description generation) ---
        name = f.get("name", "")
        if "," in name:
            cleaned = clean_location_name(name, f)
            if cleaned and cleaned != name:
                f["name"] = cleaned
                stats["names_cleaned"] += 1

        # --- 3. Normalize railroad names (before description generation) ---
        railroads = f.get("railroads") or []
        if railroads:
            original_count = len(railroads)
            original_names = [r.get("railroad", {}).get("name", "") for r in railroads]
            normalized = normalize_railroads(railroads)
            new_names = [r.get("railroad", {}).get("name", "") for r in normalized]

            if new_names != original_names:
                f["railroads"] = normalized
                if len(normalized) < original_count:
                    stats["railroads_deduped"] += len(railroads) - len(normalized)
                if any(RAILROAD_ALIASES.get(n) for n in original_names):
                    stats["railroads_normalized"] += 1

        # --- 4. Generate missing descriptions (last, so it uses cleaned data) ---
        if not f.get("description"):
            desc = generate_description(f)
            if desc:
                f["description"] = desc
                stats["descriptions_generated"] += 1

    # --- Report ---
    print(f"\nPriority 2 Cleanup {'(DRY RUN)' if dry_run else ''}")
    print(f"{'='*50}")
    print(f"  States filled (total):        {stats['states_filled']:>5}")
    print(f"    - from zip code:            {stats['states_filled'] - stats['states_filled_from_city_lookup'] - stats['states_filled_from_city_field']:>5}")
    print(f"    - from city field parse:    {stats['states_filled_from_city_field']:>5}")
    print(f"    - from city lookup:         {stats['states_filled_from_city_lookup']:>5}")
    print(f"  Descriptions generated:       {stats['descriptions_generated']:>5}")
    print(f"  Names cleaned:                {stats['names_cleaned']:>5}")
    print(f"  Railroads normalized:         {stats['railroads_normalized']:>5}")
    print(f"  Railroad dupes removed:       {stats['railroads_deduped']:>5}")
    print()

    if dry_run:
        # Show samples
        print("Sample state fills:")
        count = 0
        for f in facilities:
            if count >= 5:
                break
            loc = f.get("location") or {}
            if loc.get("zip_code") and loc.get("state"):
                zc = str(loc["zip_code"])
                derived = state_from_zip(zc)
                if derived == loc["state"]:
                    print(f"  {f['name'][:40]:<42} zip={zc:<8} → {derived}")
                    count += 1

        print("\nSample name cleanups:")
        for f in facilities:
            name = f.get("name", "")
            if "Watco" in name and "," in name:
                cleaned = clean_location_name(name, f)
                if cleaned:
                    print(f"  {name:<40} → {cleaned}")
        print()
        return 0

    # Write
    FACILITIES_JSON.write_text(json.dumps(facilities, indent=2))
    print(f"Wrote {total} facilities to {FACILITIES_JSON}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
