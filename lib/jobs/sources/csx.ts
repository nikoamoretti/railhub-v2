import type { RawJobData } from '../types'
import type { WorkMode } from '@prisma/client'

const BASE_URL =
  'https://fa-eowa-saasfaprod1.fa.ocs.oraclecloud.com'

const ENDPOINT =
  `${BASE_URL}/hcmRestApi/resources/latest/recruitingCEJobRequisitions` +
  `?onlyData=true` +
  `&expand=requisitionList.secondaryLocations,flexFieldsFacet.values` +
  `&finder=findReqs;siteNumber=CX_45001,facetsList=LOCATIONS%3BWORK_LOCATIONS%3BWORKPLACE_TYPES%3BTITLES%3BCATEGORIES%3BORGANIZATIONS%3BPOSTING_DATES%3BFLEX_FIELDS,limit=100,lastSelectedFacet=POSTING_DATES,selectedCategoriesFacet=,selectedFlexFieldsFacets=,selectedLocationsFacet=,selectedPostingDatesFacet=,selectedOrganizationsFacet=,selectedTitlesFacet=,selectedWorkLocationsFacet=,selectedWorkplaceTypesFacet=,sortBy=POSTING_DATES_DESC`

interface CSXRequisition {
  Id: string
  Title: string
  PostedDate: string
  PrimaryLocation: string
  PrimaryLocationCountry: string
  WorkplaceTypeCode: string
  ShortDescriptionStr?: string
  ExternalQualificationsStr?: string
  ExternalResponsibilitiesStr?: string
  JobFamily?: string
  JobFunction?: string
  secondaryLocations?: unknown[]
}

interface CSXResponseItem {
  requisitionList: CSXRequisition[]
}

interface CSXResponse {
  items: CSXResponseItem[]
}

export async function fetchCSXJobs(): Promise<RawJobData[]> {
  console.log('CSX: fetching jobs...')

  let data: CSXResponse

  try {
    const res = await fetch(ENDPOINT)

    if (!res.ok) {
      console.error(`CSX: request failed with status ${res.status}`)
      return []
    }

    data = (await res.json()) as CSXResponse
  } catch (err) {
    console.error('CSX: fetch error:', err)
    return []
  }

  const requisitions: CSXRequisition[] = data.items.flatMap(
    (item) => item.requisitionList ?? []
  )

  console.log(`CSX: mapping ${requisitions.length} requisition(s)`)

  const jobs: RawJobData[] = []

  for (const job of requisitions) {
    try {
      const { city, state } = parsePrimaryLocation(job.PrimaryLocation)

      const descriptionParts = [
        job.ShortDescriptionStr,
        job.ExternalResponsibilitiesStr,
        job.ExternalQualificationsStr,
      ].filter(Boolean)

      jobs.push({
        externalId: `csx-${job.Id}`,
        title: job.Title,
        company: 'CSX Transportation',
        city,
        state,
        country: 'US',
        workMode: mapWorkMode(job.WorkplaceTypeCode),
        jobType: 'FULL_TIME',
        description: descriptionParts.join('\n\n'),
        applyUrl: `${BASE_URL}/hcmUI/CandidateExperience/en/sites/CSXCareers/job/${job.Id}`,
        postedAt: new Date(job.PostedDate),
      })
    } catch (err) {
      console.error(`CSX: failed to map job ${job.Id}:`, err)
    }
  }

  console.log(`CSX: returning ${jobs.length} job(s)`)
  return jobs
}

/**
 * Parses "City, ST" or "City, ST ZIP" into city and 2-letter state code.
 * Returns undefined for each field when the format is unrecognised.
 */
function parsePrimaryLocation(location: string): { city?: string; state?: string } {
  if (!location) return {}

  const commaIndex = location.indexOf(',')
  if (commaIndex === -1) return { city: location.trim() }

  const city = location.slice(0, commaIndex).trim() || undefined
  // Everything after the comma may be " ST" or " ST ZIP"
  const rest = location.slice(commaIndex + 1).trim()
  const stateCode = rest.split(/\s+/)[0]

  const state = /^[A-Z]{2}$/.test(stateCode) ? stateCode : undefined

  return { city, state }
}

function mapWorkMode(code: string): WorkMode {
  switch (code) {
    case 'ORA_REMOTE':
      return 'REMOTE'
    case 'ORA_HYBRID':
      return 'HYBRID'
    case 'ORA_ONSITE':
    default:
      return 'ONSITE'
  }
}
