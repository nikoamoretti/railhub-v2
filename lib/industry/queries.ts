import { prisma } from '@/lib/db'
import type { Prisma, MetricType, AdvisoryType, RegulatoryAgency } from '@prisma/client'
import type { IndustryStats, MetricWithTrend } from './types'

export const ITEMS_PER_PAGE = 20

// ── Rail Service Metrics ──────────────────────────────

export async function getLatestMetrics(): Promise<MetricWithTrend[]> {
  try {
    // Get the latest report week
    const latest = await prisma.railServiceMetric.findFirst({
      orderBy: { reportWeek: 'desc' },
      select: { reportWeek: true },
    })
    if (!latest) return []

    // Get previous week for trend
    const previousWeek = new Date(latest.reportWeek)
    previousWeek.setDate(previousWeek.getDate() - 7)

    const [current, previous] = await Promise.all([
      prisma.railServiceMetric.findMany({
        where: { reportWeek: latest.reportWeek },
        orderBy: [{ railroad: 'asc' }, { metricType: 'asc' }],
      }),
      prisma.railServiceMetric.findMany({
        where: { reportWeek: previousWeek },
      }),
    ])

    const prevMap = new Map(
      previous.map((m) => [`${m.railroad}-${m.metricType}-${m.commodity || ''}`, m.value])
    )

    return current.map((m) => {
      const key = `${m.railroad}-${m.metricType}-${m.commodity || ''}`
      const previousValue = prevMap.get(key)
      const changePercent =
        previousValue != null && previousValue !== 0
          ? ((m.value - previousValue) / previousValue) * 100
          : undefined

      return { ...m, previousValue, changePercent }
    })
  } catch (err) {
    console.error('getLatestMetrics error:', err)
    return []
  }
}

export async function getMetricsByRailroad(railroad: string): Promise<MetricWithTrend[]> {
  try {
    const metrics = await prisma.railServiceMetric.findMany({
      where: { railroad },
      orderBy: [{ reportWeek: 'desc' }, { metricType: 'asc' }],
      take: 50,
    })
    return metrics.map((m) => ({ ...m }))
  } catch (err) {
    console.error('getMetricsByRailroad error:', err)
    return []
  }
}

export async function getMetricHistory(
  railroad: string,
  metricType: MetricType,
  weeks: number = 12
): Promise<{ reportWeek: Date; value: number }[]> {
  try {
    const metrics = await prisma.railServiceMetric.findMany({
      where: { railroad, metricType, commodity: '' },
      orderBy: { reportWeek: 'desc' },
      take: weeks,
      select: { reportWeek: true, value: true },
    })
    return metrics.reverse()
  } catch (err) {
    console.error('getMetricHistory error:', err)
    return []
  }
}

// ── Fuel Surcharges ──────────────────────────────────

export async function getLatestFuelSurcharges() {
  try {
    // Get the most recent surcharges (last 30 days)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)

    const surcharges = await prisma.fuelSurcharge.findMany({
      where: { effectiveDate: { gte: cutoff } },
      orderBy: [{ railroad: 'asc' }, { effectiveDate: 'desc' }],
    })

    // Deduplicate: keep latest per railroad+trafficType
    const seen = new Set<string>()
    const latest = surcharges.filter((s) => {
      const key = `${s.railroad}-${s.trafficType}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return latest
  } catch (err) {
    console.error('getLatestFuelSurcharges error:', err)
    return []
  }
}

export async function getFuelSurchargeHistory(railroad: string, weeks: number = 12) {
  try {
    return await prisma.fuelSurcharge.findMany({
      where: { railroad },
      orderBy: { effectiveDate: 'desc' },
      take: weeks,
    })
  } catch (err) {
    console.error('getFuelSurchargeHistory error:', err)
    return []
  }
}

// ── Service Advisories ────────────────────────────────

export async function getActiveAdvisories(filters?: {
  railroad?: string
  advisoryType?: AdvisoryType
  page?: number
}) {
  try {
    const where: Prisma.ServiceAdvisoryWhereInput = { isActive: true }
    if (filters?.railroad) where.railroad = filters.railroad
    if (filters?.advisoryType) where.advisoryType = filters.advisoryType

    const page = Math.max(1, filters?.page || 1)
    const skip = (page - 1) * ITEMS_PER_PAGE

    const [advisories, total] = await Promise.all([
      prisma.serviceAdvisory.findMany({
        where,
        orderBy: { issuedAt: 'desc' },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.serviceAdvisory.count({ where }),
    ])

    return { advisories, total }
  } catch (err) {
    console.error('getActiveAdvisories error:', err)
    return { advisories: [], total: 0 }
  }
}

export async function getAdvisoryBySlug(slug: string) {
  try {
    return await prisma.serviceAdvisory.findUnique({ where: { slug } })
  } catch (err) {
    console.error('getAdvisoryBySlug error:', err)
    return null
  }
}

// ── Regulatory Updates ────────────────────────────────

export async function getRegulatoryUpdates(filters?: {
  agency?: RegulatoryAgency
  page?: number
}) {
  try {
    const where: Prisma.RegulatoryUpdateWhereInput = {}
    if (filters?.agency) where.agency = filters.agency

    const page = Math.max(1, filters?.page || 1)
    const skip = (page - 1) * ITEMS_PER_PAGE

    const [updates, total] = await Promise.all([
      prisma.regulatoryUpdate.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.regulatoryUpdate.count({ where }),
    ])

    return { updates, total }
  } catch (err) {
    console.error('getRegulatoryUpdates error:', err)
    return { updates: [], total: 0 }
  }
}

export async function getRegulatoryBySlug(slug: string) {
  try {
    return await prisma.regulatoryUpdate.findUnique({ where: { slug } })
  } catch (err) {
    console.error('getRegulatoryBySlug error:', err)
    return null
  }
}

// ── Dashboard Stats ──────────────────────────────────

export async function getIndustryStats(): Promise<IndustryStats> {
  try {
    const [totalMetrics, totalAdvisories, activeEmbargoes, lastFeed] = await Promise.all([
      prisma.railServiceMetric.count(),
      prisma.serviceAdvisory.count({ where: { isActive: true } }),
      prisma.serviceAdvisory.count({ where: { isActive: true, advisoryType: 'EMBARGO' } }),
      prisma.dataFeedSource.findFirst({
        orderBy: { lastFetchAt: 'desc' },
        select: { lastFetchAt: true },
      }),
    ])

    return {
      totalMetrics,
      totalAdvisories,
      activeEmbargoes,
      lastUpdated: lastFeed?.lastFetchAt || null,
    }
  } catch (err) {
    console.error('getIndustryStats error:', err)
    return { totalMetrics: 0, totalAdvisories: 0, activeEmbargoes: 0, lastUpdated: null }
  }
}
