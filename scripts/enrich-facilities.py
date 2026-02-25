#!/usr/bin/env python3
"""
Enrich railhub-v2 facilities with Google Places API (New) data.

Usage:
    python3 scripts/enrich-facilities.py --dry-run
    python3 scripts/enrich-facilities.py --limit 50 --threshold 0.70
    python3 scripts/enrich-facilities.py --report --output public/facilities_enriched.json
"""

import argparse
import json
import logging
import os
import re
import signal
import sqlite3
import sys
import time
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).parent.parent
FACILITIES_JSON = PROJECT_ROOT / "public" / "facilities.json"
SCRIPTS_DIR = Path(__file__).parent
CACHE_DB = SCRIPTS_DIR / ".enrich_cache.db"
DEFAULT_OUTPUT = PROJECT_ROOT / "public" / "facilities_enriched.json"
REPORT_PATH = SCRIPTS_DIR / "enrichment_report.json"

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Google Places API
# ---------------------------------------------------------------------------
PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.addressComponents",
    "places.location",
    "places.nationalPhoneNumber",
    "places.internationalPhoneNumber",
    "places.websiteUri",
    "places.regularOpeningHours",
    "places.rating",
    "places.userRatingCount",
    "places.reviews",
])

RATE_DELAY = 0.1  # 10 req/s
CACHE_TTL_DAYS = 30

# Common suffixes to strip for name normalization
STRIP_SUFFIXES = re.compile(
    r"\b(llc|inc|corp|co|ltd|company|industries|services|group|solutions|"
    r"international|enterprises|holdings|partners|associates)\b\.?$",
    re.IGNORECASE,
)


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

def init_cache(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS cache "
        "(query TEXT PRIMARY KEY, response TEXT, created_at TEXT)"
    )
    conn.commit()
    return conn


def cache_get(conn: sqlite3.Connection, query: str) -> Optional[Dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=CACHE_TTL_DAYS)).isoformat()
    row = conn.execute(
        "SELECT response FROM cache WHERE query = ? AND created_at > ?",
        (query, cutoff),
    ).fetchone()
    if not row:
        return None
    try:
        return json.loads(row[0])
    except json.JSONDecodeError:
        log.warning("Corrupt cache entry for '%s', will re-fetch", query)
        return None


def cache_set(conn: sqlite3.Connection, query: str, response: dict) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT OR REPLACE INTO cache (query, response, created_at) VALUES (?, ?, ?)",
        (query, json.dumps(response), now),
    )
    conn.commit()



# ---------------------------------------------------------------------------
# Name normalization & matching
# ---------------------------------------------------------------------------

def normalize_name(name: str) -> str:
    name = name.lower().strip().rstrip(".,")
    name = STRIP_SUFFIXES.sub("", name).strip()
    name = re.sub(r"[^\w\s]", " ", name)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def match_confidence(
    facility_name: str,
    facility_city: str,
    place_name: str,
    place_address: str,
) -> float:
    fn = normalize_name(facility_name)
    pn = normalize_name(place_name)
    name_sim = SequenceMatcher(None, fn, pn).ratio()

    fc = facility_city.lower().strip() if facility_city else ""
    city_match = 1.0 if fc and re.search(r'\b' + re.escape(fc) + r'\b', place_address.lower()) else 0.0

    return 0.8 * name_sim + 0.2 * city_match


# ---------------------------------------------------------------------------
# Google Places API call
# ---------------------------------------------------------------------------

_last_api_call: float = 0.0


def search_place(api_key: str, query: str, conn: sqlite3.Connection) -> Tuple[Optional[Dict], bool]:
    """Return (result_dict_or_None, from_cache)."""
    global _last_api_call

    cached = cache_get(conn, query)
    if cached is not None:
        return cached, True

    # Enforce rate limit with monotonic clock
    elapsed = time.monotonic() - _last_api_call
    gap = RATE_DELAY - elapsed
    if gap > 0:
        time.sleep(gap)

    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
        "Content-Type": "application/json",
    }
    payload = {"textQuery": query}

    try:
        resp = requests.post(PLACES_SEARCH_URL, headers=headers, json=payload, timeout=10)
        _last_api_call = time.monotonic()
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as exc:
        _last_api_call = time.monotonic()
        log.warning("API error for query '%s': %s", query, exc)
        return None, False

    cache_set(conn, query, data)
    return data, False


# ---------------------------------------------------------------------------
# Address component extraction
# ---------------------------------------------------------------------------

def extract_address_parts(components: List[Dict]) -> Dict[str, str]:
    parts: Dict[str, str] = {}
    type_map = {
        "street_number": "street_number",
        "route": "route",
        "postal_code": "zip_code",
        "locality": "city",
        "administrative_area_level_1": "state",
        "country": "country",
    }
    for comp in components:
        for t in comp.get("types", []):
            if t in type_map:
                parts[type_map[t]] = comp.get("longText", "")
    # Build street address from number + route
    street = " ".join(filter(None, [parts.pop("street_number", ""), parts.pop("route", "")])).strip()
    if street:
        parts["street_address"] = street
    return parts


# ---------------------------------------------------------------------------
# Phone formatting
# ---------------------------------------------------------------------------

def format_phone(raw: str) -> str:
    """Normalise to +1XXXXXXXXXX for US numbers."""
    digits = re.sub(r"\D", "", raw)
    if len(digits) == 10:
        return f"+1{digits}"
    if len(digits) == 11 and digits.startswith("1"):
        return f"+{digits}"
    return raw  # keep original if not parseable


# ---------------------------------------------------------------------------
# Enrichment logic
# ---------------------------------------------------------------------------

def build_reviews(raw_reviews: List[Dict]) -> List[Dict]:
    out = []
    for r in raw_reviews[:5]:
        out.append({
            "author": r.get("authorAttribution", {}).get("displayName", ""),
            "rating": r.get("rating"),
            "text": r.get("text", {}).get("text", ""),
            "time": r.get("publishTime", ""),
            "relative_time": r.get("relativePublishTimeDescription", ""),
        })
    return out


def enrich_facility(
    facility: dict,
    place: dict,
    confidence: float,
    coords_only: bool = False,
) -> Tuple[Dict, List[str]]:
    """Return (enriched_facility, fields_filled). Mutates a copy."""
    f = dict(facility)
    f["location"] = dict(facility.get("location") or {})
    filled: List[str] = []

    if not coords_only:
        # Website
        if not f.get("website") and place.get("websiteUri"):
            f["website"] = place["websiteUri"]
            filled.append("website")

        # Phone
        if not f.get("phone") and place.get("nationalPhoneNumber"):
            f["phone"] = format_phone(place["nationalPhoneNumber"])
            filled.append("phone")

    # Lat/lon
    loc = place.get("location", {})
    if loc.get("latitude") is not None and not f["location"].get("latitude"):
        f["location"]["latitude"] = loc["latitude"]
        filled.append("latitude")
    if loc.get("longitude") is not None and not f["location"].get("longitude"):
        f["location"]["longitude"] = loc["longitude"]
        filled.append("longitude")

    if not coords_only:
        # Address components
        addr_parts = extract_address_parts(place.get("addressComponents", []))
        if not f["location"].get("street_address") and addr_parts.get("street_address"):
            f["location"]["street_address"] = addr_parts["street_address"]
            filled.append("street_address")
        if not f["location"].get("zip_code") and addr_parts.get("zip_code"):
            f["location"]["zip_code"] = addr_parts["zip_code"]
            filled.append("zip_code")

        # Google-specific fields (always set)
        if place.get("rating") is not None:
            f["google_rating"] = place["rating"]
            filled.append("google_rating")
        if place.get("userRatingCount") is not None:
            f["google_review_count"] = place["userRatingCount"]
            filled.append("google_review_count")
        if place.get("reviews"):
            f["google_reviews"] = build_reviews(place["reviews"])

    if place.get("id"):
        f["google_place_id"] = place["id"]

    f["enrichment"] = {
        "source": "google_places",
        "confidence": round(confidence, 4),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "fields_filled": filled,
    }

    return f, filled


# ---------------------------------------------------------------------------
# Gap analysis (dry-run)
# ---------------------------------------------------------------------------

def analyze_gaps(facilities: List[Dict]) -> None:
    total = len(facilities)
    fields = ["website", "phone", "email"]
    loc_fields = ["street_address", "zip_code", "latitude", "longitude"]

    print(f"\nFacility gap analysis ({total} total)\n{'='*44}")
    for field in fields:
        missing = sum(1 for f in facilities if not f.get(field))
        print(f"  {field:<20} missing: {missing:>5}  ({missing/total*100:.1f}%)")
    for field in loc_fields:
        missing = sum(1 for f in facilities if not (f.get("location") or {}).get(field))
        print(f"  location.{field:<11} missing: {missing:>5}  ({missing/total*100:.1f}%)")
    print()


# ---------------------------------------------------------------------------
# Main processing loop
# ---------------------------------------------------------------------------

def process_facilities(
    facilities: List[Dict],
    api_key: str,
    conn: sqlite3.Connection,
    threshold: float,
    skip_enriched: bool,
    coords_only: bool = False,
) -> Tuple[List[Dict], Dict[str, Any]]:
    stats: Dict[str, Any] = {
        "total_facilities": len(facilities),
        "processed": 0,
        "enriched": 0,
        "skipped_low_confidence": 0,
        "skipped_no_results": 0,
        "skipped_already_complete": 0,
        "api_calls_made": 0,
        "cache_hits": 0,
        "fields_filled": {},
        "low_confidence_matches": [],
    }

    results: List[Dict] = []
    interrupted = False

    def handle_interrupt(sig: int, frame: Any) -> None:
        nonlocal interrupted
        log.warning("Interrupted — saving progress...")
        interrupted = True

    signal.signal(signal.SIGINT, handle_interrupt)

    for i, facility in enumerate(facilities):
        if interrupted:
            break

        name = facility.get("name", "")
        loc = facility.get("location") or {}
        city = loc.get("city", "")
        state = loc.get("state", "")

        # Check if already complete (has all key fields)
        # Skip if already enriched in a previous run
        if skip_enriched and facility.get("enrichment"):
            results.append(facility)
            stats["skipped_already_complete"] += 1
            stats["processed"] += 1
            _maybe_print_progress(i + 1, len(facilities), stats)
            continue

        has_all = all([
            facility.get("website"),
            facility.get("phone"),
            loc.get("latitude"),
            loc.get("longitude"),
        ])
        if has_all:
            results.append(facility)
            stats["skipped_already_complete"] += 1
            stats["processed"] += 1
            _maybe_print_progress(i + 1, len(facilities), stats)
            continue

        # Append facility type for better match quality on niche B2B businesses
        ftype = facility.get("type", "").replace("_", " ").lower()
        type_hint = f" {ftype} facility" if ftype else ""
        query = f"{name}{type_hint}, {city}, {state}"

        place_response, from_cache = search_place(api_key, query, conn)
        if from_cache:
            stats["cache_hits"] += 1
        else:
            stats["api_calls_made"] += 1

        if not place_response or not place_response.get("places"):
            results.append(facility)
            stats["skipped_no_results"] += 1
            stats["processed"] += 1
            _maybe_print_progress(i + 1, len(facilities), stats)
            continue

        best_place = place_response["places"][0]
        place_name = best_place.get("displayName", {}).get("text", "")
        place_address = best_place.get("formattedAddress", "")

        confidence = match_confidence(name, city, place_name, place_address)

        if confidence < threshold:
            stats["skipped_low_confidence"] += 1
            stats["low_confidence_matches"].append({
                "facility": name,
                "matched": place_name,
                "confidence": round(confidence, 4),
            })
            results.append(facility)
            stats["processed"] += 1
            _maybe_print_progress(i + 1, len(facilities), stats)
            continue

        enriched, filled = enrich_facility(facility, best_place, confidence, coords_only=coords_only)
        results.append(enriched)
        stats["enriched"] += 1
        stats["processed"] += 1

        for field in filled:
            stats["fields_filled"][field] = stats["fields_filled"].get(field, 0) + 1

        _maybe_print_progress(i + 1, len(facilities), stats)

    return results, stats


def _maybe_print_progress(i: int, total: int, stats: Dict) -> None:
    if i % 100 == 0 or i == total:
        pct = i / total * 100
        print(
            f"[{i}/{total}] {pct:.1f}% — "
            f"{stats['enriched']} enriched, "
            f"{stats['skipped_low_confidence']} skipped (low confidence), "
            f"{stats['cache_hits']} cached"
        )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Enrich railhub-v2 facilities via Google Places API")
    parser.add_argument("--dry-run", action="store_true", help="Analyze gaps, no API calls")
    parser.add_argument("--limit", type=int, default=None, help="Process only first N facilities")
    parser.add_argument("--threshold", type=float, default=0.80, help="Match confidence threshold (default 0.80)")
    parser.add_argument("--skip-enriched", action="store_true", help="Skip facilities that already have enrichment metadata")
    parser.add_argument("--coords-only", action="store_true", help="Only fill lat/lon (safe for low-confidence matches)")
    parser.add_argument("--report", action="store_true", help="Write enrichment_report.json")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output JSON path")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    facilities: List[Dict] = json.loads(FACILITIES_JSON.read_text())
    if args.limit:
        facilities = facilities[: args.limit]

    if args.dry_run:
        analyze_gaps(facilities)
        return 0

    api_key = os.environ.get("GOOGLE_PLACES_API_KEY", "")
    if not api_key:
        log.error("GOOGLE_PLACES_API_KEY environment variable not set")
        return 1

    conn = init_cache(CACHE_DB)
    log.info("Processing %d facilities (threshold=%.2f)", len(facilities), args.threshold)

    enriched_facilities, stats = process_facilities(
        facilities,
        api_key,
        conn,
        threshold=args.threshold,
        skip_enriched=args.skip_enriched,
        coords_only=args.coords_only,
    )
    conn.close()

    # Write output
    output_path: Path = args.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(enriched_facilities, indent=2))
    log.info("Wrote %d facilities to %s", len(enriched_facilities), output_path)

    # Summary
    print(f"\nDone. {stats['enriched']}/{stats['processed']} enriched.")

    if args.report:
        REPORT_PATH.write_text(json.dumps(stats, indent=2))
        log.info("Report written to %s", REPORT_PATH)

    return 0


if __name__ == "__main__":
    sys.exit(main())
