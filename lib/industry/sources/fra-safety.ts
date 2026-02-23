import type { RawRegulatoryUpdate } from '../types'
import { stripHtml, hashString } from './utils'

// FRA Railroad Safety Data — Socrata JSON API (Form 54 accident/incident reports)
// https://data.transportation.gov/Railroads/Rail-Equipment-Accident-Incident-Data-Form-54-/85tf-25kj
const FRA_ACCIDENT_API = 'https://data.transportation.gov/resource/85tf-25kj.json'

// STB Latest News — HTML scrape (no API available)
const STB_DECISIONS_URL = 'https://www.stb.gov/news-communications/latest-news/'

export async function fetchFRASafetyData(): Promise<RawRegulatoryUpdate[]> {
  console.log('FRA/STB: fetching safety/regulatory data...')

  const updates: RawRegulatoryUpdate[] = []

  // Fetch FRA accident data from Socrata API
  try {
    const fraUpdates = await fetchFRAAccidentData()
    updates.push(...fraUpdates)
  } catch (err) {
    console.error('FRA: API error:', err)
  }

  // Fetch STB news (still HTML — no API)
  try {
    const stbUpdates = await fetchSTBPage()
    updates.push(...stbUpdates)
  } catch (err) {
    console.error('STB: news page error:', err)
  }

  console.log(`FRA/STB: returning ${updates.length} update(s)`)
  return updates
}

interface FRAAccidentRow {
  // Socrata field names (lowercase)
  railroad_name?: string
  railroad_code?: string
  date?: string
  time?: string
  type?: string
  state_name?: string
  county_name?: string
  city_name?: string
  station_name?: string
  total_killed?: string
  total_injured?: string
  total_damage?: string
  narrative?: string
  narrative1?: string
  incident_number?: string
  report_number?: string
  [key: string]: string | undefined
}

async function fetchFRAAccidentData(): Promise<RawRegulatoryUpdate[]> {
  // Fetch latest 50 accident reports ordered by date descending
  const url = `${FRA_ACCIDENT_API}?$limit=50&$order=date DESC&$where=date>'2024-01-01'`

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) {
    console.error(`FRA API: status ${res.status}`)
    return []
  }

  const rows = (await res.json()) as FRAAccidentRow[]
  console.log(`FRA API: received ${rows.length} accident report(s)`)

  const updates: RawRegulatoryUpdate[] = []

  for (const row of rows) {
    const railroad = row.railroad_name || row.railroad_code || 'Unknown'
    const date = row.date ? new Date(row.date) : null
    if (!date || isNaN(date.getTime())) continue

    const type = row.type || 'Incident'
    const state = row.state_name || ''
    const city = row.city_name || row.station_name || ''
    const location = [city, state].filter(Boolean).join(', ')

    const killed = parseInt(row.total_killed || '0', 10) || 0
    const injured = parseInt(row.total_injured || '0', 10) || 0
    const damage = row.total_damage ? `$${Number(row.total_damage).toLocaleString()}` : undefined

    const id = row.incident_number || row.report_number || hashString(`${railroad}-${date.toISOString()}-${type}`)
    const title = `${type} — ${railroad}${location ? ` (${location})` : ''}`

    const summaryParts: string[] = []
    summaryParts.push(`${type} involving ${railroad}`)
    if (location) summaryParts.push(`near ${location}`)
    summaryParts.push(`on ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
    if (killed > 0) summaryParts.push(`${killed} fatalities`)
    if (injured > 0) summaryParts.push(`${injured} injuries`)
    if (damage) summaryParts.push(`estimated damage: ${damage}`)

    const narrative = row.narrative || row.narrative1 || ''

    updates.push({
      externalId: `fra-${id}`,
      agency: 'FRA',
      updateType: classifyFRAType(type, killed, injured),
      title: title.slice(0, 300),
      summary: summaryParts.join('. ').slice(0, 500),
      content: narrative ? narrative.slice(0, 2000) : undefined,
      publishedAt: date,
    })
  }

  return updates
}

async function fetchSTBPage(): Promise<RawRegulatoryUpdate[]> {
  const res = await fetch(STB_DECISIONS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

function parseSTBPage(html: string): RawRegulatoryUpdate[] {
  const updates: RawRegulatoryUpdate[] = []
  const datePattern = /(\w+ \d{1,2},? \d{4})/

  // STB news uses article/entry patterns
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

function classifyFRAType(incidentType: string, killed: number, injured: number): string {
  if (killed > 0) return 'Safety Alert'
  const lower = incidentType.toLowerCase()
  if (lower.includes('derail')) return 'Safety Alert'
  if (lower.includes('collision') || lower.includes('crash')) return 'Safety Alert'
  if (lower.includes('hazmat') || lower.includes('release')) return 'Safety Alert'
  if (injured > 0) return 'Safety Alert'
  return 'Data Release'
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
