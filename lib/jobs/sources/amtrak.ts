import type { RawJobData } from '../types'

const AMTRAK_JOBS_URL =
  'https://careers.amtrak.com/go/All-Jobs/8336500/?q=&sortColumn=referencedate&sortDirection=desc'

const BASE_URL = 'https://careers.amtrak.com'

interface ParsedRow {
  title: string
  urlPath: string
  externalId: string
  rawLocation: string
  rawDate: string
}

/**
 * Parses SuccessFactors location format: "City,  ST, US, 23228" or "City, State"
 * The double-space and country code are common in SuccessFactors output.
 */
function parseLocation(raw: string): { city?: string; state?: string } {
  const trimmed = raw.trim()
  // Format: "Richmond,  VA, US, 23228" or "Chicago, Illinois"
  const match = trimmed.match(/^(.+?),\s*([A-Z]{2})\b/)
  if (!match) return {}
  return { city: match[1].trim(), state: match[2] }
}

/**
 * Parses Amtrak date strings like "Feb 20, 2026" into a Date.
 * Falls back to current time if parsing fails.
 */
function parseAmtrakDate(raw: string): Date {
  const trimmed = raw.trim()
  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed
  console.warn(`[amtrak] Could not parse date: "${trimmed}", using now`)
  return new Date()
}

/**
 * Strips the job number suffix from an Amtrak title.
 * e.g. "Customer Service Representative (Guaranteed Extra Board) - 90364455"
 *   → "Customer Service Representative (Guaranteed Extra Board)"
 */
function cleanTitle(raw: string): string {
  return raw.replace(/\s*-\s*\d{6,}\s*$/, '').trim()
}

/**
 * Extracts the numeric job ID from the URL path.
 * e.g. "/job/Richmond-Customer-Service-Representative-90364455-Richmond-VA-23228/1366549700/"
 *   → "1366549700"
 */
function extractExternalId(urlPath: string): string {
  const match = urlPath.match(/\/(\d+)\/?$/)
  return match ? match[1] : urlPath
}

/**
 * Parses job rows from the Amtrak careers page HTML.
 * SuccessFactors uses `<tr class="data-row">` (no "clickable" suffix).
 * Title lives inside `<span class="jobTitle hidden-phone"><a class="jobTitle-link" ...>`.
 * Location format: "Richmond,  VA, US, 23228" (double-space, country, zip).
 */
function parseJobRows(html: string): ParsedRow[] {
  const rows: ParsedRow[] = []

  const rowPattern = /<tr\s+class="data-row">([\s\S]*?)<\/tr>/g
  let rowMatch: RegExpExecArray | null

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1]

    // Title link inside <span class="jobTitle hidden-phone">
    const titleMatch = rowHtml.match(
      /<span\s+class="jobTitle hidden-phone">[\s\S]*?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
    )
    if (!titleMatch) continue

    const urlPath = titleMatch[1].trim()
    const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim()

    // Location from <span class="jobLocation"> inside hidden-phone colLocation
    const locationMatch = rowHtml.match(
      /<td[^>]*class="colLocation[^"]*"[^>]*>[\s\S]*?<span\s+class="jobLocation">\s*([\s\S]*?)\s*<\/span>/
    )
    const rawLocation = locationMatch
      ? locationMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      : ''

    // Date from <span class="jobDate"> inside hidden-phone colDate
    const dateMatch = rowHtml.match(
      /<td[^>]*class="colDate[^"]*"[^>]*>[\s\S]*?<span\s+class="jobDate">\s*([\s\S]*?)\s*<\/span>/
    )
    const rawDate = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    const title = cleanTitle(rawTitle)
    const externalId = extractExternalId(urlPath)

    if (!title || !externalId) continue

    rows.push({ title, urlPath, externalId, rawLocation, rawDate })
  }

  return rows
}

export async function fetchAmtrakJobs(): Promise<RawJobData[]> {
  console.log('[amtrak] Fetching job listings...')

  let html: string
  try {
    const res = await fetch(AMTRAK_JOBS_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RailHub-JobBot/1.0; +https://railhub.io/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.error(`[amtrak] HTTP ${res.status} fetching ${AMTRAK_JOBS_URL}`)
      return []
    }

    html = await res.text()
  } catch (err) {
    console.error('[amtrak] Network error:', err)
    return []
  }

  const rows = parseJobRows(html)
  console.log(`[amtrak] Parsed ${rows.length} job rows`)

  if (rows.length === 0) {
    console.warn('[amtrak] No rows found — page structure may have changed')
    return []
  }

  const jobs: RawJobData[] = rows.map((row) => {
    const { city, state } = parseLocation(row.rawLocation)
    const location = row.rawLocation || 'Amtrak'

    return {
      externalId: row.externalId,
      title: row.title,
      company: 'Amtrak',
      city,
      state,
      country: 'US',
      workMode: 'ONSITE',
      jobType: 'FULL_TIME',
      description: `${row.title} at Amtrak in ${location}. Apply at careers.amtrak.com`,
      applyUrl: `${BASE_URL}${row.urlPath}`,
      postedAt: parseAmtrakDate(row.rawDate),
    }
  })

  console.log(`[amtrak] Returning ${jobs.length} jobs`)
  return jobs
}
