export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY'
export type WorkMode = 'ONSITE' | 'REMOTE' | 'HYBRID'
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'EXECUTIVE'
export type SalaryPeriod = 'YEARLY' | 'HOURLY'

export interface StaticJob {
  id: string
  slug: string
  title: string
  company: string
  companySlug: string
  city?: string
  state?: string
  country: string
  workMode: WorkMode
  jobType: JobType
  category?: string
  experienceLevel?: ExperienceLevel
  salaryMin?: number
  salaryMax?: number
  salaryPeriod?: SalaryPeriod
  description: string
  applyUrl: string
  postedAt: string
  source: string
  sourceUrl: string
}

// Alias for compatibility with components
export type JobWithSource = StaticJob

export interface JobFilters {
  q?: string
  state?: string
  company?: string
  category?: string
  jobType?: string
  workMode?: string
  experienceLevel?: string
  sort?: string
  page?: string
}

export interface JobFilterOptions {
  states: { value: string; count: number }[]
  companies: { value: string; slug: string; count: number }[]
  categories: { value: string; count: number }[]
}

export interface RawJobData {
  externalId: string
  title: string
  company: string
  city?: string
  state?: string
  country?: string
  workMode?: WorkMode
  jobType?: JobType
  category?: string
  experienceLevel?: ExperienceLevel
  salaryMin?: number
  salaryMax?: number
  salaryPeriod?: SalaryPeriod
  description: string
  applyUrl: string
  postedAt: Date
  expiresAt?: Date
}

export interface JobStats {
  totalActive: number
  newThisWeek: number
  byType: { type: string; count: number }[]
  byCategory: { category: string; count: number }[]
}
