import industryData from '@/public/industry.json'
import type { RailServiceMetric, FuelSurcharge, RegulatoryUpdate, ServiceAdvisory, MetricWithTrend, IndustryStats } from './types'

const metrics = industryData.metrics as RailServiceMetric[]
const fuelSurcharges = industryData.fuelSurcharges as FuelSurcharge[]
const advisories = ((industryData as Record<string, unknown>).advisories || []) as ServiceAdvisory[]
const regulatory = industryData.regulatory as RegulatoryUpdate[]

export const ITEMS_PER_PAGE = 20

// ── Rail Service Metrics ──────────────────────────────

export async function getLatestMetrics(): Promise<MetricWithTrend[]> {
  if (metrics.length === 0) return []

  // Find latest report week per metric type (datasets report on slightly different days)
  const latestWeekByType = new Map<string, string>()
  for (const m of metrics) {
    const prev = latestWeekByType.get(m.metricType)
    if (!prev || m.reportWeek > prev) latestWeekByType.set(m.metricType, m.reportWeek)
  }

  // Get current metrics: latest week for each type
  const current = metrics
    .filter(m => m.reportWeek === latestWeekByType.get(m.metricType))
    .sort((a, b) => a.railroad.localeCompare(b.railroad) || a.metricType.localeCompare(b.metricType))

  // Build previous-week map for trend calculation
  const prevMap = new Map<string, number>()
  for (const [type, latestWeek] of latestWeekByType) {
    const typeMetrics = metrics.filter(m => m.metricType === type && m.reportWeek < latestWeek)
    const prevWeeks = [...new Set(typeMetrics.map(m => m.reportWeek))].sort().reverse()
    if (prevWeeks.length > 0) {
      for (const m of typeMetrics.filter(m => m.reportWeek === prevWeeks[0])) {
        prevMap.set(`${m.railroad}-${m.metricType}-${m.commodity || ''}`, m.value)
      }
    }
  }

  return current.map(m => {
    const key = `${m.railroad}-${m.metricType}-${m.commodity || ''}`
    const previousValue = prevMap.get(key)
    const changePercent =
      previousValue != null && previousValue !== 0
        ? ((m.value - previousValue) / previousValue) * 100
        : undefined
    return { ...m, previousValue, changePercent }
  })
}

export async function getMetricsByRailroad(railroad: string): Promise<MetricWithTrend[]> {
  return metrics
    .filter(m => m.railroad === railroad)
    .sort((a, b) => b.reportWeek.localeCompare(a.reportWeek) || a.metricType.localeCompare(b.metricType))
    .slice(0, 50)
    .map(m => ({ ...m }))
}

export async function getMetricHistory(
  railroad: string,
  metricType: string,
  weeks: number = 12
): Promise<{ reportWeek: string; value: number }[]> {
  return metrics
    .filter(m => m.railroad === railroad && m.metricType === metricType && (!m.commodity || m.commodity === ''))
    .sort((a, b) => b.reportWeek.localeCompare(a.reportWeek))
    .slice(0, weeks)
    .map(m => ({ reportWeek: m.reportWeek, value: m.value }))
    .reverse()
}

// ── Fuel Surcharges ──────────────────────────────────

export async function getLatestFuelSurcharges(): Promise<FuelSurcharge[]> {
  // Already deduplicated in the scraper output
  return [...fuelSurcharges].sort((a, b) => a.railroad.localeCompare(b.railroad))
}

export async function getFuelSurchargeHistory(railroad: string, weeks: number = 12): Promise<FuelSurcharge[]> {
  return fuelSurcharges
    .filter(s => s.railroad === railroad)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))
    .slice(0, weeks)
}

// ── Service Advisories ────────────────────────────────

export async function getActiveAdvisories(filters?: {
  railroad?: string
  advisoryType?: string
  page?: number
}): Promise<{ advisories: ServiceAdvisory[]; total: number }> {
  let filtered = advisories.filter(a => a.isActive)

  if (filters?.railroad) {
    filtered = filtered.filter(a => a.railroad === filters.railroad)
  }
  if (filters?.advisoryType) {
    filtered = filtered.filter(a => a.advisoryType === filters.advisoryType)
  }

  filtered.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  const page = Math.max(1, filters?.page || 1)
  const skip = (page - 1) * ITEMS_PER_PAGE
  const paged = filtered.slice(skip, skip + ITEMS_PER_PAGE)

  return { advisories: paged, total: filtered.length }
}

export async function getAdvisoryBySlug(slug: string): Promise<ServiceAdvisory | null> {
  return advisories.find(a => a.slug === slug) || null
}

// ── Regulatory Updates ────────────────────────────────

export async function getRegulatoryUpdates(filters?: {
  agency?: string
  page?: number
}) {
  let filtered = [...regulatory]
  if (filters?.agency) {
    filtered = filtered.filter(u => u.agency === filters.agency)
  }
  filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const page = Math.max(1, filters?.page || 1)
  const skip = (page - 1) * ITEMS_PER_PAGE
  const paged = filtered.slice(skip, skip + ITEMS_PER_PAGE)

  return { updates: paged, total: filtered.length }
}

export async function getRegulatoryBySlug(slug: string) {
  return regulatory.find(u => u.slug === slug) || null
}

// ── Dashboard Stats ──────────────────────────────────

export async function getIndustryStats(): Promise<IndustryStats> {
  const active = advisories.filter(a => a.isActive)
  return {
    totalMetrics: metrics.length,
    totalAdvisories: active.length,
    activeEmbargoes: active.filter(a => a.advisoryType === 'EMBARGO').length,
    lastUpdated: industryData.scrapedAt ? new Date(industryData.scrapedAt) : null,
  }
}
