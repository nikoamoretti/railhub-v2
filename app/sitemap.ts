import type { MetadataRoute } from 'next'
import facilitiesData from '@/public/facilities.json'
import type { Facility } from '@/lib/types'
import type { GlossaryTerm, CarType, InterchangeRule, Guide } from '@/lib/resource-types'
import glossaryData from '@/public/data/glossary.json'
import carTypesData from '@/public/data/car-types.json'
import interchangeData from '@/public/data/interchange-rules.json'
import guidesData from '@/public/data/guides.json'
import { prisma } from '@/lib/db'
import { getAllRailroadSlugs } from '@/lib/railroads'

const BASE_URL = 'https://railhub-v2.vercel.app'
const facilities = facilitiesData as Facility[]
const glossary = glossaryData as GlossaryTerm[]
const carTypes = carTypesData as CarType[]
const interchangeRules = interchangeData as InterchangeRule[]
const guides = guidesData as Guide[]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const states = [...new Set(
    facilities.map(f => f.location?.state).filter(Boolean)
  )] as string[]

  const stateEntries: MetadataRoute.Sitemap = states.map(state => ({
    url: `${BASE_URL}/state/${state}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const facilityEntries: MetadataRoute.Sitemap = facilities.map(f => ({
    url: `${BASE_URL}/facility/${f.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const resourcePages: MetadataRoute.Sitemap = [
    '/resources',
    '/resources/glossary',
    '/resources/car-types',
    '/resources/reporting-marks',
    '/resources/commodity-codes',
    '/resources/interchange-rules',
    '/resources/guides',
    '/resources/rail-101',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const glossaryEntries: MetadataRoute.Sitemap = glossary.map(term => ({
    url: `${BASE_URL}/resources/glossary/${term.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const carTypeEntries: MetadataRoute.Sitemap = carTypes.map(ct => ({
    url: `${BASE_URL}/resources/car-types/${ct.designation}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const interchangeEntries: MetadataRoute.Sitemap = interchangeRules.map(rule => ({
    url: `${BASE_URL}/resources/interchange-rules/${rule.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const guideEntries: MetadataRoute.Sitemap = guides.map(guide => ({
    url: `${BASE_URL}/resources/guides/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Industry pages
  const industryPages: MetadataRoute.Sitemap = [
    '/industry',
    '/industry/metrics',
    '/industry/fuel-surcharges',
    '/industry/advisories',
    '/regulatory',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  // Dynamic advisory pages
  let advisoryEntries: MetadataRoute.Sitemap = []
  try {
    const advisories = await prisma.serviceAdvisory.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      take: 5000,
    })
    advisoryEntries = advisories.map(a => ({
      url: `${BASE_URL}/industry/advisories/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }))
  } catch {
    // Table may not exist during initial build
  }

  // Dynamic regulatory pages
  let regulatoryEntries: MetadataRoute.Sitemap = []
  try {
    const updates = await prisma.regulatoryUpdate.findMany({
      select: { slug: true, createdAt: true },
      take: 5000,
    })
    regulatoryEntries = updates.map(u => ({
      url: `${BASE_URL}/regulatory/${u.slug}`,
      lastModified: u.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // Table may not exist during initial build
  }

  // Job pages (from static JSON)
  const jobsJson = await import('@/public/jobs.json').then(m => m.default).catch(() => [])
  const jobEntries: MetadataRoute.Sitemap = (jobsJson as { slug: string; postedAt: string }[]).map(job => ({
    url: `${BASE_URL}/jobs/${job.slug}`,
    lastModified: new Date(job.postedAt),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/states`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/railroads`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...getAllRailroadSlugs().map(slug => ({
      url: `${BASE_URL}/railroad/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...stateEntries,
    ...facilityEntries,
    ...resourcePages,
    ...glossaryEntries,
    ...carTypeEntries,
    ...interchangeEntries,
    ...guideEntries,
    ...industryPages,
    ...advisoryEntries,
    ...regulatoryEntries,
    ...jobEntries,
  ]
}
