import type { RawJobData } from '../types'

const BASE_URL = 'https://jobs.bnsf.com'
const SEARCH_URL = `${BASE_URL}/us/en/search-results`
const PAGE_SIZE = 10

const STATE_MAP: Record<string, string> = {
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

interface BNSFJob {
  title: string
  jobSeqNo: string
  jobId?: string
  reqId?: string
  category?: string
  department?: string
  city?: string
  state?: string
  country?: string
  postedDate?: string
  descriptionTeaser?: string
  applyUrl?: string
  latitude?: number
  longitude?: number
  ml_skills?: string[]
}

interface BNSFSearchPayload {
  status: number
  hits: number
  totalHits: number
  data: {
    jobs: BNSFJob[]
  }
}

/**
 * Extracts the eagerLoadRefineSearch JSON payload from raw HTML.
 * Phenom People embeds it as: "eagerLoadRefineSearch":{"status":200,...}
 * Uses brace-counting to find the matching closing brace of the deeply nested JSON.
 */
function extractSearchPayload(html: string): BNSFSearchPayload | null {
  const marker = '"eagerLoadRefineSearch":'
  const idx = html.indexOf(marker)
  if (idx === -1) return null

  const jsonStart = idx + marker.length
  // Find the matching closing brace by counting depth
  let depth = 0
  let jsonEnd = -1

  for (let i = jsonStart; i < html.length; i++) {
    const ch = html[i]
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) {
        jsonEnd = i + 1
        break
      }
    }
    // Skip string contents to avoid counting braces inside strings
    if (ch === '"') {
      i++
      while (i < html.length && html[i] !== '"') {
        if (html[i] === '\\') i++ // skip escaped chars
        i++
      }
    }
  }

  if (jsonEnd === -1) return null

  const jsonStr = html.slice(jsonStart, jsonEnd)

  try {
    return JSON.parse(jsonStr) as BNSFSearchPayload
  } catch (err) {
    console.error('[bnsf] Failed to parse eagerLoadRefineSearch JSON:', err)
    return null
  }
}

/**
 * Maps a full US state name (case-insensitive) to its 2-letter code.
 * Returns the original string unchanged if not found in the map.
 */
function mapState(stateName?: string): string | undefined {
  if (!stateName) return undefined
  const code = STATE_MAP[stateName.toLowerCase().trim()]
  return code ?? stateName
}

/**
 * Parses BNSF posted date. Can be:
 * - ISO timestamp: "2026-02-20T17:05:18.000+0000"
 * - Relative: "Posted X days ago" / "today" / "just posted"
 * Falls back to the current date when the string cannot be interpreted.
 */
function parsePostedDate(raw?: string): Date {
  if (!raw) return new Date()

  const trimmed = raw.trim()

  // Try ISO date first (most common from actual API)
  const isoDate = new Date(trimmed)
  if (!isNaN(isoDate.getTime())) return isoDate

  const lower = trimmed.toLowerCase()

  if (lower.includes('today') || lower.includes('just posted') || lower.includes('0 days')) {
    return new Date()
  }

  const daysMatch = lower.match(/(\d+)\s+day/)
  if (daysMatch) {
    const date = new Date()
    date.setDate(date.getDate() - parseInt(daysMatch[1], 10))
    return date
  }

  const weeksMatch = lower.match(/(\d+)\s+week/)
  if (weeksMatch) {
    const date = new Date()
    date.setDate(date.getDate() - parseInt(weeksMatch[1], 10) * 7)
    return date
  }

  const monthsMatch = lower.match(/(\d+)\s+month/)
  if (monthsMatch) {
    const date = new Date()
    date.setMonth(date.getMonth() - parseInt(monthsMatch[1], 10))
    return date
  }

  console.warn(`[bnsf] Could not parse postedDate: "${raw}", using now`)
  return new Date()
}

/**
 * Fetches a single search-results page and returns its payload, or null on failure.
 */
async function fetchPage(from: number): Promise<BNSFSearchPayload | null> {
  const url = `${SEARCH_URL}?keywords=&from=${from}&s=1`

  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RailHub-JobBot/1.0; +https://railhub.io/bot)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    if (!res.ok) {
      console.error(`[bnsf] HTTP ${res.status} for from=${from}`)
      return null
    }

    html = await res.text()
  } catch (err) {
    console.error(`[bnsf] Network error fetching from=${from}:`, err)
    return null
  }

  const payload = extractSearchPayload(html)
  if (!payload) {
    console.warn(`[bnsf] No eagerLoadRefineSearch found on page from=${from}`)
  }
  return payload
}

/** Pauses execution for the given number of milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchBNSFJobs(): Promise<RawJobData[]> {
  console.log('[bnsf] Fetching job listings...')

  // Fetch the first page to discover the total hit count.
  const firstPage = await fetchPage(0)
  if (!firstPage) {
    console.error('[bnsf] Failed to fetch first page, aborting')
    return []
  }

  const totalHits = firstPage.totalHits ?? 0
  console.log(`[bnsf] Total hits: ${totalHits}`)

  const allRaw: BNSFJob[] = [...(firstPage.data?.jobs ?? [])]

  // Fetch remaining pages sequentially with 1-second delays.
  for (let from = PAGE_SIZE; from < totalHits; from += PAGE_SIZE) {
    await sleep(1000)
    console.log(`[bnsf] Fetching page from=${from}...`)
    const page = await fetchPage(from)
    if (page?.data?.jobs) {
      allRaw.push(...page.data.jobs)
    }
  }

  console.log(`[bnsf] Raw job count before dedup: ${allRaw.length}`)

  // Deduplicate by jobSeqNo.
  const seen = new Set<string>()
  const unique = allRaw.filter((job) => {
    if (!job.jobSeqNo || seen.has(job.jobSeqNo)) return false
    seen.add(job.jobSeqNo)
    return true
  })

  console.log(`[bnsf] Unique jobs after dedup: ${unique.length}`)

  const jobs: RawJobData[] = []

  for (const job of unique) {
    try {
      jobs.push({
        externalId: `bnsf-${job.jobSeqNo}`,
        title: job.title,
        company: 'BNSF Railway',
        city: job.city,
        state: mapState(job.state),
        country: 'US',
        workMode: 'ONSITE',
        jobType: 'FULL_TIME',
        description:
          job.descriptionTeaser?.trim() ||
          `${job.title} at BNSF Railway${job.city ? ` in ${job.city}` : ''}. Apply at jobs.bnsf.com`,
        applyUrl:
          job.applyUrl?.trim() ||
          `${BASE_URL}/us/en/job/${job.jobSeqNo}`,
        postedAt: parsePostedDate(job.postedDate),
      })
    } catch (err) {
      console.error(`[bnsf] Failed to map job ${job.jobSeqNo}:`, err)
    }
  }

  console.log(`[bnsf] Returning ${jobs.length} jobs`)
  return jobs
}
