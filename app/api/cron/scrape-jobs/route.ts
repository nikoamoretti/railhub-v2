import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchCSXJobs } from '@/lib/jobs/sources/csx'
import { fetchAmtrakJobs } from '@/lib/jobs/sources/amtrak'
import { fetchNorfolkSouthernJobs } from '@/lib/jobs/sources/norfolk-southern'
import { fetchUnionPacificJobs } from '@/lib/jobs/sources/union-pacific'
import { fetchBNSFJobs } from '@/lib/jobs/sources/bnsf'
import { generateJobSlug, generateCompanySlug } from '@/lib/jobs/slug'
import { generateContentHash } from '@/lib/jobs/dedup'
import { classifyJob } from '@/lib/jobs/categories'
import { expireOldJobs } from '@/lib/jobs/expiry'
import type { RawJobData } from '@/lib/jobs/types'

export const maxDuration = 60

interface SourceConfig {
  name: string
  type: 'API' | 'SCRAPER'
  baseUrl: string
  fetcher: () => Promise<RawJobData[]>
}

const SOURCES: SourceConfig[] = [
  {
    name: 'CSX Careers',
    type: 'API',
    baseUrl: 'https://fa-eowa-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CSXCareers',
    fetcher: fetchCSXJobs,
  },
  {
    name: 'Amtrak Careers',
    type: 'SCRAPER',
    baseUrl: 'https://careers.amtrak.com',
    fetcher: fetchAmtrakJobs,
  },
  {
    name: 'Norfolk Southern Careers',
    type: 'SCRAPER',
    baseUrl: 'https://jobs.nscorp.com',
    fetcher: fetchNorfolkSouthernJobs,
  },
  {
    name: 'Union Pacific Careers',
    type: 'SCRAPER',
    baseUrl: 'https://up.jobs',
    fetcher: fetchUnionPacificJobs,
  },
  {
    name: 'BNSF Careers',
    type: 'SCRAPER',
    baseUrl: 'https://jobs.bnsf.com',
    fetcher: fetchBNSFJobs,
  },
]

export async function GET(req: Request) {
  // Verify cron secret
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
      // Check timeout — stop processing new sources after 45s
      if (Date.now() - startTime > 45_000) {
        console.log(`Timeout approaching, skipping remaining sources`)
        break
      }

      const sourceResult = { found: 0, created: 0, updated: 0, failed: 0 }
      results[src.name] = sourceResult

      // Get or create source
      const source = await prisma.jobSource.upsert({
        where: { name: src.name },
        update: {},
        create: { name: src.name, type: src.type, baseUrl: src.baseUrl },
      })

      // Create scrape log
      const scrapeLog = await prisma.scrapeLog.create({
        data: {
          jobSourceId: source.id,
          status: 'RUNNING',
          startedAt: new Date(),
        },
      })

      try {
        const rawJobs = await src.fetcher()
        sourceResult.found = rawJobs.length

        if (rawJobs.length > 0) {
          // Pre-fetch existing jobs
          const existingBySource = new Map(
            (await prisma.job.findMany({
              where: {
                jobSourceId: source.id,
                externalId: { in: rawJobs.map((j) => j.externalId) },
              },
              select: { id: true, externalId: true },
            })).map((j) => [j.externalId, j.id])
          )

          const contentHashes = rawJobs.map((j) => generateContentHash(j.title, j.company, j.city))
          const existingHashes = new Set(
            (await prisma.job.findMany({
              where: { contentHash: { in: contentHashes } },
              select: { contentHash: true },
            })).map((j) => j.contentHash!)
          )

          for (let i = 0; i < rawJobs.length; i++) {
            // Check timeout
            if (Date.now() - startTime > 55_000) break

            const raw = rawJobs[i]
            try {
              const contentHash = contentHashes[i]

              // Update existing
              const existingId = existingBySource.get(raw.externalId)
              if (existingId) {
                await prisma.job.update({
                  where: { id: existingId },
                  data: {
                    title: raw.title,
                    description: raw.description,
                    salaryMin: raw.salaryMin,
                    salaryMax: raw.salaryMax,
                    applyUrl: raw.applyUrl,
                    scrapedAt: new Date(),
                    isActive: true,
                  },
                })
                sourceResult.updated++
                continue
              }

              // Skip cross-source duplicates
              if (existingHashes.has(contentHash)) {
                sourceResult.updated++
                continue
              }

              const category = raw.category || classifyJob(raw.title, raw.description)
              const slug = generateJobSlug(raw.title, raw.company, raw.city, raw.state)
              const companySlug = generateCompanySlug(raw.company)

              await prisma.job.create({
                data: {
                  slug,
                  title: raw.title,
                  company: raw.company,
                  companySlug,
                  city: raw.city,
                  state: raw.state,
                  country: raw.country || 'US',
                  workMode: raw.workMode || 'ONSITE',
                  jobType: raw.jobType || 'FULL_TIME',
                  category,
                  experienceLevel: raw.experienceLevel,
                  salaryMin: raw.salaryMin,
                  salaryMax: raw.salaryMax,
                  salaryPeriod: raw.salaryPeriod,
                  description: raw.description,
                  applyUrl: raw.applyUrl,
                  externalId: raw.externalId,
                  jobSourceId: source.id,
                  contentHash,
                  postedAt: raw.postedAt,
                  expiresAt: raw.expiresAt,
                },
              })
              existingHashes.add(contentHash)
              sourceResult.created++
            } catch (err) {
              sourceResult.failed++
              console.error(`Failed to upsert job "${raw.title}" (${raw.externalId}):`, err)
            }
          }
        }

        // Update source stats
        const totalJobs = await prisma.job.count({
          where: { jobSourceId: source.id, isActive: true },
        })
        await prisma.jobSource.update({
          where: { id: source.id },
          data: { lastScrapeAt: new Date(), totalJobs },
        })

        // Update scrape log
        await prisma.scrapeLog.update({
          where: { id: scrapeLog.id },
          data: {
            status: 'COMPLETED',
            jobsFound: sourceResult.found,
            jobsCreated: sourceResult.created,
            jobsUpdated: sourceResult.updated,
            jobsFailed: sourceResult.failed,
            completedAt: new Date(),
          },
        })
      } catch (err) {
        await prisma.scrapeLog.update({
          where: { id: scrapeLog.id },
          data: {
            status: 'FAILED',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
            completedAt: new Date(),
          },
        })
        console.error(`Source ${src.name} failed:`, err)
      }
    }

    // Expire old jobs
    totalExpired = await expireOldJobs()

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
