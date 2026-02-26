#!/usr/bin/env python3
"""Append CLASSI, CARHIRE, and AEI seed facility entries to facilities.json."""

import json
import os

FACILITIES_PATH = os.path.join(os.path.dirname(__file__), '..', 'public', 'facilities.json')

DEFAULT_CAPABILITIES = {
    "track_capacity": None,
    "railcar_spot_count": None,
    "hazmat_certified": False,
    "food_grade": False,
    "kosher_certified": False,
    "has_scale": False,
    "has_railcar_storage": False,
    "is_24_7": False,
    "weight_restricted_263k": False,
    "weight_restricted_286k": False,
    "equipment_list": [],
    "storage_options": [],
    "transfer_modes": [],
    "security_features": [],
    "cities_served": [],
    "heating_capabilities": False,
    "onsite_railcar_storage": False,
    "onsite_scale": False,
    "product_types": []
}

def make_location(city, state, country="US"):
    return {
        "street_address": None,
        "city": city,
        "state": state,
        "zip_code": None,
        "country": country,
        "latitude": None,
        "longitude": None
    }

def make_entry(id_, name, type_, city, state, country, website, phone, description, railroads=None):
    return {
        "id": id_,
        "external_id": id_,
        "name": name,
        "type": type_,
        "status": "active",
        "phone": phone,
        "email": None,
        "website": website,
        "description": description,
        "about": None,
        "location": make_location(city, state, country),
        "capabilities": dict(DEFAULT_CAPABILITIES),
        "categories": [],
        "railroads": railroads or []
    }

def rr(name):
    """Helper to build a railroad entry."""
    return [{"railroad": {"name": name}, "daysOfWeek": None, "notes": None}]

# --- Class I Railroad entries ---
classi_entries = [
    make_entry(
        "seed-classi-001", "BNSF Railway", "CLASSI",
        "Fort Worth", "TX", "US",
        "https://www.bnsf.com", "+18179528000",
        "BNSF Railway is a Class I railroad headquartered in Fort Worth, TX. One of the largest freight railroads in North America, operating approximately 32,500 route miles across 28 states and 3 Canadian provinces.",
        rr("BNSF")
    ),
    make_entry(
        "seed-classi-002", "Union Pacific Railroad", "CLASSI",
        "Omaha", "NE", "US",
        "https://www.up.com", "+14025448000",
        "Union Pacific Railroad is a Class I railroad headquartered in Omaha, NE. Operates approximately 32,200 route miles across 23 states in the western two-thirds of the United States.",
        rr("UP")
    ),
    make_entry(
        "seed-classi-003", "CSX Transportation", "CLASSI",
        "Jacksonville", "FL", "US",
        "https://www.csx.com", "+19043593200",
        "CSX Transportation is a Class I railroad headquartered in Jacksonville, FL. Operates approximately 21,000 route miles across 23 states east of the Mississippi River and in two Canadian provinces.",
        rr("CSXT")
    ),
    make_entry(
        "seed-classi-004", "Norfolk Southern Railway", "CLASSI",
        "Atlanta", "GA", "US",
        "https://www.norfolksouthern.com", "+14705294100",
        "Norfolk Southern Railway is a Class I railroad headquartered in Atlanta, GA. Operates approximately 19,500 route miles across 22 states in the eastern United States.",
        rr("NS")
    ),
    make_entry(
        "seed-classi-005", "Canadian National Railway", "CLASSI",
        "Montreal", "QC", "CA",
        "https://www.cn.ca", "+15147454000",
        "Canadian National Railway is a Class I railroad headquartered in Montreal, QC. Operates approximately 20,000 route miles spanning Canada and mid-America, from the Atlantic and Pacific oceans to the Gulf of Mexico.",
        rr("CN")
    ),
    make_entry(
        "seed-classi-006", "Canadian Pacific Kansas City", "CLASSI",
        "Calgary", "AB", "CA",
        "https://www.cpkcr.com", "+14035447000",
        "Canadian Pacific Kansas City is a Class I railroad headquartered in Calgary, AB. Formed by the merger of Canadian Pacific and Kansas City Southern, operating approximately 20,000 route miles across Canada, the United States, and Mexico.",
        rr("CPKC")
    ),
    make_entry(
        "seed-classi-007", "Kansas City Southern (now CPKC)", "CLASSI",
        "Kansas City", "MO", "US",
        "https://www.cpkcr.com", "+18165561000",
        "Kansas City Southern, now part of Canadian Pacific Kansas City (CPKC), was a Class I railroad headquartered in Kansas City, MO. The legacy KCS network connects the central United States to Mexico.",
        rr("CPKC")
    ),
]

# --- Car Hire / Per Diem entries ---
carhire_entries = [
    make_entry(
        "seed-carhire-001", "Railinc Corporation", "CARHIRE",
        "Cary", "NC", "US",
        "https://www.railinc.com", "+19197927000",
        "Railinc Corporation is the rail industry's central provider for car hire, per diem settlement, and equipment data. Manages the Umler system, car hire billing, and provides data services to railroads and equipment owners across North America."
    ),
    make_entry(
        "seed-carhire-002", "RSI Logistics", "CARHIRE",
        "Holland", "MI", "US",
        "https://www.rsilogistics.com", "+16163991680",
        "RSI Logistics provides per diem management and private car fleet optimization services. Specializes in reducing railcar per diem and demurrage costs through analytics-driven fleet management."
    ),
    make_entry(
        "seed-carhire-003", "PLG Consulting", "CARHIRE",
        "Jacksonville", "FL", "US",
        None, None,
        "PLG Consulting provides rail fleet and per diem consulting services. Advises shippers and railcar owners on car hire optimization, fleet strategy, and private car economics."
    ),
    make_entry(
        "seed-carhire-004", "Tealinc Ltd", "CARHIRE",
        "Great Falls", "MT", "US",
        "https://www.tealinc.com", "+14067710011",
        "Tealinc Ltd specializes in railcar fleet management, car hire optimization, and rail transportation logistics. Provides fleet management, brokerage, and consulting services to shippers and railcar owners."
    ),
    make_entry(
        "seed-carhire-005", "The Greenbrier Companies", "CARHIRE",
        "Lake Oswego", "OR", "US",
        "https://www.gbrx.com", "+15036848000",
        "The Greenbrier Companies is a leading manufacturer and lessor of railcars with car hire management services. Provides leasing, fleet management, and car hire optimization as part of its integrated rail services platform."
    ),
]

# --- AEI Hardware entries ---
aei_entries = [
    make_entry(
        "seed-aei-001", "TransCore", "AEI",
        "Nashville", "TN", "US",
        "https://www.transcore.com", "+16158554000",
        "TransCore is a leading provider of AEI tag readers and RFID technology for railcar identification. Supplies automatic equipment identification systems used across North American railroads for real-time asset tracking."
    ),
    make_entry(
        "seed-aei-002", "Amtech Systems (now TransCore)", "AEI",
        "Dallas", "TX", "US",
        None, None,
        "Amtech Systems developed the original AEI tag technology for automatic equipment identification in the rail industry. Now part of TransCore, the Amtech legacy includes the foundational RFID standards adopted by the AAR."
    ),
    make_entry(
        "seed-aei-003", "Sirit Inc", "AEI",
        "Toronto", "ON", "CA",
        None, None,
        "Sirit Inc manufactures RFID readers for rail and intermodal container identification. Provides AEI-compliant readers used for automatic railcar and container tracking at rail yards and intermodal facilities."
    ),
    make_entry(
        "seed-aei-004", "Neology (formerly Sirit)", "AEI",
        "San Diego", "CA", "US",
        "https://www.neology.net", None,
        "Neology, formerly Sirit, manufactures AEI readers and tags for the rail industry. Provides RFID-based automatic equipment identification hardware for railcar tracking, yard management, and intermodal operations."
    ),
    make_entry(
        "seed-aei-005", "Zebra Technologies", "AEI",
        "Lincolnshire", "IL", "US",
        "https://www.zebra.com", "+18474345000",
        "Zebra Technologies provides RFID and AEI hardware solutions for logistics and rail. Offers fixed and handheld RFID readers, tags, and enterprise asset intelligence solutions used in rail yard and supply chain operations."
    ),
]

all_new = classi_entries + carhire_entries + aei_entries

# Load existing, append, write back
print(f"Reading {FACILITIES_PATH}...")
with open(FACILITIES_PATH, 'r') as f:
    facilities = json.load(f)

existing_ids = {fac['id'] for fac in facilities}
added = 0
for entry in all_new:
    if entry['id'] not in existing_ids:
        facilities.append(entry)
        added += 1
    else:
        print(f"  Skipping duplicate: {entry['id']}")

print(f"Appending {added} new entries (total: {len(facilities)})...")
with open(FACILITIES_PATH, 'w') as f:
    json.dump(facilities, f, indent=2)

print("Done.")
