import type { RawJobData } from '../types'
import type { WorkMode, JobType, ExperienceLevel, SalaryPeriod } from '@prisma/client'

const RAPIDAPI_HOST = 'jsearch.p.rapidapi.com'

const RAIL_QUERIES = [
  'railroad jobs',
  'rail freight jobs',
  'locomotive engineer',
  'railroad conductor',
  'track maintenance railroad',
  'railcar mechanic',
  'rail yard operations',
  'freight rail logistics',
  'railroad safety compliance',
]

interface JSearchJob {
  job_id: string
  job_title: string
  employer_name: string
  job_city: string | null
  job_state: string | null
  job_country: string | null
  job_description: string
  job_apply_link: string
  job_is_remote: boolean
  job_employment_type: string | null
  job_min_salary: number | null
  job_max_salary: number | null
  job_salary_period: string | null
  job_posted_at_timestamp: number
  job_offer_expiration_timestamp: number | null
  job_required_experience?: {
    required_experience_in_months?: number | null
  }
}

interface JSearchResponse {
  status: string
  data: JSearchJob[]
}

export async function fetchJSearchJobs(
  apiKey: string,
  options?: { maxQueries?: number; pageSize?: number }
): Promise<RawJobData[]> {
  const maxQueries = options?.maxQueries ?? RAIL_QUERIES.length
  const pageSize = options?.pageSize ?? 10
  const allJobs: RawJobData[] = []
  const seenIds = new Set<string>()

  for (let i = 0; i < Math.min(maxQueries, RAIL_QUERIES.length); i++) {
    const query = RAIL_QUERIES[i]

    try {
      const params = new URLSearchParams({
        query,
        page: '1',
        num_pages: '1',
        date_posted: 'month',
        country: 'US',
      })

      const res = await fetch(`https://${RAPIDAPI_HOST}/search?${params}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      })

      if (!res.ok) {
        console.error(`JSearch query "${query}" failed: ${res.status}`)
        continue
      }

      const data: JSearchResponse = await res.json()

      for (const job of data.data || []) {
        if (seenIds.has(job.job_id)) continue
        seenIds.add(job.job_id)

        allJobs.push({
          externalId: job.job_id,
          title: job.job_title,
          company: job.employer_name,
          city: job.job_city || undefined,
          state: normalizeState(job.job_state),
          country: job.job_country || 'US',
          workMode: mapWorkMode(job.job_is_remote),
          jobType: mapJobType(job.job_employment_type),
          experienceLevel: mapExperience(job.job_required_experience?.required_experience_in_months),
          salaryMin: job.job_min_salary ? Math.round(job.job_min_salary) : undefined,
          salaryMax: job.job_max_salary ? Math.round(job.job_max_salary) : undefined,
          salaryPeriod: mapSalaryPeriod(job.job_salary_period),
          description: job.job_description,
          applyUrl: job.job_apply_link,
          postedAt: new Date(job.job_posted_at_timestamp * 1000),
          expiresAt: job.job_offer_expiration_timestamp
            ? new Date(job.job_offer_expiration_timestamp * 1000)
            : undefined,
        })
      }
    } catch (err) {
      console.error(`JSearch query "${query}" error:`, err)
    }
  }

  return allJobs
}

function mapWorkMode(isRemote: boolean): WorkMode {
  return isRemote ? 'REMOTE' : 'ONSITE'
}

function mapJobType(type: string | null): JobType {
  if (!type) return 'FULL_TIME'
  const t = type.toUpperCase()
  if (t.includes('PART')) return 'PART_TIME'
  if (t.includes('CONTRACT') || t.includes('FREELANCE')) return 'CONTRACT'
  if (t.includes('INTERN')) return 'INTERNSHIP'
  if (t.includes('TEMP')) return 'TEMPORARY'
  return 'FULL_TIME'
}

function mapExperience(months: number | null | undefined): ExperienceLevel | undefined {
  if (months == null) return undefined
  if (months <= 24) return 'ENTRY'
  if (months <= 60) return 'MID'
  if (months <= 120) return 'SENIOR'
  return 'EXECUTIVE'
}

function mapSalaryPeriod(period: string | null): SalaryPeriod | undefined {
  if (!period) return undefined
  const p = period.toUpperCase()
  if (p.includes('HOUR')) return 'HOURLY'
  if (p.includes('YEAR') || p.includes('ANNUAL')) return 'YEARLY'
  return undefined
}

// Map full state names to 2-letter codes
const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY',
}

function normalizeState(state: string | null): string | undefined {
  if (!state) return undefined
  const trimmed = state.trim()
  // Already a 2-letter code
  if (/^[A-Z]{2}$/.test(trimmed)) return trimmed
  // Try to map full name
  const mapped = STATE_MAP[trimmed.toLowerCase()]
  if (mapped) return mapped
  // Already a valid 2-letter code from the API
  if (/^[A-Z]{2}$/.test(trimmed.toUpperCase())) return trimmed.toUpperCase()
  return undefined
}
