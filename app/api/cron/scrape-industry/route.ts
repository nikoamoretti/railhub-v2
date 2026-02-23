import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchUSDAMetrics } from '@/lib/industry/sources/usda-metrics'
import { fetchAllFuelSurcharges } from '@/lib/industry/sources/ns-fuel-surcharge'
import { fetchBNSFAdvisories } from '@/lib/industry/sources/bnsf-advisories'
import { fetchCSXEmbargoes } from '@/lib/industry/sources/csx-embargoes'
import { generateAdvisorySlug } from '@/lib/industry/slug'
import { expireOldAdvisories } from '@/lib/industry/cleanup'
import type { RawMetricData, RawFuelSurcharge, RawAdvisory, FetchResult } from '@/lib/industry/types'
import type { DataFeedType } from '@prisma/client'

export const maxDuration = 60

interface SourceConfig {
  name: string
  type: DataFeedType
  baseUrl: string
  fetcher: () => Promise<FetchResult>
}

const SOURCES: SourceConfig[] = [
  {
    name: 'USDA Rail Metrics',
    type: 'API',
    baseUrl: 'https://agtransport.usda.gov',
    fetcher: async () => ({ type: 'metrics', items: await fetchUSDAMetrics() }),
  },
  {
    name: 'Fuel Surcharges (All Carriers)',
    type: 'API',
    baseUrl: 'https://www.eia.gov',
    fetcher: async () => ({ type: 'fuel_surcharges', items: await fetchAllFuelSurcharges() }),
  },
  {
    name: 'BNSF Customer Notifications',
    type: 'SCRAPER',
    baseUrl: 'https://www.bnsf.com',
    fetcher: async () => ({ type: 'advisories', items: await fetchBNSFAdvisories() }),
  },
  {
    name: 'CSX Embargoes',
    type: 'SCRAPER',
    baseUrl: 'https://www.csx.com',
    fetcher: async () => ({ type: 'advisories', items: await fetchCSXEmbargoes() }),
  },
]

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, { found: number; created: number; updated: number; failed: number }> = {}
  let totalExpired = 0

  try {
    for (const src of SOURCES) {
      if (Date.now() - startTime > 45_000) {
        console.log('Timeout approaching, skipping remaining sources')
        break
      }

      const sourceResult = { found: 0, created: 0, updated: 0, failed: 0 }
      results[src.name] = sourceResult

      const feedSource = await prisma.dataFeedSource.upsert({
        where: { name: src.name },
        update: {},
        create: { name: src.name, type: src.type, baseUrl: src.baseUrl },
      })

      const feedLog = await prisma.dataFeedLog.create({
        data: {
          feedSourceId: feedSource.id,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      try {
        const result = await src.fetcher()
        sourceResult.found = result.items.length

        if (result.items.length > 0) {
          switch (result.type) {
            case 'metrics':
              await processMetrics(result.items as RawMetricData[], sourceResult, startTime)
              break
            case 'fuel_surcharges':
              await processFuelSurcharges(result.items as RawFuelSurcharge[], sourceResult, startTime)
              break
            case 'advisories':
              await processAdvisories(result.items as RawAdvisory[], sourceResult, startTime)
              break
          }
        }

        await prisma.dataFeedSource.update({
          where: { id: feedSource.id },
          data: { lastFetchAt: new Date(), totalRecords: sourceResult.created + sourceResult.updated },
        })

        await prisma.dataFeedLog.update({
          where: { id: feedLog.id },
          data: {
            status: 'COMPLETED',
            recordsFound: sourceResult.found,
            recordsCreated: sourceResult.created,
            recordsUpdated: sourceResult.updated,
            recordsFailed: sourceResult.failed,
            completedAt: new Date(),
          },
        })
      } catch (err) {
        await prisma.dataFeedLog.update({
          where: { id: feedLog.id },
          data: {
            status: 'FAILED',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
            completedAt: new Date(),
          },
        })
        console.error(`Source ${src.name} failed:`, err)
      }
    }

    totalExpired = await expireOldAdvisories()

    return NextResponse.json({
      success: true,
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      sources: results,
      totalExpired,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Scrape failed', message: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}

async function processMetrics(
  items: RawMetricData[],
  result: { created: number; updated: number; failed: number },
  startTime: number
) {
  for (const item of items) {
    if (Date.now() - startTime > 55_000) break
    try {
      await prisma.railServiceMetric.upsert({
        where: {
          railroad_metricType_reportWeek_commodity: {
            railroad: item.railroad,
            metricType: item.metricType,
            reportWeek: item.reportWeek,
            commodity: item.commodity || '',
          },
        },
        update: { value: item.value, unit: item.unit },
        create: {
          railroad: item.railroad,
          metricType: item.metricType,
          value: item.value,
          unit: item.unit,
          reportWeek: item.reportWeek,
          commodity: item.commodity || '',
        },
      })
      result.created++
    } catch (err) {
      result.failed++
      console.error('Failed to upsert metric:', err)
    }
  }
}

async function processFuelSurcharges(
  items: RawFuelSurcharge[],
  result: { created: number; updated: number; failed: number },
  startTime: number
) {
  for (const item of items) {
    if (Date.now() - startTime > 55_000) break
    try {
      await prisma.fuelSurcharge.upsert({
        where: {
          railroad_effectiveDate_trafficType: {
            railroad: item.railroad,
            effectiveDate: item.effectiveDate,
            trafficType: item.trafficType || '',
          },
        },
        update: { surchargeRate: item.surchargeRate, fuelPrice: item.fuelPrice },
        create: {
          railroad: item.railroad,
          effectiveDate: item.effectiveDate,
          fuelPrice: item.fuelPrice,
          surchargeRate: item.surchargeRate,
          trafficType: item.trafficType || '',
        },
      })
      result.created++
    } catch (err) {
      result.failed++
      console.error('Failed to upsert fuel surcharge:', err)
    }
  }
}

async function processAdvisories(
  items: RawAdvisory[],
  result: { created: number; updated: number; failed: number },
  startTime: number
) {
  // Pre-fetch existing advisories to avoid N+1
  const existingMap = new Map(
    (await prisma.serviceAdvisory.findMany({
      where: {
        externalId: { in: items.map((i) => i.externalId) },
        railroad: { in: [...new Set(items.map((i) => i.railroad))] },
      },
      select: { id: true, externalId: true, railroad: true },
    })).map((r) => [`${r.externalId}-${r.railroad}`, r.id])
  )

  for (const item of items) {
    if (Date.now() - startTime > 55_000) break
    try {
      const existingId = existingMap.get(`${item.externalId}-${item.railroad}`)

      if (existingId) {
        await prisma.serviceAdvisory.update({
          where: { id: existingId },
          data: {
            title: item.title,
            description: item.description,
            affectedArea: item.affectedArea,
            expiresAt: item.expiresAt,
            isActive: true,
          },
        })
        result.updated++
      } else {
        const slug = generateAdvisorySlug(item.title, item.railroad)
        await prisma.serviceAdvisory.create({
          data: {
            externalId: item.externalId,
            slug,
            railroad: item.railroad,
            advisoryType: item.advisoryType,
            title: item.title,
            description: item.description,
            affectedArea: item.affectedArea,
            issuedAt: item.issuedAt,
            expiresAt: item.expiresAt,
          },
        })
        result.created++
      }
    } catch (err) {
      result.failed++
      console.error('Failed to upsert advisory:', err)
    }
  }
}
