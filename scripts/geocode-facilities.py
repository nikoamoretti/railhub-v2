#!/usr/bin/env python3
"""
Geocode railhub facilities missing lat/lon using Nominatim (OpenStreetMap).
Free, 1 req/sec rate limit. Caches results in SQLite.

Usage:
    python3 scripts/geocode-facilities.py --dry-run
    python3 scripts/geocode-facilities.py
"""

import json
import signal
import sqlite3
import sys
import time
from pathlib import Path
from typing import Optional, Tuple

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

PROJECT_ROOT = Path(__file__).parent.parent
FACILITIES_JSON = PROJECT_ROOT / "public" / "facilities.json"
CACHE_DB = Path(__file__).parent / ".geocode_cache.db"

geolocator = Nominatim(user_agent="railhub-v2-geocoder", timeout=10)


def init_cache() -> sqlite3.Connection:
    conn = sqlite3.connect(CACHE_DB)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS geocode_cache "
        "(query TEXT PRIMARY KEY, lat REAL, lon REAL, created_at TEXT)"
    )
    conn.commit()
    return conn


def cache_get(conn: sqlite3.Connection, query: str) -> Optional[Tuple[float, float]]:
    row = conn.execute(
        "SELECT lat, lon FROM geocode_cache WHERE query = ?", (query,)
    ).fetchone()
    if row and row[0] is not None:
        return (row[0], row[1])
    return None


def cache_set(conn: sqlite3.Connection, query: str, lat: Optional[float], lon: Optional[float]) -> None:
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT OR REPLACE INTO geocode_cache (query, lat, lon, created_at) VALUES (?, ?, ?, ?)",
        (query, lat, lon, now),
    )
    conn.commit()


def geocode_one(query: str, conn: sqlite3.Connection) -> Optional[Tuple[float, float]]:
    """Geocode a query string, using cache. Returns (lat, lon) or None."""
    cached = cache_get(conn, query)
    if cached:
        return cached

    time.sleep(1.05)  # Nominatim: max 1 req/sec

    try:
        location = geolocator.geocode(query)
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  Error: {e}")
        cache_set(conn, query, None, None)
        return None

    if location:
        cache_set(conn, query, location.latitude, location.longitude)
        return (location.latitude, location.longitude)
    else:
        cache_set(conn, query, None, None)
        return None


def build_queries(facility: dict) -> list[str]:
    """Build geocoding queries from most to least specific."""
    loc = facility.get("location") or {}
    street = loc.get("street_address") or ""
    city = loc.get("city") or ""
    state = loc.get("state") or ""
    zip_code = loc.get("zip_code") or ""
    country = loc.get("country") or "US"

    queries = []
    # Most specific: full address
    if street and city and state:
        queries.append(f"{street}, {city}, {state}, {country}")
    # City + state + zip
    if city and state and zip_code:
        queries.append(f"{city}, {state} {zip_code}, {country}")
    # City + state
    if city and state:
        queries.append(f"{city}, {state}, {country}")
    # Zip code alone
    if zip_code and len(str(zip_code)) >= 5:
        queries.append(f"{zip_code}, {country}")
    return queries


def main() -> int:
    dry_run = "--dry-run" in sys.argv

    facilities = json.loads(FACILITIES_JSON.read_text())
    missing = [
        (i, f) for i, f in enumerate(facilities)
        if not (f.get("location") or {}).get("latitude")
    ]

    print(f"Total facilities: {len(facilities)}")
    print(f"Missing lat/lon: {len(missing)}")

    if dry_run:
        # Show query breakdown
        has_street = sum(1 for _, f in missing if (f.get("location") or {}).get("street_address"))
        has_city_state = sum(1 for _, f in missing if (f.get("location") or {}).get("city") and (f.get("location") or {}).get("state"))
        has_zip = sum(1 for _, f in missing if (f.get("location") or {}).get("zip_code"))
        print(f"\nGeocoding potential:")
        print(f"  Has street address: {has_street}")
        print(f"  Has city + state:   {has_city_state}")
        print(f"  Has zip code:       {has_zip}")
        print(f"\nEstimated time: ~{len(missing)} seconds ({len(missing)/60:.0f} minutes)")
        return 0

    conn = init_cache()
    geocoded = 0
    failed = 0
    cached = 0
    interrupted = False

    def handle_interrupt(sig, frame):
        nonlocal interrupted
        print("\nInterrupted — saving progress...")
        interrupted = True

    signal.signal(signal.SIGINT, handle_interrupt)

    for count, (idx, facility) in enumerate(missing):
        if interrupted:
            break

        queries = build_queries(facility)
        if not queries:
            failed += 1
            continue

        result = None
        for q in queries:
            # Check cache first (free)
            c = cache_get(conn, q)
            if c:
                result = c
                cached += 1
                break

        if not result:
            # Try each query with API
            for q in queries:
                result = geocode_one(q, conn)
                if result:
                    break

        if result:
            lat, lon = result
            if "location" not in facilities[idx]:
                facilities[idx]["location"] = {}
            facilities[idx]["location"]["latitude"] = round(lat, 6)
            facilities[idx]["location"]["longitude"] = round(lon, 6)
            geocoded += 1
        else:
            failed += 1

        if (count + 1) % 50 == 0 or count + 1 == len(missing):
            pct = (count + 1) / len(missing) * 100
            print(
                f"[{count+1}/{len(missing)}] {pct:.1f}% — "
                f"{geocoded} geocoded, {cached} cached, {failed} failed"
            )

    # Write output
    FACILITIES_JSON.write_text(json.dumps(facilities, indent=2))
    print(f"\nDone. {geocoded} geocoded, {cached} from cache, {failed} failed.")
    print(f"Wrote {len(facilities)} facilities to {FACILITIES_JSON}")

    conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
