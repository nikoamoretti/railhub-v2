import type { Job, JobSource, WorkMode, JobType, ExperienceLevel, SalaryPeriod } from '@prisma/client'

export type { Job, JobSource, WorkMode, JobType, ExperienceLevel, SalaryPeriod }

export interface JobWithSource extends Job {
  jobSource: Pick<JobSource, 'name' | 'baseUrl'>
}

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

export interface JobStats {
  totalActive: number
  newThisWeek: number
  byType: { type: string; count: number }[]
  byCategory: { category: string; count: number }[]
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
