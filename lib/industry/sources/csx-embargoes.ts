import type { RawAdvisory } from '../types'
import type { AdvisoryType } from '@prisma/client'
import { stripHtml, hashString } from './utils'

// CSX Active Embargoes - updated URL
const CSX_EMBARGO_URL = 'https://www.csx.com/index.cfm/customers/news/embargoes/'
// CSX Service Bulletins as alternative/complement
const CSX_BULLETINS_URL = 'https://www.csx.com/index.cfm/customers/news/service-bulletins1/'

export async function fetchCSXEmbargoes(): Promise<RawAdvisory[]> {
  console.log('CSX: fetching embargoes and service advisories...')

  const advisories: RawAdvisory[] = []

  // Try embargoes page
  const embargoResults = await fetchPage(CSX_EMBARGO_URL, 'EMBARGO')
  advisories.push(...embargoResults)

  // Try service bulletins page
  const bulletinResults = await fetchPage(CSX_BULLETINS_URL, 'SERVICE_ALERT')
  advisories.push(...bulletinResults)

  console.log(`CSX: returning ${advisories.length} advisory(ies)`)
  return advisories
}

async function fetchPage(url: string, defaultType: AdvisoryType): Promise<RawAdvisory[]> {
  const advisories: RawAdvisory[] = []

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    if (!res.ok) {
      console.error(`CSX: ${url} returned status ${res.status}`)
      return []
    }

    const html = await res.text()
    if (html.length > 500_000) {
      console.warn('CSX: HTML response too large, skipping parse')
      return []
    }

    const entries = parseCSXPage(html)
    console.log(`CSX: found ${entries.length} entries from ${url}`)

    for (const entry of entries) {
      advisories.push({
        externalId: `csx-${hashString(entry.title + (entry.date || ''))}`,
        railroad: 'CSX',
        advisoryType: classifyType(entry.title, defaultType),
        title: entry.title,
        description: entry.description || entry.title,
        affectedArea: entry.area,
        issuedAt: entry.date ? new Date(entry.date) : new Date(),
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined,
      })
    }
  } catch (err) {
    console.error(`CSX: fetch error for ${url}:`, err)
  }

  return advisories
}

interface ParsedEntry {
  title: string
  description?: string
  date?: string
  area?: string
  expiresAt?: string
}

function parseCSXPage(html: string): ParsedEntry[] {
  const entries: ParsedEntry[] = []
  const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\w+ \d{1,2},? \d{4})/

  // Pattern 1: Table rows (embargo page format)
  const rowPattern = /<tr[^>]*>(.*?)<\/tr>/gi
  let match

  while ((match = rowPattern.exec(html)) !== null) {
    const cells = match[1].match(/<td[^>]*>(.*?)<\/td>/gi)
    if (!cells || cells.length < 2) continue

    const title = stripHtml(cells[0]).trim()
    if (!title || title.length < 3 || /embargo\s+number|header/i.test(title)) continue

    const dateText = cells.length > 1 ? stripHtml(cells[1]).trim() : undefined
    const dateMatch = dateText?.match(datePattern)
    const areaText = cells.length > 2 ? stripHtml(cells[2]).trim() : undefined
    const descText = cells.length > 3 ? stripHtml(cells[3]).trim() : undefined
    const expiresText = cells.length > 4 ? stripHtml(cells[4]).trim() : undefined
    const expiresMatch = expiresText?.match(datePattern)

    entries.push({
      title,
      description: descText || undefined,
      date: dateMatch ? dateMatch[1] : undefined,
      area: areaText || undefined,
      expiresAt: expiresMatch ? expiresMatch[1] : undefined,
    })
  }

  // Pattern 2: Article links (service bulletin format)
  if (entries.length === 0) {
    const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi
    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1]
      const title = stripHtml(match[2]).trim()

      // Only match CSX news/advisory links
      if (!title || title.length < 10) continue
      if (!href.includes('customers/news') && !href.includes('embargo') && !href.includes('service-bulletin')) continue

      const dateMatch = title.match(datePattern)

      entries.push({
        title: title.slice(0, 300),
        date: dateMatch ? dateMatch[1] : undefined,
      })
    }
  }

  // Pattern 3: List items
  if (entries.length === 0) {
    const listPattern = /<li[^>]*>(.*?)<\/li>/gi
    while ((match = listPattern.exec(html)) !== null) {
      const text = stripHtml(match[1]).trim()
      if (!text || text.length < 15) continue

      // Skip navigation items
      if (/^(home|about|contact|login|sign)/i.test(text)) continue

      const dateMatch = text.match(datePattern)

      entries.push({
        title: text.slice(0, 300),
        date: dateMatch ? dateMatch[1] : undefined,
      })
    }
  }

  return entries
}

function classifyType(title: string, fallback: AdvisoryType): AdvisoryType {
  const lower = title.toLowerCase()
  if (lower.includes('embargo')) return 'EMBARGO'
  if (lower.includes('weather') || lower.includes('storm') || lower.includes('flood') || lower.includes('hurricane')) return 'WEATHER_ADVISORY'
  if (lower.includes('maintenance') || lower.includes('track') || lower.includes('outage')) return 'MAINTENANCE_NOTICE'
  return fallback
}
