import type { RawJobData } from '../types'

const BASE_URL = 'https://jobs.nscorp.com'

const PAGES = [
  `${BASE_URL}/search/?q=&sortColumn=referencedate&sortDirection=desc`,
  `${BASE_URL}/search/?q=&sortColumn=referencedate&sortDirection=desc&startrow=25`,
]

interface ParsedJob {
  externalId: string
  urlPath: string
  title: string
  location: string
  dateStr: string
}

export async function fetchNorfolkSouthernJobs(): Promise<RawJobData[]> {
  const allJobs: RawJobData[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < PAGES.length; i++) {
    const url = PAGES[i]

    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    try {
      console.log(`[norfolk-southern] Fetching page ${i + 1}/${PAGES.length}`)

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      })

      if (!res.ok) {
        console.error(`[norfolk-southern] Page ${i + 1} failed: HTTP ${res.status}`)
        continue
      }

      const html = await res.text()
      const parsed = parseJobTiles(html)

      console.log(`[norfolk-southern] Page ${i + 1}: found ${parsed.length} jobs`)

      for (const job of parsed) {
        if (seenIds.has(job.externalId)) continue
        seenIds.add(job.externalId)

        const { city, state } = parseLocation(job.location)
        const postedAt = parseDate(job.dateStr)

        allJobs.push({
          externalId: job.externalId,
          title: job.title,
          company: 'Norfolk Southern',
          city,
          state,
          country: 'US',
          workMode: /\bremote\b/i.test(job.title) ? 'REMOTE' : 'ONSITE',
          jobType: /\bintern/i.test(job.title) ? 'INTERNSHIP' : 'FULL_TIME',
          description: `${job.title} position at Norfolk Southern. Location: ${job.location || 'Various locations'}.`,
          applyUrl: `${BASE_URL}${job.urlPath}`,
          postedAt: postedAt ?? new Date(),
        })
      }
    } catch (err) {
      console.error(`[norfolk-southern] Page ${i + 1} error:`, err)
    }
  }

  console.log(`[norfolk-southern] Done. Total unique jobs: ${allJobs.length}`)
  return allJobs
}

/**
 * Parses NS job tiles. Structure:
 * <li class="job-tile job-id-{ID}" data-url="{URL}">
 *   <a class="jobTitle-link" href="{URL}">Title</a>
 *   <div id="job-{ID}-desktop-section-location-value">City, ST, US, ZIP</div>
 *   <div id="job-{ID}-desktop-section-date-value">Feb 20, 2026</div>
 * </li>
 */
function parseJobTiles(html: string): ParsedJob[] {
  const jobs: ParsedJob[] = []

  // Match each job tile <li>
  const tilePattern = /<li\s+class="job-tile\s+job-id-(\d+)[^"]*"\s+data-url="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g
  let tileMatch: RegExpExecArray | null

  while ((tileMatch = tilePattern.exec(html)) !== null) {
    const externalId = tileMatch[1]
    const urlPath = tileMatch[2]
    const tileHtml = tileMatch[3]

    // Title from <a class="jobTitle-link"
    const titleMatch = /<a\s+class="jobTitle-link[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/a>/.exec(tileHtml)
    const title = titleMatch ? stripTags(titleMatch[1]).trim() : ''

    // Location from desktop-section-location-value div
    const locationMatch = /desktop-section-location-value[^>]*>([\s\S]*?)<\/div>/.exec(tileHtml)
    const location = locationMatch ? stripTags(locationMatch[1]).replace(/\s+/g, ' ').trim() : ''

    // Date from desktop-section-date-value div
    const dateMatch = /desktop-section-date-value[^>]*>([\s\S]*?)<\/div>/.exec(tileHtml)
    const dateStr = dateMatch ? stripTags(dateMatch[1]).trim() : ''

    if (!title || !externalId) continue

    jobs.push({ externalId, urlPath, title, location, dateStr })
  }

  return jobs
}

function parseLocation(location: string): { city?: string; state?: string } {
  if (!location) return {}
  // Format: "Meridian, MS, US, 39301" or "Atlanta, GA 30308"
  const match = /^(.+?),\s*([A-Z]{2})\b/.exec(location.trim())
  if (!match) return {}
  return { city: match[1].trim(), state: match[2] }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
}
