import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchJSearchJobs } from '@/lib/jobs/sources/jsearch'
import { generateJobSlug, generateCompanySlug } from '@/lib/jobs/slug'
import { generateContentHash } from '@/lib/jobs/dedup'
import { classifyJob } from '@/lib/jobs/categories'
import { expireOldJobs } from '@/lib/jobs/expiry'

export const maxDuration = 60

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

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY not configured' }, { status: 500 })
  }

  const startTime = Date.now()

  // Get or create source
  const source = await prisma.jobSource.upsert({
    where: { name: 'JSearch' },
    update: {},
    create: {
      name: 'JSearch',
      type: 'API',
      baseUrl: 'https://jsearch.p.rapidapi.com',
    },
  })

  // Create scrape log
  const scrapeLog = await prisma.scrapeLog.create({
    data: {
      jobSourceId: source.id,
      status: 'RUNNING',
      startedAt: new Date(),
    },
  })

  let jobsFound = 0
  let jobsCreated = 0
  let jobsUpdated = 0
  let jobsFailed = 0

  try {
    // Fetch jobs with timeout awareness (50s cutoff for 60s limit)
    const rawJobs = await fetchJSearchJobs(apiKey)
    jobsFound = rawJobs.length

    // Pre-fetch existing jobs to avoid N+1 queries
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
      // Check timeout — stop after 50s
      if (Date.now() - startTime > 50_000) break

      const raw = rawJobs[i]
      try {
        const contentHash = contentHashes[i]

        // Check for existing by externalId+source
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
          jobsUpdated++
          continue
        }

        // Check cross-source duplicates via content hash
        if (existingHashes.has(contentHash)) {
          jobsUpdated++
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
        jobsCreated++
      } catch (err) {
        jobsFailed++
        console.error(`Failed to upsert job "${raw.title}" (${raw.externalId}):`, err)
      }
    }

    // Expire old jobs
    const jobsExpired = await expireOldJobs()

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
        jobsFound,
        jobsCreated,
        jobsUpdated,
        jobsExpired,
        jobsFailed,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      jobsFound,
      jobsCreated,
      jobsUpdated,
      jobsExpired,
      jobsFailed,
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

    return NextResponse.json(
      { error: 'Scrape failed', message: err instanceof Error ? err.message : 'Unknown' },
      { status: 500 }
    )
  }
}
