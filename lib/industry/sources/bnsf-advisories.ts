import type { RawAdvisory } from '../types'
import type { AdvisoryType } from '@prisma/client'
import { stripHtml, hashString } from './utils'

// BNSF Customer Notifications
const BNSF_URL = 'https://www.bnsf.com/news-media/customer-notifications.html'

export async function fetchBNSFAdvisories(): Promise<RawAdvisory[]> {
  console.log('BNSF: fetching customer notifications...')

  const advisories: RawAdvisory[] = []

  try {
    const res = await fetch(BNSF_URL, {
      headers: {
        'User-Agent': 'Railhub/1.0 (Industry Data Aggregator)',
        'Accept': 'text/html',
      },
    })

    if (!res.ok) {
      console.error(`BNSF: request failed with status ${res.status}`)
      return []
    }

    const html = await res.text()

    // BNSF notifications are typically in a list/table structure
    // Parse notification entries from HTML
    const entries = parseNotifications(html)
    console.log(`BNSF: found ${entries.length} notification(s)`)

    for (const entry of entries) {
      advisories.push({
        externalId: `bnsf-${hashString(entry.title + entry.date)}`,
        railroad: 'BNSF',
        advisoryType: classifyAdvisoryType(entry.title),
        title: entry.title,
        description: entry.description || entry.title,
        affectedArea: entry.area,
        issuedAt: entry.date ? new Date(entry.date) : new Date(),
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : undefined,
      })
    }
  } catch (err) {
    console.error('BNSF: fetch error:', err)
  }

  console.log(`BNSF: returning ${advisories.length} advisory(ies)`)
  return advisories
}

interface ParsedNotification {
  title: string
  description?: string
  date?: string
  area?: string
  expiresAt?: string
}

function parseNotifications(html: string): ParsedNotification[] {
  const notifications: ParsedNotification[] = []

  // Match common patterns in BNSF notification HTML
  // They use various structures — try multiple patterns

  // Pattern 1: <h3> or <h4> headers followed by content
  const headerPattern = /<h[34][^>]*>(.*?)<\/h[34]>/gi
  const datePattern = /(\w+ \d{1,2},? \d{4})/
  let match

  while ((match = headerPattern.exec(html)) !== null) {
    const title = stripHtml(match[1]).trim()
    if (!title || title.length < 5) continue

    // Look for date and description near the header
    const context = html.slice(match.index, match.index + 1000)
    const dateMatch = context.match(datePattern)
    const descriptionMatch = context.match(/<p[^>]*>(.*?)<\/p>/i)

    notifications.push({
      title,
      description: descriptionMatch ? stripHtml(descriptionMatch[1]).trim() : undefined,
      date: dateMatch ? dateMatch[1] : undefined,
      area: extractArea(title),
    })
  }

  // Pattern 2: List items with links
  if (notifications.length === 0) {
    const listPattern = /<li[^>]*>.*?<a[^>]*>(.*?)<\/a>.*?<\/li>/gi
    while ((match = listPattern.exec(html)) !== null) {
      const title = stripHtml(match[1]).trim()
      if (!title || title.length < 5) continue

      const context = match[0]
      const dateMatch = context.match(datePattern)

      notifications.push({
        title,
        date: dateMatch ? dateMatch[1] : undefined,
        area: extractArea(title),
      })
    }
  }

  return notifications
}

function classifyAdvisoryType(title: string): AdvisoryType {
  const lower = title.toLowerCase()
  if (lower.includes('embargo')) return 'EMBARGO'
  if (lower.includes('weather') || lower.includes('storm') || lower.includes('flood') || lower.includes('hurricane') || lower.includes('winter')) return 'WEATHER_ADVISORY'
  if (lower.includes('maintenance') || lower.includes('track work') || lower.includes('outage')) return 'MAINTENANCE_NOTICE'
  return 'SERVICE_ALERT'
}

function extractArea(title: string): string | undefined {
  // Look for state abbreviations or region names
  const stateMatch = title.match(/\b([A-Z]{2})\b/)
  if (stateMatch && isUSState(stateMatch[1])) return stateMatch[1]

  const regions = ['Midwest', 'Southwest', 'Southeast', 'Northeast', 'Northwest', 'Pacific', 'Gulf', 'Central']
  for (const region of regions) {
    if (title.includes(region)) return region
  }

  return undefined
}

function isUSState(code: string): boolean {
  const states = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'])
  return states.has(code)
}

