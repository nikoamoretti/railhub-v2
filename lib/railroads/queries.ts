import facilitiesData from '@/public/facilities.json'
import jobsData from '@/public/jobs.json'
import type { Facility } from '@/lib/types'
import type { StaticJob } from '@/lib/jobs/types'
import { RAILROAD_REGISTRY, type RailroadMeta } from '@/lib/railroads'
import { getStateName } from '@/lib/states'

const allFacilities = facilitiesData as Facility[]
const allJobs = jobsData as StaticJob[]

export interface RailroadIndexItem {
  meta: RailroadMeta
  facilityCount: number
  jobCount: number
  stateCount: number
  topStates: { code: string; name: string; count: number }[]
}

export interface RailroadDetail extends RailroadIndexItem {
  facilities: Facility[]
  jobs: StaticJob[]
  states: { code: string; name: string; count: number }[]
  facilityTypes: { type: string; count: number }[]
}

function getFacilitiesForRailroad(meta: RailroadMeta): Facility[] {
  const nameSet = new Set(meta.facilityNames.map(n => n.toLowerCase()))
  return allFacilities.filter(f =>
    f.railroads?.some(r => {
      const name = r.railroad?.name?.toLowerCase() ?? ''
      return nameSet.has(name)
    })
  )
}

function getJobsForRailroad(meta: RailroadMeta): StaticJob[] {
  const slugSet = new Set(meta.jobSlugs)
  return allJobs.filter(j => slugSet.has(j.companySlug))
}

function getStateCounts(facilities: Facility[]): { code: string; name: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const f of facilities) {
    const st = f.location?.state
    if (st) counts.set(st, (counts.get(st) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: getStateName(code), count }))
    .sort((a, b) => b.count - a.count)
}

function getFacilityTypeCounts(facilities: Facility[]): { type: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const f of facilities) {
    const t = f.type || 'OTHER'
    counts.set(t, (counts.get(t) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
}

export function getRailroadIndex(): RailroadIndexItem[] {
  return RAILROAD_REGISTRY.map(meta => {
    const facilities = getFacilitiesForRailroad(meta)
    const jobs = getJobsForRailroad(meta)
    const stateCounts = getStateCounts(facilities)
    return {
      meta,
      facilityCount: facilities.length,
      jobCount: jobs.length,
      stateCount: stateCounts.length,
      topStates: stateCounts.slice(0, 3),
    }
  }).sort((a, b) => b.facilityCount - a.facilityCount)
}

export function getRailroadDetail(slug: string): RailroadDetail | null {
  const meta = RAILROAD_REGISTRY.find(r => r.slug === slug)
  if (!meta) return null

  const facilities = getFacilitiesForRailroad(meta)
  const jobs = getJobsForRailroad(meta)
  const states = getStateCounts(facilities)
  const facilityTypes = getFacilityTypeCounts(facilities)

  return {
    meta,
    facilityCount: facilities.length,
    jobCount: jobs.length,
    stateCount: states.length,
    topStates: states.slice(0, 3),
    facilities,
    jobs,
    states,
    facilityTypes,
  }
}
