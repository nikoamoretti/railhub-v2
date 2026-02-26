"""
Rail industry data scraper.
Fetches from USDA (Socrata), EIA, FRA, and STB.
Writes to public/industry.json.
"""

import hashlib
import json
import re
import uuid
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from math import floor

import requests

# --- Constants ---

NOW_ISO = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

RAILROAD_MAP = {
    "BNSF": "BNSF",
    "Union Pacific": "UP",
    "UP": "UP",
    "CSX": "CSX",
    "CSXT": "CSX",
    "CSX Transportation": "CSX",
    "Norfolk Southern": "NS",
    "NS": "NS",
    "Canadian National": "CN",
    "CN": "CN",
    "Canadian Pacific Kansas City": "CPKC",
    "CPKC": "CPKC",
    "KCS": "CPKC",
}

USDA_BASE = "https://agtransport.usda.gov/resource/{id}.json"

USDA_DATASETS = [
    {
        "id": "2wy9-nmz4",
        "metricType": "TRAIN_SPEED",
        "unit": "mph",
        "value_field": "mph",
        "commodity_field": "commodity",
        "filter": None,
    },
    {
        "id": "9z94-b4fw",
        "metricType": "TERMINAL_DWELL",
        "unit": "hours",
        "value_field": "value",
        "commodity_field": None,
        "filter": lambda row: not row.get("yard") or row.get("yard") == "System Average",
    },
    {
        "id": "grdc-x6yk",
        "metricType": "CARS_ON_LINE",
        "unit": "cars",
        "value_field": "cars",
        "commodity_field": None,
        "filter": None,
    },
    {
        "id": "tb7q-kn5i",
        "metricType": "CARLOADS_ORIGINATED",
        "unit": "carloads",
        "value_field": "carloads",
        "commodity_field": "commodity",
        "filter": lambda row: not row.get("type") or row.get("type") == "Originated",
    },
]


# --- Helpers ---

def short_uuid() -> str:
    return str(uuid.uuid4()).replace("-", "")[:12]


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text)
    text = text.strip("-")
    return text[:80]


def normalize_railroad(name: str) -> str:
    if not name:
        return name
    return RAILROAD_MAP.get(name.strip(), name.strip())


def current_monday_iso() -> str:
    today = datetime.now(timezone.utc).date()
    monday = today - timedelta(days=today.weekday())
    return f"{monday.isoformat()}T00:00:00.000Z"


def safe_float(val):
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


# --- Source 1: USDA Rail Metrics ---

def fetch_usda_metrics() -> list[dict]:
    print("[USDA] Fetching rail metrics from 4 datasets...")
    records = []

    for ds in USDA_DATASETS:
        url = USDA_BASE.format(id=ds["id"])
        params = {"$limit": 100, "$order": "date DESC"}
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
            rows = resp.json()
        except Exception as exc:
            print(f"  [USDA] ERROR fetching {ds['id']}: {exc}")
            continue

        kept = 0
        for row in rows:
            # Apply row-level filter
            if ds["filter"] and not ds["filter"](row):
                continue

            railroad_raw = row.get("railroad") or row.get("reporting_railroad") or ""
            railroad = normalize_railroad(railroad_raw)

            raw_value = row.get(ds["value_field"])
            value = safe_float(raw_value)
            if value is None:
                continue

            date_raw = row.get("date") or row.get("week_of") or ""
            # Normalize to ISO 8601
            if date_raw:
                date_raw = date_raw[:10]  # take YYYY-MM-DD
                report_week = f"{date_raw}T00:00:00.000Z"
            else:
                report_week = NOW_ISO

            commodity = ""
            if ds["commodity_field"]:
                commodity = row.get(ds["commodity_field"]) or ""

            records.append({
                "id": f"metric-{short_uuid()}",
                "railroad": railroad,
                "metricType": ds["metricType"],
                "value": value,
                "unit": ds["unit"],
                "reportWeek": report_week,
                "commodity": commodity,
                "createdAt": NOW_ISO,
            })
            kept += 1

        print(f"  [USDA] {ds['metricType']}: {kept} records from {len(rows)} rows")

    print(f"[USDA] Total: {len(records)} metric records")
    return records


# --- Source 2: EIA Fuel Surcharges ---

def _ns_carload(diesel: float) -> float:
    if diesel <= 2.00: return 0.0
    if diesel <= 2.50: return 4.0
    if diesel <= 3.00: return 8.0
    if diesel <= 3.50: return 13.0
    if diesel <= 4.00: return 18.0
    if diesel <= 4.50: return 24.0
    return 30.0

def _ns_intermodal(diesel: float) -> float:
    if diesel <= 2.00: return 0.0
    if diesel <= 2.50: return 15.0
    if diesel <= 3.00: return 25.0
    if diesel <= 3.50: return 35.0
    if diesel <= 4.00: return 40.0
    return 45.0

def _up_carload(diesel: float) -> float:
    if diesel < 1.35: return 0.0
    return 1.5 + floor((diesel - 1.35) / 0.05) * 0.5

def _up_intermodal(diesel: float) -> float:
    if diesel < 1.35: return 0.0
    return 2.0 + floor((diesel - 1.35) / 0.05) * 0.6

def _bnsf_carload(diesel: float) -> float:
    if diesel <= 2.50: return 0.0
    if diesel <= 3.00: return 6.0
    if diesel <= 3.50: return 12.0
    if diesel <= 4.00: return 18.0
    if diesel <= 4.50: return 24.0
    return 30.0

def _bnsf_intermodal(diesel: float) -> float:
    if diesel <= 2.50: return 0.0
    if diesel <= 3.00: return 10.0
    if diesel <= 3.50: return 20.0
    if diesel <= 4.00: return 30.0
    if diesel <= 4.50: return 38.0
    return 44.0

def _csx_carload(diesel: float) -> float:
    if diesel <= 2.00: return 0.0
    if diesel <= 2.50: return 5.0
    if diesel <= 3.00: return 9.0
    if diesel <= 3.50: return 13.0
    if diesel <= 4.00: return 18.0
    if diesel <= 4.50: return 24.0
    return 30.0

def _csx_intermodal(diesel: float) -> float:
    if diesel <= 2.00: return 0.0
    if diesel <= 2.50: return 12.0
    if diesel <= 3.00: return 22.0
    if diesel <= 3.50: return 32.0
    if diesel <= 4.00: return 38.0
    return 44.0

SURCHARGE_FORMULAS = [
    ("NS",   "Carload",    _ns_carload),
    ("NS",   "Intermodal", _ns_intermodal),
    ("UP",   "Carload",    _up_carload),
    ("UP",   "Intermodal", _up_intermodal),
    ("BNSF", "Carload",    _bnsf_carload),
    ("BNSF", "Intermodal", _bnsf_intermodal),
    ("CSX",  "Carload",    _csx_carload),
    ("CSX",  "Intermodal", _csx_intermodal),
]


def fetch_eia_fuel_surcharges() -> list[dict]:
    print("[EIA] Fetching diesel price from RSS feed...")
    url = "https://www.eia.gov/petroleum/gasdiesel/includes/gas_diesel_rss.xml"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
    except Exception as exc:
        print(f"  [EIA] ERROR fetching RSS: {exc}")
        return []

    try:
        root = ET.fromstring(resp.text)
    except ET.ParseError as exc:
        print(f"  [EIA] XML parse error: {exc}")
        return []

    diesel_price = None
    for item in root.iter("item"):
        desc_el = item.find("description")
        if desc_el is None or desc_el.text is None:
            continue
        desc = desc_el.text
        if "Diesel" in desc and "U.S." in desc:
            match = re.search(r"(\d+\.\d+)\s+\.\.?\s+U\.S\.", desc)
            if match:
                candidate = float(match.group(1))
                if 1.5 <= candidate <= 8.0:
                    diesel_price = candidate
                    break

    if diesel_price is None:
        print("  [EIA] Could not extract a valid diesel price from RSS")
        return []

    print(f"  [EIA] Diesel price: ${diesel_price:.3f}")

    effective_date = current_monday_iso()
    records = []
    for railroad, traffic_type, formula in SURCHARGE_FORMULAS:
        rate = formula(diesel_price)
        records.append({
            "id": f"fs-{short_uuid()}",
            "railroad": railroad,
            "effectiveDate": effective_date,
            "fuelPrice": diesel_price,
            "surchargeRate": round(rate, 4),
            "trafficType": traffic_type,
            "createdAt": NOW_ISO,
        })

    print(f"[EIA] Total: {len(records)} fuel surcharge records")
    return records


# --- Source 3: Service Advisories (BNSF + CSX) ---

US_STATES = {
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY',
}

ADVISORY_TYPE_KEYWORDS = {
    "EMBARGO": ["embargo"],
    "WEATHER_ADVISORY": ["weather", "storm", "flood", "hurricane", "winter", "ice", "tornado"],
    "MAINTENANCE_NOTICE": ["maintenance", "track work", "outage", "planned"],
}


def classify_advisory(title: str) -> str:
    lower = title.lower()
    for atype, keywords in ADVISORY_TYPE_KEYWORDS.items():
        if any(kw in lower for kw in keywords):
            return atype
    return "SERVICE_ALERT"


def extract_area(title: str):
    import re as _re
    m = _re.search(r'\b([A-Z]{2})\b', title)
    if m and m.group(1) in US_STATES:
        return m.group(1)
    for region in ['Midwest', 'Southwest', 'Southeast', 'Northeast', 'Northwest', 'Pacific', 'Gulf', 'Central']:
        if region in title:
            return region
    return None


def hash_string(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()[:12]


def strip_html(html_text: str) -> str:
    return re.sub(r'<[^>]+>', '', html_text).strip()


def fetch_bnsf_advisories() -> list[dict]:
    """Scrape BNSF customer notifications — targets actual notification.page links."""
    print("[BNSF Advisory] Fetching customer notifications...")
    url = "https://www.bnsf.com/news-media/customer-notifications.html"
    try:
        resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0 railhub-scraper"}, timeout=30)
        resp.raise_for_status()
        html = resp.text
    except Exception as exc:
        print(f"  [BNSF Advisory] ERROR: {exc}")
        return []

    advisories = []
    seen = set()

    # BNSF notification links follow pattern: notification.page?notId=...
    for m in re.finditer(
        r'<a[^>]*href="([^"]*notification\.page\?notId=[^"]+)"[^>]*>(.*?)</a>',
        html, re.IGNORECASE | re.DOTALL,
    ):
        href, title_html = m.group(1), m.group(2)
        title = strip_html(title_html).strip()
        if not title or len(title) < 15:
            continue

        # Deduplicate by notId
        not_id = re.search(r'notId=([^&"]+)', href)
        key = not_id.group(1) if not_id else title
        if key in seen:
            continue
        seen.add(key)

        # Skip routine/noise items — keep derailments, weather, embargoes, major service changes
        lower = title.lower()
        skip_patterns = [
            'det auction', 'cot auction', 'shuttle auction', 'shuttle trips per month',
            'shuttle miles per day', 'direct det auction', 'upcoming det', 'upcoming shuttle',
            'network update for', 'weekly surface transportation board',
            'rule change effective', 'tariff', 'price list',
        ]
        if any(p in lower for p in skip_patterns):
            continue

        # Extract date from title
        date_str = None
        for fmt_pat, fmt_str in [
            (r'(\w+ \d{1,2},?\s*\d{4})', '%B %d %Y'),
            (r'(\d{1,2}/\d{1,2}/\d{4})', '%m/%d/%Y'),
        ]:
            dm = re.search(fmt_pat, title)
            if dm:
                try:
                    parsed = datetime.strptime(dm.group(1).replace(',', ''), fmt_str)
                    date_str = parsed.strftime('%Y-%m-%d')
                    break
                except ValueError:
                    pass

        advisories.append({
            "id": f"adv-{short_uuid()}",
            "externalId": f"bnsf-{key}",
            "slug": slugify(f"bnsf-{title}"),
            "railroad": "BNSF",
            "advisoryType": classify_advisory(title),
            "title": title,
            "description": title,
            "affectedArea": extract_area(title),
            "isActive": True,
            "issuedAt": f"{date_str}T00:00:00.000Z" if date_str else NOW_ISO,
            "expiresAt": None,
            "createdAt": NOW_ISO,
        })

    print(f"[BNSF Advisory] Found {len(advisories)} notifications")
    return advisories



def fetch_csx_advisories() -> list[dict]:
    """Scrape CSX embargoes and service bulletins via cloudscraper (bypasses Cloudflare)."""
    print("[CSX Advisory] Fetching embargoes and bulletins via cloudscraper...")

    try:
        import cloudscraper
    except ImportError:
        print("  [CSX Advisory] cloudscraper not installed — pip install cloudscraper")
        return []

    from bs4 import BeautifulSoup

    scraper = cloudscraper.create_scraper(
        browser={"browser": "chrome", "platform": "linux", "desktop": True},
        delay=2,
    )
    advisories = []
    seen = set()

    # --- Embargoes ---
    try:
        resp = scraper.get(
            "https://www.csx.com/index.cfm/customers/news/embargoes/", timeout=30,
        )
        resp.raise_for_status()
        html = resp.text
        print(f"  [CSX Advisory] Embargoes page: {len(html)} chars")
    except Exception as exc:
        print(f"  [CSX Advisory] Embargoes ERROR: {exc}")
        html = ""

    if html:
        soup = BeautifulSoup(html, "html.parser")
        main = soup.find(id="content_main")
        if main:
            blocks = re.split(r"(?=CSXT-CSX TRANSPORTATION)", main.get_text())
            for block in blocks:
                if "Embargo Number" not in block:
                    continue
                fields = {}
                for line in block.split("\n"):
                    line = line.strip()
                    if ":" in line:
                        key, _, val = line.partition(":")
                        fields[key.strip()] = val.strip()

                embargo_num = fields.get("Embargo Number", "")
                if not embargo_num:
                    continue
                if embargo_num in seen:
                    continue
                seen.add(embargo_num)

                status = fields.get("Status", "Effective")
                eff_date = fields.get("Effective Date", "")
                exp_date = fields.get("Expiration Date", "")
                cause = fields.get("Cause", "")
                cause_detail = fields.get("Cause Detail", "")
                commodities = fields.get("Commodities", "")

                # Parse dates (MM-DD-YYYY)
                issued_iso = NOW_ISO
                expires_iso = None
                for raw, target in [(eff_date, "issued"), (exp_date, "expires")]:
                    if raw:
                        try:
                            parsed = datetime.strptime(raw, "%m-%d-%Y")
                            iso = parsed.strftime("%Y-%m-%dT00:00:00.000Z")
                            if target == "issued":
                                issued_iso = iso
                            else:
                                expires_iso = iso
                        except ValueError:
                            pass

                title = f"Embargo {embargo_num}"
                if cause:
                    title += f" — {cause}"
                description = f"Embargo {embargo_num} ({status}). {cause_detail}".strip()
                if commodities and commodities != "Target All Commodities":
                    description += f" Commodities: {commodities}"

                advisories.append({
                    "id": f"adv-{short_uuid()}",
                    "externalId": f"csx-{embargo_num}",
                    "slug": slugify(f"csx-embargo-{embargo_num}"),
                    "railroad": "CSX",
                    "advisoryType": "EMBARGO",
                    "title": title,
                    "description": description,
                    "affectedArea": None,
                    "isActive": status.lower() == "effective",
                    "issuedAt": issued_iso,
                    "expiresAt": expires_iso,
                    "createdAt": NOW_ISO,
                })

    # --- Service Bulletins ---
    try:
        resp2 = scraper.get(
            "https://www.csx.com/index.cfm/customers/news/service-bulletins1/", timeout=30,
        )
        resp2.raise_for_status()
        html2 = resp2.text
        print(f"  [CSX Advisory] Bulletins page: {len(html2)} chars")
    except Exception as exc:
        print(f"  [CSX Advisory] Bulletins ERROR: {exc}")
        html2 = ""

    if html2:
        soup2 = BeautifulSoup(html2, "html.parser")
        main2 = soup2.find(id="content_main")
        if main2:
            for link in main2.find_all("a", href=True):
                href = link["href"]
                if "/service-bulletins1/" not in href or href.rstrip("/").endswith("service-bulletins1"):
                    continue
                title = link.get_text(strip=True)
                if not title or len(title) < 15:
                    continue
                if title in seen:
                    continue
                seen.add(title)

                advisories.append({
                    "id": f"adv-{short_uuid()}",
                    "externalId": f"csx-{hash_string(title)}",
                    "slug": slugify(f"csx-{title}"),
                    "railroad": "CSX",
                    "advisoryType": classify_advisory(title),
                    "title": title,
                    "description": title,
                    "affectedArea": extract_area(title),
                    "isActive": True,
                    "issuedAt": NOW_ISO,
                    "expiresAt": None,
                    "createdAt": NOW_ISO,
                })

    print(f"[CSX Advisory] Found {len(advisories)} entries")
    return advisories


# --- Source 4: FRA Safety Incidents → Advisories ---

def fetch_fra_incidents() -> list[dict]:
    """FRA safety incidents are operational safety events — belong in advisories, not regulatory."""
    print("[FRA] Fetching accident data...")
    url = "https://data.transportation.gov/resource/85tf-25kj.json"
    params = {
        "$limit": 50,
        "$order": "date DESC",
        "$where": "date>'2024-01-01'",
    }
    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        rows = resp.json()
    except Exception as exc:
        print(f"  [FRA] ERROR: {exc}")
        return []

    records = []
    for row in rows:
        incident_number = (
            row.get("accidentnumber")
            or row.get("incidentkey")
            or row.get("incident_number")
            or short_uuid()
        )
        external_id = f"fra-{incident_number}"

        incident_type = row.get("accidenttype") or row.get("type") or "Incident"
        railroad_name = (
            row.get("reportingrailroadname")
            or row.get("railroad_name")
            or row.get("railroad")
            or "Unknown Railroad"
        )
        railroad_short = normalize_railroad(railroad_name) or railroad_name
        city = row.get("station") or row.get("city_name") or row.get("city") or "Unknown City"
        state = (
            row.get("stateabbr")
            or row.get("statename")
            or row.get("state_name")
            or row.get("state")
            or ""
        )
        date_raw = (row.get("date") or "")[:10]

        title = f"{incident_type} - {railroad_name} near {city}, {state}"

        killed = row.get("totalpersonskilled") or row.get("total_killed") or row.get("killed") or "0"
        injured = row.get("totalpersonsinjured") or row.get("total_injured") or row.get("injured") or "0"
        damage = row.get("totaldamagecost") or row.get("total_damage") or row.get("damage") or "0"

        description = (
            f"Incident on {date_raw}: {killed} fatalities, "
            f"{injured} injuries. Estimated damage: ${damage}"
        )

        slug = slugify(f"fra-{incident_type}-{railroad_short}-{city}-{state}-{date_raw}")

        records.append({
            "id": f"adv-{short_uuid()}",
            "externalId": external_id,
            "slug": slug,
            "railroad": railroad_short,
            "advisoryType": "SERVICE_ALERT",
            "title": title,
            "description": description,
            "affectedArea": state if state and len(state) == 2 else None,
            "isActive": True,
            "issuedAt": f"{date_raw}T00:00:00.000Z" if date_raw else NOW_ISO,
            "expiresAt": None,
            "createdAt": NOW_ISO,
        })

    print(f"[FRA] Total: {len(records)} incident records")
    return records


# --- Source 4b: STB News ---

def fetch_stb_news() -> list[dict]:
    print("[STB] Scraping latest news...")
    url = "https://www.stb.gov/news-communications/latest-news/"
    try:
        resp = requests.get(url, timeout=30, headers={"User-Agent": "Mozilla/5.0 railhub-scraper"})
        resp.raise_for_status()
        html = resp.text
    except Exception as exc:
        print(f"  [STB] ERROR: {exc}")
        return []

    # STB uses class="stb-latest-news" on <article> elements with <h4> headings.
    # Each article contains a heading div and a content div with date + docket in a <p>.
    article_pattern = re.compile(
        r'<article[^>]+class="[^"]*stb-latest-news[^"]*"[^>]*>(.*?)</article>',
        re.DOTALL | re.IGNORECASE,
    )
    tag_pattern = re.compile(r"<[^>]+>")
    heading_pattern = re.compile(r"<h[2-6][^>]*>(.*?)</h[2-6]>", re.DOTALL | re.IGNORECASE)
    # Date format on STB: "02/06/2026 (Friday)"
    date_pattern_mdy = re.compile(r"(\d{2}/\d{2}/\d{4})")
    # Fallback: "February 6, 2026"
    date_pattern_long = re.compile(r"(\w+ \d{1,2},?\s*\d{4})")
    href_pattern = re.compile(r'href=["\']([^"\']+)["\']', re.IGNORECASE)
    docket_pattern = re.compile(r"No\.\s*([\w\-]+)")
    para_pattern = re.compile(r"<p[^>]*>(.*?)</p>", re.DOTALL | re.IGNORECASE)

    records = []
    for match in article_pattern.finditer(html):
        body = match.group(1)

        # Title — from heading tag
        h_match = heading_pattern.search(body)
        title_raw = tag_pattern.sub("", h_match.group(1)).strip() if h_match else ""
        if not title_raw:
            continue

        # Href — first link in the heading div
        href = ""
        a_match = href_pattern.search(body)
        if a_match:
            href = a_match.group(1)
            if href.startswith("/"):
                href = f"https://www.stb.gov{href}"

        # Date — prefer MM/DD/YYYY format found in content paragraph
        date_str = ""
        plain_body = tag_pattern.sub(" ", body)
        d_match = date_pattern_mdy.search(plain_body)
        if d_match:
            try:
                parsed_date = datetime.strptime(d_match.group(1), "%m/%d/%Y")
                date_str = parsed_date.strftime("%Y-%m-%d")
            except ValueError:
                pass
        if not date_str:
            d_match2 = date_pattern_long.search(plain_body)
            if d_match2:
                raw = d_match2.group(1).replace(",", "").strip()
                for fmt in ("%B %d %Y", "%b %d %Y"):
                    try:
                        parsed_date = datetime.strptime(raw, fmt)
                        date_str = parsed_date.strftime("%Y-%m-%d")
                        break
                    except ValueError:
                        pass

        # Docket number (e.g. "No. 26-04")
        docket = None
        dk_match = docket_pattern.search(plain_body)
        if dk_match:
            docket = dk_match.group(1)

        # First paragraph as summary (skip short/whitespace ones)
        summary = ""
        for p_match in para_pattern.finditer(body):
            candidate = tag_pattern.sub("", p_match.group(1)).strip()
            # Skip the date/docket paragraph (short, contains a date)
            if len(candidate) > 30 and not date_pattern_mdy.search(candidate):
                summary = candidate
                break
        if not summary:
            # Fallback: use plain body excerpt
            summary = plain_body.strip()[:200]

        external_id = f"stb-{docket or short_uuid()}"
        published_at = f"{date_str}T00:00:00.000Z" if date_str else NOW_ISO
        slug = slugify(f"{title_raw}-{external_id}")

        records.append({
            "id": f"reg-{short_uuid()}",
            "externalId": external_id,
            "agency": "STB",
            "updateType": "Notice",
            "title": title_raw,
            "summary": summary,
            "content": summary,
            "documentUrl": href or None,
            "docketNumber": docket,
            "slug": slug,
            "publishedAt": published_at,
            "createdAt": NOW_ISO,
        })

    print(f"[STB] Total: {len(records)} news records")
    return records


# --- Main ---

def main() -> None:
    import os

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public",
        "industry.json",
    )

    print("=== Rail Industry Scraper ===")

    metrics = fetch_usda_metrics()
    fuel_surcharges = fetch_eia_fuel_surcharges()

    bnsf_advisories = fetch_bnsf_advisories()
    csx_advisories = fetch_csx_advisories()
    fra_incidents = fetch_fra_incidents()
    advisories = bnsf_advisories + csx_advisories + fra_incidents

    stb_records = fetch_stb_news()
    regulatory = stb_records

    payload = {
        "metrics": metrics,
        "fuelSurcharges": fuel_surcharges,
        "advisories": advisories,
        "regulatory": regulatory,
        "scrapedAt": NOW_ISO,
    }

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)

    print(f"\n=== Done ===")
    print(f"  metrics:       {len(metrics)}")
    print(f"  fuelSurcharges:{len(fuel_surcharges)}")
    print(f"  advisories:    {len(advisories)} ({len(bnsf_advisories)} BNSF + {len(csx_advisories)} CSX + {len(fra_incidents)} FRA)")
    print(f"  regulatory:    {len(regulatory)} ({len(stb_records)} STB)")
    print(f"  output:        {output_path}")


if __name__ == "__main__":
    main()
