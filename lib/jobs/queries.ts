import jobsData from '../../public/jobs.json'
import type { StaticJob, JobFilters, JobFilterOptions, JobStats, JobWithSource } from './types'

const allJobs = jobsData as StaticJob[]

export const ITEMS_PER_PAGE = 24

export async function getJobs(filters: JobFilters): Promise<{ jobs: JobWithSource[]; total: number }> {
  let result = [...allJobs]

  if (filters.q) {
    const q = filters.q.toLowerCase()
    result = result.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.city?.toLowerCase().includes(q)
    )
  }

  if (filters.state) result = result.filter(j => j.state === filters.state)
  if (filters.company) result = result.filter(j => j.companySlug === filters.company)
  if (filters.category) result = result.filter(j => j.category === filters.category)
  if (filters.jobType) result = result.filter(j => j.jobType === filters.jobType)
  if (filters.workMode) result = result.filter(j => j.workMode === filters.workMode)

  result.sort(getSortFn(filters.sort))

  const total = result.length
  const page = Math.max(1, parseInt(filters.page || '1', 10) || 1)
  const skip = (page - 1) * ITEMS_PER_PAGE
  const jobs = result.slice(skip, skip + ITEMS_PER_PAGE)

  return { jobs, total }
}

export async function getJobBySlug(slug: string): Promise<JobWithSource | null> {
  return allJobs.find(j => j.slug === slug) || null
}

export async function getJobFilterOptions(): Promise<JobFilterOptions> {
  const stateCounts = new Map<string, number>()
  const companyCounts = new Map<string, { name: string; slug: string; count: number }>()
  const categoryCounts = new Map<string, number>()

  for (const j of allJobs) {
    if (j.state) stateCounts.set(j.state, (stateCounts.get(j.state) || 0) + 1)

    if (!companyCounts.has(j.companySlug)) {
      companyCounts.set(j.companySlug, { name: j.company, slug: j.companySlug, count: 0 })
    }
    companyCounts.get(j.companySlug)!.count++

    if (j.category) categoryCounts.set(j.category, (categoryCounts.get(j.category) || 0) + 1)
  }

  return {
    states: [...stateCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    companies: [...companyCounts.values()]
      .map(c => ({ value: c.name, slug: c.slug, count: c.count }))
      .sort((a, b) => b.count - a.count),
    categories: [...categoryCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export async function getJobStats(): Promise<JobStats> {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const newThisWeek = allJobs.filter(j => new Date(j.postedAt) >= oneWeekAgo).length

  const byType = new Map<string, number>()
  const byCategory = new Map<string, number>()

  for (const j of allJobs) {
    byType.set(j.jobType, (byType.get(j.jobType) || 0) + 1)
    if (j.category) byCategory.set(j.category, (byCategory.get(j.category) || 0) + 1)
  }

  return {
    totalActive: allJobs.length,
    newThisWeek,
    byType: [...byType.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    byCategory: [...byCategory.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  }
}

function getSortFn(sort?: string): (a: StaticJob, b: StaticJob) => number {
  switch (sort) {
    case 'salary_desc':
      return (a, b) => (b.salaryMax || 0) - (a.salaryMax || 0)
    case 'title_asc':
      return (a, b) => a.title.localeCompare(b.title)
    case 'company_asc':
      return (a, b) => a.company.localeCompare(b.company)
    default:
      return (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  }
}
