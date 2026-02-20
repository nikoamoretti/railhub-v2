import { PrismaClient } from '@prisma/client'
import { fetchCSXJobs } from '../lib/jobs/sources/csx'
import { fetchAmtrakJobs } from '../lib/jobs/sources/amtrak'
import { fetchNorfolkSouthernJobs } from '../lib/jobs/sources/norfolk-southern'
import { fetchUnionPacificJobs } from '../lib/jobs/sources/union-pacific'
import { fetchBNSFJobs } from '../lib/jobs/sources/bnsf'
import { generateJobSlug, generateCompanySlug } from '../lib/jobs/slug'
import { generateContentHash } from '../lib/jobs/dedup'
import { classifyJob } from '../lib/jobs/categories'
import type { RawJobData } from '../lib/jobs/types'

const prisma = new PrismaClient()

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

async function main() {
  console.log(`Starting job seed with ${SOURCES.length} sources...\n`)

  let totalCreated = 0
  let totalSkipped = 0
  let totalFailed = 0

  for (const src of SOURCES) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Source: ${src.name}`)
    console.log(`${'='.repeat(60)}`)

    // Upsert job source
    const source = await prisma.jobSource.upsert({
      where: { name: src.name },
      update: {},
      create: {
        name: src.name,
        type: src.type,
        baseUrl: src.baseUrl,
      },
    })

    console.log(`Source ID: ${source.id}`)

    // Fetch jobs
    let rawJobs: RawJobData[]
    try {
      rawJobs = await src.fetcher()
    } catch (err) {
      console.error(`Failed to fetch from ${src.name}:`, err)
      continue
    }

    console.log(`Fetched ${rawJobs.length} raw jobs`)

    if (rawJobs.length === 0) continue

    // Pre-fetch existing to avoid N+1
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

    let created = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < rawJobs.length; i++) {
      const raw = rawJobs[i]
      try {
        const contentHash = contentHashes[i]

        // Skip if already exists by source or content hash
        if (existingBySource.has(raw.externalId) || existingHashes.has(contentHash)) {
          skipped++
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
        created++
      } catch (err) {
        failed++
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`  Failed "${raw.title}": ${msg}`)
      }
    }

    // Update source stats
    const totalJobs = await prisma.job.count({ where: { jobSourceId: source.id, isActive: true } })
    await prisma.jobSource.update({
      where: { id: source.id },
      data: { lastScrapeAt: new Date(), totalJobs },
    })

    console.log(`  Created: ${created}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Failed: ${failed}`)
    console.log(`  Total active for source: ${totalJobs}`)

    totalCreated += created
    totalSkipped += skipped
    totalFailed += failed
  }

  const grandTotal = await prisma.job.count({ where: { isActive: true } })

  console.log(`\n${'='.repeat(60)}`)
  console.log(`SEED COMPLETE`)
  console.log(`  Total created: ${totalCreated}`)
  console.log(`  Total skipped: ${totalSkipped}`)
  console.log(`  Total failed: ${totalFailed}`)
  console.log(`  Grand total active jobs: ${grandTotal}`)
  console.log(`${'='.repeat(60)}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
