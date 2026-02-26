#!/usr/bin/env python3
"""Scrape railroad jobs from job boards + Class I career pages -> public/jobs.json

Sources:
  JobSpy (Indeed, LinkedIn, ZipRecruiter, Glassdoor, Google Jobs)
  + Direct career pages: CSX, BNSF, Union Pacific, Norfolk Southern, Amtrak

Usage:
  # Full scrape (all sources)
  scripts/.venv-jobspy/bin/python3 scripts/scrape-jobs.py

  # JobSpy only (faster, skip career pages)
  scripts/.venv-jobspy/bin/python3 scripts/scrape-jobs.py --jobspy-only

  # Career pages only (no job board scraping)
  scripts/.venv-jobspy/bin/python3 scripts/scrape-jobs.py --direct-only
"""

import json, re, hashlib, time, sys, uuid, argparse, math
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
import pandas as pd
from bs4 import BeautifulSoup
from jobspy import scrape_jobs

SCRIPT_DIR = Path(__file__).parent
OUTPUT = SCRIPT_DIR.parent / 'public' / 'jobs.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; RailHub-JobBot/1.0; +https://railhub.io/bot)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}


# ─── Category classification (ported from lib/jobs/categories.ts) ────────────

CATEGORY_KEYWORDS = {
    'Operations': ['operations', 'dispatcher', 'yardmaster', 'yard', 'terminal', 'logistics', 'freight', 'shipping', 'warehouse'],
    'Maintenance of Way': ['maintenance of way', 'mow', 'track', 'signal', 'bridge', 'roadway', 'surfacing', 'tie', 'rail welding'],
    'Mechanical': ['mechanical', 'carman', 'car repair', 'locomotive', 'diesel', 'electrician', 'welder', 'machinist', 'car inspector', 'air brake'],
    'Engineering': ['engineer', 'engineering', 'civil engineer', 'design', 'surveyor', 'structural', 'geotechnical', 'project engineer'],
    'Transportation': ['conductor', 'engineer train', 'locomotive engineer', 'trainmaster', 'brakeman', 'switchman', 'train crew', 'transportation'],
    'Management': ['manager', 'director', 'supervisor', 'superintendent', 'vice president', 'chief', 'lead', 'foreman', 'management'],
    'Safety & Compliance': ['safety', 'compliance', 'regulatory', 'fra', 'osha', 'hazmat', 'environmental', 'risk', 'inspection'],
    'IT & Technology': ['software', 'developer', 'data', 'analyst', 'it ', 'technology', 'systems', 'network', 'cyber', 'cloud', 'database'],
    'Administrative': ['administrative', 'admin', 'clerk', 'office', 'accounting', 'finance', 'hr', 'human resources', 'payroll'],
    'Sales & Marketing': ['sales', 'marketing', 'business development', 'account manager', 'customer', 'commercial', 'revenue'],
}


def classify_job(title, description=''):
    text = '%s %s' % (title, description)
    text = text.lower()
    best_cat, best_score = None, 0
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        for kw in keywords:
            if kw in text:
                score += 3 if kw in title.lower() else 1
        if score > best_score:
            best_score = score
            best_cat = category
    return best_cat if best_score >= 1 else None


# ─── Slug + hash helpers ────────────────────────────────────────────────────

def generate_slug(title, company, city='', state=''):
    parts = [title, company]
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    base = '-'.join(parts).lower()
    base = re.sub(r'[^a-z0-9]+', '-', base).strip('-')[:80]
    short_id = uuid.uuid4().hex[:8]
    return '%s-%s' % (base, short_id)


def generate_company_slug(company):
    return re.sub(r'[^a-z0-9]+', '-', company.lower()).strip('-')[:60]


def content_hash(title, company, city=''):
    key = '%s|%s|%s' % (title, company, city)
    return hashlib.md5(key.lower().strip().encode()).hexdigest()


# ─── US state normalization ─────────────────────────────────────────────────

STATE_MAP = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
}

STATE_CODES = set(STATE_MAP.values())


def normalize_state(s):
    if not s:
        return None
    s = s.strip()
    if s.upper() in STATE_CODES:
        return s.upper()
    return STATE_MAP.get(s.lower()) or None


def parse_location_comma(loc):
    """Parse 'City, ST' or 'City, ST ZIP' -> (city, state)"""
    if not loc:
        return None, None
    m = re.match(r'^(.+?),\s*([A-Z]{2})\b', loc.strip())
    if m:
        return m.group(1).strip(), m.group(2)
    return loc.strip(), None


def parse_date_mdy(raw):
    if not raw:
        return datetime.now(timezone.utc)
    try:
        return datetime.strptime(raw.strip(), '%b %d, %Y').replace(tzinfo=timezone.utc)
    except ValueError:
        return datetime.now(timezone.utc)


def safe_iso(dt):
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


# ═══════════════════════════════════════════════════════════════════════════════
# JobSpy: Scrape major job boards (Indeed, LinkedIn, ZipRecruiter, Glassdoor)
# ═══════════════════════════════════════════════════════════════════════════════

# Search queries targeting rail freight industry
JOBSPY_QUERIES = [
    'railroad',
    'freight rail',
    'locomotive engineer',
    'railroad conductor',
    'train dispatcher',
    'railroad maintenance',
    'intermodal freight',
    'transload',
    'rail yard',
    'shortline railroad',
    'freight logistics rail',
    'railroad signal',
]

JOBSPY_SITES = ['indeed', 'zip_recruiter', 'google']

# Map JobSpy job_type values to our types
JOBSPY_TYPE_MAP = {
    'fulltime': 'FULL_TIME',
    'parttime': 'PART_TIME',
    'contract': 'CONTRACT',
    'internship': 'INTERNSHIP',
    'temporary': 'TEMPORARY',
}

# Map JobSpy interval to our salary period
JOBSPY_INTERVAL_MAP = {
    'yearly': 'YEARLY',
    'hourly': 'HOURLY',
    'monthly': 'YEARLY',  # convert monthly -> yearly later
    'weekly': 'YEARLY',
}


def scrape_jobspy():
    """Scrape multiple job boards via JobSpy with railroad-specific queries."""
    print('\n' + '=' * 60)
    print('JobSpy: Scraping job boards...')
    print('  Sites: %s' % ', '.join(JOBSPY_SITES))
    print('  Queries: %d search terms' % len(JOBSPY_QUERIES))
    print('=' * 60)

    all_frames = []

    for i, query in enumerate(JOBSPY_QUERIES):
        print('\n[JobSpy %d/%d] Searching: "%s"...' % (i + 1, len(JOBSPY_QUERIES), query))

        try:
            df = scrape_jobs(
                site_name=JOBSPY_SITES,
                search_term=query,
                location='United States',
                results_wanted=25,
                hours_old=336,  # last 14 days
                country_indeed='USA',
                description_format='markdown',
            )
            print('  Found %d results' % len(df))
            if len(df) > 0:
                all_frames.append(df)
        except Exception as e:
            print('  ERROR: %s' % e)

        # Rate limit between queries
        if i < len(JOBSPY_QUERIES) - 1:
            time.sleep(2)

    if not all_frames:
        print('\n[JobSpy] No results from any query')
        return []

    combined = pd.concat(all_frames, ignore_index=True)
    print('\n[JobSpy] Combined: %d raw results' % len(combined))

    # Deduplicate by job_url (same posting on same board)
    if 'job_url' in combined.columns:
        combined = combined.drop_duplicates(subset=['job_url'], keep='first')
        print('[JobSpy] After URL dedup: %d' % len(combined))

    # Convert DataFrame rows to our job format
    jobs = []
    for _, row in combined.iterrows():
        try:
            title = str(row.get('title', '')).strip()
            company = str(row.get('company', '')).strip()
            if not title or not company or title == 'nan' or company == 'nan':
                continue

            # Location
            city = str(row.get('city', '')).strip() if pd.notna(row.get('city')) else None
            state = str(row.get('state', '')).strip() if pd.notna(row.get('state')) else None
            state = normalize_state(state) if state else None

            # If no city/state, try parsing from location field
            if not state:
                raw_loc = str(row.get('location', '')).strip() if pd.notna(row.get('location')) else ''
                parsed_city, parsed_state = parse_location_comma(raw_loc)
                if not city and parsed_city:
                    city = parsed_city
                if parsed_state:
                    state = parsed_state

            if city and city.lower() == 'nan':
                city = None

            # Job URL
            job_url = str(row.get('job_url', '')).strip()
            if not job_url or job_url == 'nan':
                continue

            # Posted date
            date_posted = row.get('date_posted')
            if pd.notna(date_posted):
                if isinstance(date_posted, str):
                    try:
                        posted = datetime.fromisoformat(date_posted).replace(tzinfo=timezone.utc)
                    except Exception:
                        posted = datetime.now(timezone.utc)
                elif hasattr(date_posted, 'isoformat'):
                    posted = datetime.combine(date_posted, datetime.min.time()).replace(tzinfo=timezone.utc)
                else:
                    posted = datetime.now(timezone.utc)
            else:
                posted = datetime.now(timezone.utc)

            # Job type
            raw_type = str(row.get('job_type', '')).strip().lower() if pd.notna(row.get('job_type')) else ''
            job_type = JOBSPY_TYPE_MAP.get(raw_type, 'FULL_TIME')

            # Work mode
            is_remote = bool(row.get('is_remote')) if pd.notna(row.get('is_remote')) else False
            work_mode = 'REMOTE' if is_remote else 'ONSITE'

            # Salary
            salary_min = None
            salary_max = None
            salary_period = None
            if pd.notna(row.get('min_amount')):
                salary_min = int(row['min_amount'])
            if pd.notna(row.get('max_amount')):
                salary_max = int(row['max_amount'])
            if salary_min or salary_max:
                interval = str(row.get('interval', '')).lower() if pd.notna(row.get('interval')) else 'yearly'
                salary_period = JOBSPY_INTERVAL_MAP.get(interval, 'YEARLY')
                # Normalize monthly/weekly to yearly
                if interval == 'monthly':
                    if salary_min:
                        salary_min *= 12
                    if salary_max:
                        salary_max *= 12
                elif interval == 'weekly':
                    if salary_min:
                        salary_min *= 52
                    if salary_max:
                        salary_max *= 52

            # Description
            desc = str(row.get('description', '')).strip() if pd.notna(row.get('description')) else ''
            if not desc or desc == 'nan':
                desc = '%s at %s.' % (title, company)
            # Truncate extremely long descriptions
            if len(desc) > 3000:
                desc = desc[:3000] + '...'

            # Source attribution
            site = str(row.get('site', 'indeed')).strip()
            source_names = {
                'indeed': 'Indeed',
                'linkedin': 'LinkedIn',
                'zip_recruiter': 'ZipRecruiter',
                'glassdoor': 'Glassdoor',
                'google': 'Google Jobs',
            }
            source_urls = {
                'indeed': 'https://www.indeed.com',
                'linkedin': 'https://www.linkedin.com/jobs',
                'zip_recruiter': 'https://www.ziprecruiter.com',
                'glassdoor': 'https://www.glassdoor.com',
                'google': 'https://www.google.com/search?q=jobs',
            }

            # Build unique ID from URL hash
            url_hash = hashlib.md5(job_url.encode()).hexdigest()[:12]
            job_id = '%s-%s' % (site, url_hash)

            job = {
                'id': job_id,
                'title': title,
                'company': company,
                'companySlug': generate_company_slug(company),
                'country': 'US',
                'workMode': work_mode,
                'jobType': job_type,
                'description': desc,
                'applyUrl': job_url,
                'postedAt': safe_iso(posted),
                'source': source_names.get(site, site.title()),
                'sourceUrl': source_urls.get(site, ''),
            }

            if city:
                job['city'] = city
            if state:
                job['state'] = state
            if salary_min:
                job['salaryMin'] = salary_min
            if salary_max:
                job['salaryMax'] = salary_max
            if salary_period and (salary_min or salary_max):
                job['salaryPeriod'] = salary_period

            jobs.append(job)
        except Exception as e:
            print('[JobSpy] Error converting row: %s' % e)

    print('[JobSpy] Converted %d jobs' % len(jobs))
    return jobs


# ═══════════════════════════════════════════════════════════════════════════════
# Direct career page scrapers (CSX, BNSF, UP, NS, Amtrak)
# ═══════════════════════════════════════════════════════════════════════════════

def scrape_csx():
    print('[CSX] Fetching jobs...')
    url = (
        'https://fa-eowa-saasfaprod1.fa.ocs.oraclecloud.com'
        '/hcmRestApi/resources/latest/recruitingCEJobRequisitions'
        '?onlyData=true'
        '&expand=requisitionList.secondaryLocations,flexFieldsFacet.values'
        '&finder=findReqs;siteNumber=CX_45001,'
        'facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES'
        '%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,'
        'limit=100,lastSelectedFacet=POSTING_DATES,'
        'selectedCategoriesFacet=,selectedFlexFieldsFacets=,'
        'selectedLocationsFacet=,selectedPostingDatesFacet=,'
        'selectedOrganizationsFacet=,selectedTitlesFacet=,'
        'selectedWorkLocationsFacet=,selectedWorkplaceTypesFacet=,'
        'sortBy=POSTING_DATES_DESC'
    )
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print('[CSX] Error: %s' % e)
        return []

    reqs = []
    for item in data.get('items', []):
        reqs.extend(item.get('requisitionList', []))
    print('[CSX] Found %d requisitions' % len(reqs))
    jobs = []

    for r in reqs:
        try:
            city, state = parse_location_comma(r.get('PrimaryLocation', ''))
            wm_map = {'ORA_REMOTE': 'REMOTE', 'ORA_HYBRID': 'HYBRID', 'ORA_ONSITE': 'ONSITE'}
            work_mode = wm_map.get(r.get('WorkplaceTypeCode', ''), 'ONSITE')
            desc_parts = [r.get('ShortDescriptionStr', ''), r.get('ExternalResponsibilitiesStr', ''), r.get('ExternalQualificationsStr', '')]
            description = '\n\n'.join(p for p in desc_parts if p)
            title = r['Title']
            try:
                posted = datetime.fromisoformat(r.get('PostedDate', '').replace('Z', '+00:00'))
            except Exception:
                posted = datetime.now(timezone.utc)

            jobs.append({
                'id': 'csx-%s' % r['Id'],
                'title': title, 'company': 'CSX Transportation', 'companySlug': 'csx-transportation',
                'city': city, 'state': state, 'country': 'US',
                'workMode': work_mode, 'jobType': 'FULL_TIME',
                'description': description or '%s at CSX Transportation.' % title,
                'applyUrl': 'https://fa-eowa-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CSXCareers/job/%s' % r['Id'],
                'postedAt': safe_iso(posted), 'source': 'CSX Careers',
                'sourceUrl': 'https://www.csx.com/index.cfm/working-at-csx/careers/',
            })
        except Exception as e:
            print('[CSX] Error mapping: %s' % e)
    print('[CSX] Returning %d jobs' % len(jobs))
    return jobs


def scrape_bnsf():
    print('[BNSF] Fetching jobs...')

    def fetch_page(offset):
        url = 'https://jobs.bnsf.com/us/en/search-results?keywords=&from=%d&s=1' % offset
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            html = resp.text
        except Exception as e:
            print('[BNSF] Error at offset=%d: %s' % (offset, e))
            return None
        marker = '"eagerLoadRefineSearch":'
        idx = html.find(marker)
        if idx == -1:
            return None
        json_start = idx + len(marker)
        depth, json_end, i, in_string = 0, -1, json_start, False
        while i < len(html):
            ch = html[i]
            if ch == '"' and (i == 0 or html[i - 1] != '\\'):
                in_string = not in_string
            elif not in_string:
                if ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        json_end = i + 1
                        break
            i += 1
        if json_end == -1:
            return None
        try:
            return json.loads(html[json_start:json_end])
        except json.JSONDecodeError:
            return None

    first = fetch_page(0)
    if not first:
        return []
    total_hits = first.get('totalHits', 0)
    print('[BNSF] Total hits: %d' % total_hits)
    all_raw = list(first.get('data', {}).get('jobs', []))
    for offset in range(10, min(total_hits, 500), 10):
        time.sleep(1)
        page = fetch_page(offset)
        if page and page.get('data', {}).get('jobs'):
            all_raw.extend(page['data']['jobs'])

    seen = set()
    unique = [j for j in all_raw if j.get('jobSeqNo') and j['jobSeqNo'] not in seen and not seen.add(j['jobSeqNo'])]
    print('[BNSF] Unique: %d' % len(unique))
    jobs = []
    for j in unique:
        try:
            state = normalize_state(j.get('state'))
            city = (j.get('city') or '').strip() or None
            title = j['title']
            try:
                posted = datetime.fromisoformat(j.get('postedDate', '').replace('Z', '+00:00').replace('+0000', '+00:00'))
            except Exception:
                posted = datetime.now(timezone.utc)
            desc = (j.get('descriptionTeaser') or '').strip() or '%s at BNSF Railway.' % title
            apply_url = (j.get('applyUrl') or '').strip() or 'https://jobs.bnsf.com/us/en/job/%s' % j['jobSeqNo']
            jobs.append({
                'id': 'bnsf-%s' % j['jobSeqNo'],
                'title': title, 'company': 'BNSF Railway', 'companySlug': 'bnsf-railway',
                'city': city, 'state': state, 'country': 'US',
                'workMode': 'ONSITE', 'jobType': 'FULL_TIME',
                'description': desc, 'applyUrl': apply_url,
                'postedAt': safe_iso(posted), 'source': 'BNSF Careers', 'sourceUrl': 'https://jobs.bnsf.com',
            })
        except Exception as e:
            print('[BNSF] Error: %s' % e)
    print('[BNSF] Returning %d jobs' % len(jobs))
    return jobs


def scrape_union_pacific():
    print('[UP] Fetching jobs...')
    base_url, search_path = 'https://up.jobs', '/search/?q=&sortColumn=referencedate&sortDirection=desc'
    seen, jobs = set(), []
    for i, offset in enumerate([0, 25, 50]):
        url = '%s%s' % (base_url, search_path) + ('&startrow=%d' % offset if offset > 0 else '')
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            print('[UP] Error page %d: %s' % (i + 1, e))
            continue
        soup = BeautifulSoup(resp.text, 'html.parser')
        for row in soup.select('tr.data-row'):
            try:
                link = row.select_one('a[href*="/job/"]')
                if not link:
                    continue
                url_path, title = link.get('href', ''), link.get_text(strip=True)
                id_match = re.search(r'/(\d+)/?$', url_path)
                if not id_match:
                    continue
                ext_id = 'up-%s' % id_match.group(1)
                if ext_id in seen:
                    continue
                seen.add(ext_id)
                loc_td = row.select_one('td.colLocation')
                city, state = parse_location_comma(loc_td.get_text(strip=True) if loc_td else '')
                if city:
                    city = city.title()
                date_td = row.select_one('td.colDate')
                posted = parse_date_mdy(date_td.get_text(strip=True) if date_td else '')
                work_mode = 'REMOTE' if 'remote' in title.lower() else 'ONSITE'
                job_type = 'INTERNSHIP' if 'intern' in title.lower() else 'FULL_TIME'
                loc_str = ', '.join(filter(None, [city, state])) or 'various locations'
                desc = '%s at Union Pacific Railroad in %s.' % (title, loc_str)
                jobs.append({
                    'id': ext_id, 'title': title, 'company': 'Union Pacific', 'companySlug': 'union-pacific',
                    'city': city, 'state': state, 'country': 'US',
                    'workMode': work_mode, 'jobType': job_type, 'description': desc,
                    'applyUrl': '%s%s' % (base_url, url_path),
                    'postedAt': safe_iso(posted), 'source': 'Union Pacific Careers', 'sourceUrl': 'https://up.jobs',
                })
            except Exception as e:
                print('[UP] Error: %s' % e)
        if i < 2:
            time.sleep(1)
    print('[UP] Returning %d jobs' % len(jobs))
    return jobs


def scrape_norfolk_southern():
    print('[NS] Fetching jobs...')
    base_url = 'https://jobs.nscorp.com'
    pages = [
        '%s/search/?q=&sortColumn=referencedate&sortDirection=desc' % base_url,
        '%s/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=25' % base_url,
    ]
    seen, jobs = set(), []
    for i, url in enumerate(pages):
        if i > 0:
            time.sleep(1)
        try:
            resp = requests.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
            }, timeout=30)
            resp.raise_for_status()
        except Exception as e:
            print('[NS] Error page %d: %s' % (i + 1, e))
            continue
        soup = BeautifulSoup(resp.text, 'html.parser')
        for tile in soup.select('li.job-tile'):
            try:
                ext_id = None
                for c in tile.get('class', []):
                    m = re.match(r'job-id-(\d+)', c)
                    if m:
                        ext_id = 'ns-%s' % m.group(1)
                        break
                if not ext_id or ext_id in seen:
                    continue
                seen.add(ext_id)
                url_path = tile.get('data-url', '')
                title_link = tile.select_one('a.jobTitle-link')
                title = title_link.get_text(strip=True) if title_link else ''
                if not title:
                    continue
                loc_div = tile.select_one('[id*="location-value"]')
                raw_loc = loc_div.get_text(strip=True) if loc_div else ''
                city, state = parse_location_comma(raw_loc)
                date_div = tile.select_one('[id*="date-value"]')
                posted = parse_date_mdy(date_div.get_text(strip=True) if date_div else '')
                desc = '%s at Norfolk Southern. Location: %s.' % (title, raw_loc or 'Various')
                jobs.append({
                    'id': ext_id, 'title': title, 'company': 'Norfolk Southern', 'companySlug': 'norfolk-southern',
                    'city': city, 'state': state, 'country': 'US',
                    'workMode': 'REMOTE' if 'remote' in title.lower() else 'ONSITE',
                    'jobType': 'INTERNSHIP' if 'intern' in title.lower() else 'FULL_TIME',
                    'description': desc, 'applyUrl': '%s%s' % (base_url, url_path),
                    'postedAt': safe_iso(posted), 'source': 'Norfolk Southern Careers', 'sourceUrl': 'https://jobs.nscorp.com',
                })
            except Exception as e:
                print('[NS] Error: %s' % e)
    print('[NS] Returning %d jobs' % len(jobs))
    return jobs


def scrape_amtrak():
    print('[Amtrak] Fetching jobs...')
    base_url = 'https://careers.amtrak.com'
    try:
        resp = requests.get('%s/go/All-Jobs/8336500/?q=&sortColumn=referencedate&sortDirection=desc' % base_url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print('[Amtrak] Error: %s' % e)
        return []
    soup = BeautifulSoup(resp.text, 'html.parser')
    rows = soup.select('tr.data-row')
    print('[Amtrak] Found %d rows' % len(rows))
    jobs, seen = [], set()
    for row in rows:
        try:
            title_span = row.select_one('span.jobTitle')
            if not title_span:
                continue
            link = title_span.select_one('a.jobTitle-link')
            if not link:
                continue
            url_path = link.get('href', '')
            title = re.sub(r'\s*-\s*\d{6,}\s*$', '', link.get_text(strip=True)).strip()
            id_match = re.search(r'/(\d+)/?$', url_path)
            ext_id = 'amtrak-%s' % id_match.group(1) if id_match else 'amtrak-%s' % hashlib.md5(url_path.encode()).hexdigest()[:8]
            if ext_id in seen:
                continue
            seen.add(ext_id)
            loc_span = row.select_one('span.jobLocation')
            city, state = parse_location_comma(loc_span.get_text(strip=True) if loc_span else '')
            date_span = row.select_one('span.jobDate')
            posted = parse_date_mdy(date_span.get_text(strip=True) if date_span else '')
            desc = '%s at Amtrak in %s.' % (title, loc_span.get_text(strip=True) if loc_span else 'Amtrak')
            jobs.append({
                'id': ext_id, 'title': title, 'company': 'Amtrak', 'companySlug': 'amtrak',
                'city': city, 'state': state, 'country': 'US',
                'workMode': 'ONSITE', 'jobType': 'FULL_TIME',
                'description': desc, 'applyUrl': '%s%s' % (base_url, url_path),
                'postedAt': safe_iso(posted), 'source': 'Amtrak Careers', 'sourceUrl': 'https://careers.amtrak.com',
            })
        except Exception as e:
            print('[Amtrak] Error: %s' % e)
    print('[Amtrak] Returning %d jobs' % len(jobs))
    return jobs


# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Scrape railroad jobs')
    parser.add_argument('--jobspy-only', action='store_true', help='Only scrape via JobSpy (skip career pages)')
    parser.add_argument('--direct-only', action='store_true', help='Only scrape career pages (skip JobSpy)')
    args = parser.parse_args()

    all_jobs = []
    hashes = set()

    def add_jobs(jobs, source_label):
        added = 0
        for job in jobs:
            h = content_hash(job['title'], job['company'], job.get('city') or '')
            if h in hashes:
                continue
            hashes.add(h)
            job['category'] = classify_job(job['title'], job.get('description', ''))
            job['slug'] = generate_slug(job['title'], job['company'], job.get('city') or '', job.get('state') or '')
            all_jobs.append(job)
            added += 1
        print('[%s] %d unique jobs added (deduped from %d)' % (source_label, added, len(jobs)))

    # Phase 1: Direct career page scrapers
    if not args.jobspy_only:
        direct_scrapers = [
            ('CSX', scrape_csx),
            ('BNSF', scrape_bnsf),
            ('Union Pacific', scrape_union_pacific),
            ('Norfolk Southern', scrape_norfolk_southern),
            ('Amtrak', scrape_amtrak),
        ]
        print('\n--- Phase 1: Direct career page scrapers ---')
        for name, scraper in direct_scrapers:
            try:
                jobs = scraper()
                add_jobs(jobs, name)
            except Exception as e:
                print('[%s] FAILED: %s' % (name, e))

    # Phase 2: JobSpy (job board aggregation)
    if not args.direct_only:
        print('\n--- Phase 2: JobSpy (job board aggregation) ---')
        try:
            jobs = scrape_jobspy()
            add_jobs(jobs, 'JobSpy')
        except Exception as e:
            print('[JobSpy] FAILED: %s' % e)

    # Sort by posted date (newest first)
    all_jobs.sort(key=lambda j: j.get('postedAt', ''), reverse=True)

    # Clean null values
    for job in all_jobs:
        for key in list(job.keys()):
            if job[key] is None:
                del job[key]

    OUTPUT.write_text(json.dumps(all_jobs, indent=2, ensure_ascii=False))

    # Summary
    print('\n' + '=' * 60)
    print('TOTAL: %d jobs' % len(all_jobs))
    print('=' * 60)

    by_source = {}
    for j in all_jobs:
        s = j.get('source', 'Unknown')
        by_source[s] = by_source.get(s, 0) + 1
    print('\nBy source:')
    for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print('  %s: %d' % (source, count))

    by_company = {}
    for j in all_jobs:
        by_company[j['company']] = by_company.get(j['company'], 0) + 1
    print('\nTop companies:')
    for company, count in sorted(by_company.items(), key=lambda x: -x[1])[:15]:
        print('  %s: %d' % (company, count))

    by_cat = {}
    for j in all_jobs:
        cat = j.get('category') or 'Uncategorized'
        by_cat[cat] = by_cat.get(cat, 0) + 1
    print('\nBy category:')
    for cat, count in sorted(by_cat.items(), key=lambda x: -x[1]):
        print('  %s: %d' % (cat, count))

    with_salary = sum(1 for j in all_jobs if j.get('salaryMin') or j.get('salaryMax'))
    print('\nWith salary data: %d/%d (%.0f%%)' % (with_salary, len(all_jobs), 100 * with_salary / len(all_jobs) if all_jobs else 0))

    print('\nWrote to %s' % OUTPUT)


if __name__ == '__main__':
    main()
