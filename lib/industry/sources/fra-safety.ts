import type { RawRegulatoryUpdate } from '../types'
import { stripHtml, hashString } from './utils'

// FRA Safety Data — Railroad accident/incident reports
// https://railroads.dot.gov/safety-data
// Also covers STB data releases and FRA safety alerts

const FRA_SAFETY_URL = 'https://railroads.dot.gov/safety-data'
const STB_DECISIONS_URL = 'https://www.stb.gov/news-communications/latest-news/'

export async function fetchFRASafetyData(): Promise<RawRegulatoryUpdate[]> {
  console.log('FRA: fetching safety/regulatory data...')

  const updates: RawRegulatoryUpdate[] = []

  // Fetch FRA safety page
  try {
    const fraUpdates = await fetchFRAPage()
    updates.push(...fraUpdates)
  } catch (err) {
    console.error('FRA: safety page error:', err)
  }

  // Fetch STB news
  try {
    const stbUpdates = await fetchSTBPage()
    updates.push(...stbUpdates)
  } catch (err) {
    console.error('STB: news page error:', err)
  }

  console.log(`FRA/STB: returning ${updates.length} update(s)`)
  return updates
}

async function fetchFRAPage(): Promise<RawRegulatoryUpdate[]> {
  const res = await fetch(FRA_SAFETY_URL, {
    headers: {
      'User-Agent': 'Railhub/1.0 (Industry Data Aggregator)',
      'Accept': 'text/html',
    },
  })

  if (!res.ok) {
    console.error(`FRA: request failed with status ${res.status}`)
    return []
  }

  const html = await res.text()
  return parseFRAPage(html)
}

async function fetchSTBPage(): Promise<RawRegulatoryUpdate[]> {
  const res = await fetch(STB_DECISIONS_URL, {
    headers: {
      'User-Agent': 'Railhub/1.0 (Industry Data Aggregator)',
      'Accept': 'text/html',
    },
  })

  if (!res.ok) {
    console.error(`STB: request failed with status ${res.status}`)
    return []
  }

  const html = await res.text()
  return parseSTBPage(html)
}

function parseFRAPage(html: string): RawRegulatoryUpdate[] {
  const updates: RawRegulatoryUpdate[] = []
  const datePattern = /(\w+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/

  // Look for content items — FRA uses various Drupal patterns
  const articlePattern = /<article[^>]*>(.*?)<\/article>/gi
  let match

  while ((match = articlePattern.exec(html)) !== null) {
    const content = match[1]
    const titleMatch = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/i)
    if (!titleMatch) continue

    const title = stripHtml(titleMatch[1]).trim()
    if (!title || title.length < 5) continue

    const dateMatch = content.match(datePattern)
    const linkMatch = content.match(/href="([^"]*)"/)
    const descMatch = content.match(/<p[^>]*>(.*?)<\/p>/i)

    updates.push({
      externalId: `fra-${hashString(title)}`,
      agency: 'FRA',
      updateType: classifyFRAType(title),
      title,
      summary: descMatch ? stripHtml(descMatch[1]).trim().slice(0, 500) : title,
      documentUrl: linkMatch ? resolveUrl(FRA_SAFETY_URL, linkMatch[1]) || undefined : undefined,
      publishedAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
    })
  }

  // Fallback: list items with links
  if (updates.length === 0) {
    const listPattern = /<li[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>(.*?)<\/li>/gi
    while ((match = listPattern.exec(html)) !== null) {
      const title = stripHtml(match[2]).trim()
      if (!title || title.length < 5) continue

      const rest = stripHtml(match[3])
      const dateMatch = rest.match(datePattern)

      updates.push({
        externalId: `fra-${hashString(title)}`,
        agency: 'FRA',
        updateType: classifyFRAType(title),
        title,
        summary: title,
        documentUrl: resolveUrl(FRA_SAFETY_URL, match[1]) || undefined,
        publishedAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
      })
    }
  }

  return updates
}

function parseSTBPage(html: string): RawRegulatoryUpdate[] {
  const updates: RawRegulatoryUpdate[] = []
  const datePattern = /(\w+ \d{1,2},? \d{4})/

  // STB news uses WordPress-style article lists
  const entryPattern = /<article[^>]*>(.*?)<\/article>/gi
  let match

  while ((match = entryPattern.exec(html)) !== null) {
    const content = match[1]
    const titleMatch = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/i)
    if (!titleMatch) continue

    const title = stripHtml(titleMatch[1]).trim()
    if (!title || title.length < 5) continue

    const dateMatch = content.match(datePattern)
    const linkMatch = content.match(/href="([^"]*)"/)
    const descMatch = content.match(/<p[^>]*>(.*?)<\/p>/i)
    const docketMatch = title.match(/(?:Docket|Ex Parte)\s*(?:No\.\s*)?([A-Z0-9-]+)/i)

    updates.push({
      externalId: `stb-${hashString(title)}`,
      agency: 'STB',
      updateType: classifySTBType(title),
      title,
      summary: descMatch ? stripHtml(descMatch[1]).trim().slice(0, 500) : title,
      documentUrl: linkMatch ? resolveUrl(STB_DECISIONS_URL, linkMatch[1]) || undefined : undefined,
      docketNumber: docketMatch ? docketMatch[1] : undefined,
      publishedAt: dateMatch ? new Date(dateMatch[1]) : new Date(),
    })
  }

  return updates
}

function classifyFRAType(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('safety alert') || lower.includes('safety advisory')) return 'Safety Alert'
  if (lower.includes('notice') || lower.includes('nprm')) return 'Notice'
  if (lower.includes('data') || lower.includes('report') || lower.includes('statistic')) return 'Data Release'
  if (lower.includes('rule') || lower.includes('regulation') || lower.includes('compliance')) return 'Ruling'
  return 'Notice'
}

function classifySTBType(title: string): string {
  const lower = title.toLowerCase()
  if (lower.includes('decision') || lower.includes('ruling')) return 'Ruling'
  if (lower.includes('notice') || lower.includes('hearing')) return 'Notice'
  if (lower.includes('data') || lower.includes('report') || lower.includes('waybill')) return 'Data Release'
  return 'Notice'
}

function resolveUrl(base: string, path: string): string {
  try {
    const url = new URL(path, base)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.href
  } catch {
    return ''
  }
}

