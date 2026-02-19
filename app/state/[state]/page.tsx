import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import facilitiesData from '@/public/facilities.json'
import type { Facility } from '@/lib/types'
import { getStateName } from '@/lib/states'
import { SearchFilters } from '@/components/search-filters'
import { FacilityCard } from '@/components/facility-card'
import { Pagination } from '@/components/pagination'

const facilities = facilitiesData as Facility[]
const ITEMS_PER_PAGE = 48

export function generateStaticParams() {
  const states = [...new Set(
    facilities.map(f => f.location?.state).filter(Boolean)
  )] as string[]
  return states.map(state => ({ state }))
}

interface SearchParams {
  q?: string
  type?: string
  railroad?: string
  sort?: string
  page?: string
}

interface PageProps {
  params: Promise<{ state: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state } = await params
  const stateName = getStateName(state)
  const count = facilities.filter(f => f.location?.state === state).length

  if (count === 0) return { title: 'State Not Found | Railhub' }

  return {
    title: `Rail Freight Facilities in ${stateName} (${state}) | Railhub`,
    description: `Browse ${count} rail freight facilities in ${stateName}. Find transload, storage, team track, and intermodal locations with railroad connections and capacity details.`,
  }
}

function getRailroadsForState(state: string): string[] {
  const names = new Set<string>()
  for (const f of facilities) {
    if (f.location?.state !== state) continue
    for (const r of f.railroads || []) {
      const name = r.railroad?.name
      if (name && name.length >= 2) names.add(name)
    }
  }
  return [...names].sort()
}

export default async function StatePage({ params, searchParams }: PageProps) {
  const { state } = await params
  const sp = await searchParams

  let filtered = facilities.filter(f => f.location?.state === state)
  if (filtered.length === 0) notFound()

  const totalForState = filtered.length
  const stateName = getStateName(state)

  if (sp.q) {
    const q = sp.q.toLowerCase()
    filtered = filtered.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.location?.city?.toLowerCase().includes(q)
    )
  }

  if (sp.type) {
    filtered = filtered.filter(f => f.type === sp.type?.toUpperCase())
  }

  if (sp.railroad) {
    const rr = sp.railroad.toLowerCase()
    filtered = filtered.filter(f =>
      f.railroads?.some(r => {
        const name = r.railroad?.name?.toLowerCase() ?? ''
        return name === rr || name.includes(rr) || rr.includes(name)
      })
    )
  }

  if (sp.sort) {
    filtered = [...filtered].sort((a, b) => {
      switch (sp.sort) {
        case 'name_asc': return (a.name || '').localeCompare(b.name || '')
        case 'name_desc': return (b.name || '').localeCompare(a.name || '')
        case 'capacity_desc': return (b.capabilities?.track_capacity || 0) - (a.capabilities?.track_capacity || 0)
        default: return 0
      }
    })
  }

  const rawPage = parseInt(sp.page || '1', 10)
  const currentPage = isNaN(rawPage) ? 1 : Math.max(1, rawPage)
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const page = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const railroads = getRailroadsForState(state)
  const basePath = `/state/${state}`

  return (
    <main>
      <a href="#main-results" className="skip-link">Skip to results</a>

      <header className="py-8 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{stateName}</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Rail Freight in {stateName}
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            {totalForState.toLocaleString()} facilities
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchFilters
          states={[]}
          railroads={railroads}
          totalResults={totalForState}
          filteredResults={filtered.length}
          basePath={basePath}
          hideStateFilter
        />

        <div id="main-results" className="mt-6" role="region" aria-label="Facility results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {page.map(facility => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          {page.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No facilities found</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Try removing some filters or searching a different term.
              </p>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={sp as { [key: string]: string | undefined }}
              basePath={basePath}
            />
          )}
        </div>
      </div>
    </main>
  )
}
