import type { RawJobData } from '../types'
import type { JobType } from '@prisma/client'

const BASE_URL = 'https://up.jobs'
const SEARCH_PATH = '/search/?q=&sortColumn=referencedate&sortDirection=desc'
const PAGE_SIZE = 25

// UP posts ~55 jobs; 3 pages covers it with room to spare
const PAGE_OFFSETS = [0, 25, 50]

export async function fetchUnionPacificJobs(): Promise<RawJobData[]> {
  console.log('Union Pacific: fetching jobs...')

  const seen = new Set<string>()
  const jobs: RawJobData[] = []

  for (let i = 0; i < PAGE_OFFSETS.length; i++) {
    const offset = PAGE_OFFSETS[i]
    const url =
      offset === 0
        ? `${BASE_URL}${SEARCH_PATH}`
        : `${BASE_URL}${SEARCH_PATH}&startrow=${offset}`

    console.log(`Union Pacific: fetching page ${i + 1} (startrow=${offset})...`)

    let html: string

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; RailhubBot/1.0; +https://railhub.io)',
        },
      })

      if (!res.ok) {
        console.error(`Union Pacific: page ${i + 1} failed with status ${res.status}`)
        continue
      }

      html = await res.text()
    } catch (err) {
      console.error(`Union Pacific: fetch error on page ${i + 1}:`, err)
      continue
    }

    const pageJobs = parseJobRows(html)
    console.log(`Union Pacific: found ${pageJobs.length} job(s) on page ${i + 1}`)

    for (const job of pageJobs) {
      if (!seen.has(job.externalId)) {
        seen.add(job.externalId)
        jobs.push(job)
      }
    }

    // Respect the server between pages — skip delay after the last page
    if (i < PAGE_OFFSETS.length - 1) {
      await sleep(1000)
    }
  }

  console.log(`Union Pacific: returning ${jobs.length} unique job(s)`)
  return jobs
}

// ---------------------------------------------------------------------------
// HTML parsing
// ---------------------------------------------------------------------------

/**
 * SuccessFactors row shape:
 *
 * <tr class="data-row clickable">
 *   <td class="colTitle">
 *     <a href="/job/Omaha-Year-Round-Intern-Safety-NE-68000/1358457600/">Title</a>
 *   </td>
 *   <td class="colLocation">Omaha, NE 68000</td>
 *   <td class="colDate">Feb 20, 2026</td>
 * </tr>
 */
function parseJobRows(html: string): RawJobData[] {
  const jobs: RawJobData[] = []

  // Match every data-row <tr> block — non-greedy, dotall
  const rowPattern = /<tr[^>]+class="[^"]*data-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/g
  let rowMatch: RegExpExecArray | null

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1]

    try {
      const job = parseRow(rowHtml)
      if (job) jobs.push(job)
    } catch (err) {
      console.error('Union Pacific: failed to parse row:', err)
    }
  }

  return jobs
}

function parseRow(rowHtml: string): RawJobData | null {
  // --- title + URL ---
  const linkMatch = /<a\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/i.exec(rowHtml)
  if (!linkMatch) return null

  const urlPath = linkMatch[1].trim()
  const title = decodeHtmlEntities(linkMatch[2].trim())

  if (!title || !urlPath) return null

  // externalId: last numeric segment of the path, e.g. "/job/.../1358457600/"
  const idMatch = /\/(\d+)\/?$/.exec(urlPath)
  if (!idMatch) return null
  const externalId = `up-${idMatch[1]}`

  // --- location ---
  const locationMatch = /<td[^>]+class="colLocation"[^>]*>\s*([\s\S]*?)\s*<\/td>/i.exec(rowHtml)
  const rawLocation = locationMatch ? decodeHtmlEntities(locationMatch[1].trim()) : ''
  const { city, state } = parseLocation(rawLocation)

  // --- date ---
  const dateMatch = /<td[^>]+class="colDate"[^>]*>\s*([\s\S]*?)\s*<\/td>/i.exec(rowHtml)
  const rawDate = dateMatch ? dateMatch[1].trim() : ''
  const postedAt = parseDate(rawDate) ?? new Date()

  // --- derived fields ---
  const jobType = inferJobType(title)
  const workMode = /\bremote\b/i.test(title) ? 'REMOTE' as const : 'ONSITE' as const

  const description = buildDescription({ title, city, state, jobType })

  return {
    externalId,
    title,
    company: 'Union Pacific',
    city,
    state,
    country: 'US',
    workMode,
    jobType,
    description,
    applyUrl: `${BASE_URL}${urlPath}`,
    postedAt,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLocation(location: string): { city?: string; state?: string } {
  if (!location) return {}

  // "Omaha, NE 68000" → city="Omaha", state="NE"
  const match = /^(.+?),\s*([A-Z]{2})\b/.exec(location)
  if (match) {
    return {
      city: toTitleCase(match[1].trim()),
      state: match[2],
    }
  }

  // Fallback: no comma, treat entire string as city
  return { city: toTitleCase(location.trim()) }
}

/**
 * UP sometimes returns abbreviated city names ("SAN ANTONI", "CEDR RPDS").
 * Title-case them so they at least look reasonable; keep whatever UP provides.
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
}

function inferJobType(title: string): JobType {
  if (/\bintern(ship)?\b/i.test(title)) return 'INTERNSHIP'
  return 'FULL_TIME'
}

/** Parse SuccessFactors date format: "Feb 20, 2026" */
function parseDate(raw: string): Date | null {
  if (!raw) return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

function buildDescription({
  title,
  city,
  state,
  jobType,
}: {
  title: string
  city?: string
  state?: string
  jobType: JobType
}): string {
  const location = [city, state].filter(Boolean).join(', ') || 'various locations'
  const typeLabel = jobType === 'INTERNSHIP' ? 'internship' : 'full-time position'

  return (
    `${title} — ${typeLabel} at Union Pacific Railroad, based in ${location}. ` +
    `Union Pacific operates one of the largest rail networks in North America, ` +
    `spanning 23 states across the western two-thirds of the United States.`
  )
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
