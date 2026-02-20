import { prisma } from '@/lib/db'
import type { Prisma, JobType, WorkMode, ExperienceLevel } from '@prisma/client'
import type { JobFilters, JobFilterOptions, JobStats, JobWithSource } from './types'

export const ITEMS_PER_PAGE = 24

const VALID_JOB_TYPES = new Set<string>(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'])
const VALID_WORK_MODES = new Set<string>(['ONSITE', 'REMOTE', 'HYBRID'])
const VALID_EXPERIENCE_LEVELS = new Set<string>(['ENTRY', 'MID', 'SENIOR', 'EXECUTIVE'])

export async function getJobs(filters: JobFilters): Promise<{ jobs: JobWithSource[]; total: number }> {
  const where: Prisma.JobWhereInput = { isActive: true }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: 'insensitive' } },
      { company: { contains: filters.q, mode: 'insensitive' } },
      { description: { contains: filters.q, mode: 'insensitive' } },
      { city: { contains: filters.q, mode: 'insensitive' } },
    ]
  }

  if (filters.state) where.state = filters.state
  if (filters.company) where.companySlug = filters.company
  if (filters.category) where.category = filters.category
  if (filters.jobType && VALID_JOB_TYPES.has(filters.jobType)) where.jobType = filters.jobType as JobType
  if (filters.workMode && VALID_WORK_MODES.has(filters.workMode)) where.workMode = filters.workMode as WorkMode
  if (filters.experienceLevel && VALID_EXPERIENCE_LEVELS.has(filters.experienceLevel)) where.experienceLevel = filters.experienceLevel as ExperienceLevel

  const orderBy = getOrderBy(filters.sort)
  const page = Math.min(Math.max(1, parseInt(filters.page || '1', 10) || 1), 1000)
  const skip = (page - 1) * ITEMS_PER_PAGE

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip,
      take: ITEMS_PER_PAGE,
      include: { jobSource: { select: { name: true, baseUrl: true } } },
    }),
    prisma.job.count({ where }),
  ])

  return { jobs: jobs as JobWithSource[], total }
}

export async function getJobBySlug(slug: string): Promise<JobWithSource | null> {
  const job = await prisma.job.findUnique({
    where: { slug },
    include: { jobSource: { select: { name: true, baseUrl: true } } },
  })
  return job as JobWithSource | null
}

export async function getJobFilterOptions(): Promise<JobFilterOptions> {
  const [states, companies, categories] = await Promise.all([
    prisma.job.groupBy({
      by: ['state'],
      where: { isActive: true, state: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { state: 'desc' } },
    }),
    prisma.job.groupBy({
      by: ['company', 'companySlug'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { company: 'desc' } },
      take: 50,
    }),
    prisma.job.groupBy({
      by: ['category'],
      where: { isActive: true, category: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
    }),
  ])

  return {
    states: states
      .filter((s) => s.state)
      .map((s) => ({ value: s.state!, count: s._count._all })),
    companies: companies.map((c) => ({
      value: c.company,
      slug: c.companySlug,
      count: c._count._all,
    })),
    categories: categories
      .filter((c) => c.category)
      .map((c) => ({ value: c.category!, count: c._count._all })),
  }
}

export async function getJobStats(): Promise<JobStats> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [totalActive, newThisWeek, byType, byCategory] = await Promise.all([
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.count({ where: { isActive: true, postedAt: { gte: oneWeekAgo } } }),
    prisma.job.groupBy({
      by: ['jobType'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { _count: { jobType: 'desc' } },
    }),
    prisma.job.groupBy({
      by: ['category'],
      where: { isActive: true, category: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    }),
  ])

  return {
    totalActive,
    newThisWeek,
    byType: byType.map((t) => ({ type: t.jobType, count: t._count._all })),
    byCategory: byCategory
      .filter((c) => c.category)
      .map((c) => ({ category: c.category!, count: c._count._all })),
  }
}

function getOrderBy(sort?: string): Prisma.JobOrderByWithRelationInput[] {
  switch (sort) {
    case 'salary_desc':
      return [{ salaryMax: { sort: 'desc', nulls: 'last' } }, { postedAt: 'desc' }]
    case 'title_asc':
      return [{ title: 'asc' }]
    case 'company_asc':
      return [{ company: 'asc' }]
    default:
      return [{ postedAt: 'desc' }]
  }
}
