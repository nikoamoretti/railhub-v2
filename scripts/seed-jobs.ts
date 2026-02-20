import { PrismaClient } from '@prisma/client'
import { fetchJSearchJobs } from '../lib/jobs/sources/jsearch'
import { generateJobSlug, generateCompanySlug } from '../lib/jobs/slug'
import { generateContentHash } from '../lib/jobs/dedup'
import { classifyJob } from '../lib/jobs/categories'

const prisma = new PrismaClient()

async function main() {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    console.error('RAPIDAPI_KEY environment variable is required')
    process.exit(1)
  }

  console.log('Setting up JSearch job source...')

  // Upsert job source
  const source = await prisma.jobSource.upsert({
    where: { name: 'JSearch' },
    update: {},
    create: {
      name: 'JSearch',
      type: 'API',
      baseUrl: 'https://jsearch.p.rapidapi.com',
    },
  })

  console.log(`Job source: ${source.name} (${source.id})`)
  console.log('Fetching jobs from JSearch API...')

  const rawJobs = await fetchJSearchJobs(apiKey)
  console.log(`Fetched ${rawJobs.length} raw jobs`)

  let created = 0
  let skipped = 0
  let failed = 0

  for (const raw of rawJobs) {
    try {
      const contentHash = generateContentHash(raw.title, raw.company, raw.city)

      // Check for duplicate by externalId+source or content hash
      const existing = await prisma.job.findFirst({
        where: {
          OR: [
            { externalId: raw.externalId, jobSourceId: source.id },
            { contentHash },
          ],
        },
      })

      if (existing) {
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

      created++
    } catch (err) {
      failed++
      console.error(`Failed to insert "${raw.title}":`, err)
    }
  }

  // Update source stats
  const totalJobs = await prisma.job.count({ where: { jobSourceId: source.id, isActive: true } })
  await prisma.jobSource.update({
    where: { id: source.id },
    data: { lastScrapeAt: new Date(), totalJobs },
  })

  console.log(`\nSeed complete:`)
  console.log(`  Created: ${created}`)
  console.log(`  Skipped (duplicates): ${skipped}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total active: ${totalJobs}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
