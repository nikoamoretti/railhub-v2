import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchFRASafetyData } from '@/lib/industry/sources/fra-safety'
import { generateRegulatorySlug } from '@/lib/industry/slug'
import type { RawRegulatoryUpdate } from '@/lib/industry/types'
import type { DataFeedType } from '@prisma/client'

export const maxDuration = 60

interface SourceConfig {
  name: string
  type: DataFeedType
  baseUrl: string
  fetcher: () => Promise<RawRegulatoryUpdate[]>
}

const SOURCES: SourceConfig[] = [
  {
    name: 'FRA Safety Data',
    type: 'API',
    baseUrl: 'https://data.transportation.gov',
    fetcher: fetchFRASafetyData,
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
        const items = await src.fetcher()
        sourceResult.found = items.length

        // Pre-fetch existing updates to avoid N+1
        const existingMap = new Map(
          (await prisma.regulatoryUpdate.findMany({
            where: {
              externalId: { in: items.map((i) => i.externalId) },
              agency: { in: [...new Set(items.map((i) => i.agency))] },
            },
            select: { id: true, externalId: true, agency: true },
          })).map((r) => [`${r.externalId}-${r.agency}`, r.id])
        )

        for (const item of items) {
          if (Date.now() - startTime > 55_000) break
          try {
            const existingId = existingMap.get(`${item.externalId}-${item.agency}`)

            if (existingId) {
              await prisma.regulatoryUpdate.update({
                where: { id: existingId },
                data: {
                  title: item.title,
                  summary: item.summary,
                  content: item.content,
                  documentUrl: item.documentUrl,
                },
              })
              sourceResult.updated++
            } else {
              const slug = generateRegulatorySlug(item.title, item.agency)
              await prisma.regulatoryUpdate.create({
                data: {
                  externalId: item.externalId,
                  slug,
                  agency: item.agency,
                  updateType: item.updateType,
                  title: item.title,
                  summary: item.summary,
                  content: item.content,
                  documentUrl: item.documentUrl,
                  docketNumber: item.docketNumber,
                  publishedAt: item.publishedAt,
                },
              })
              sourceResult.created++
            }
          } catch (err) {
            sourceResult.failed++
            console.error('Failed to upsert regulatory update:', err)
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

    return NextResponse.json({
      success: true,
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      sources: results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Scrape failed', message: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
