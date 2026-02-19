import facilitiesData from '../public/facilities.json'
import { SearchFilters } from '@/components/search-filters'
import { FacilityCard } from '@/components/facility-card'
import { Stats } from '@/components/stats'
import { Pagination } from '@/components/pagination'

interface SearchParams {
  q?: string
  state?: string
  type?: string
  railroad?: string
  sort?: string
  page?: string
}

const ITEMS_PER_PAGE = 48

async function getFacilities(searchParams: SearchParams) {
  let facilities = facilitiesData as any[]

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    facilities = facilities.filter((f: any) =>
      f.name?.toLowerCase().includes(q) ||
      f.location?.city?.toLowerCase().includes(q) ||
      f.location?.state?.toLowerCase().includes(q)
    )
  }

  if (searchParams.state) {
    facilities = facilities.filter((f: any) => f.location?.state === searchParams.state)
  }

  if (searchParams.type) {
    facilities = facilities.filter((f: any) => f.type === searchParams.type?.toUpperCase())
  }

  if (searchParams.railroad) {
    const rr = searchParams.railroad.toLowerCase()
    facilities = facilities.filter((f: any) =>
      f.railroads?.some((r: any) => {
        const name = r.railroad?.name?.toLowerCase() ?? ''
        return name === rr || name.includes(rr) || rr.includes(name)
      })
    )
  }

  if (searchParams.sort) {
    const sort = searchParams.sort
    facilities = [...facilities].sort((a: any, b: any) => {
      switch (sort) {
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '')
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '')
        case 'state':
          return (a.location?.state || '').localeCompare(b.location?.state || '')
        case 'capacity_desc': {
          const capA = a.capabilities?.track_capacity || 0
          const capB = b.capabilities?.track_capacity || 0
          return capB - capA
        }
        default:
          return 0
      }
    })
  }

  return facilities
}

function getStats() {
  const counts: { [key: string]: number } = {}
  facilitiesData.forEach((f: any) => {
    counts[f.type] = (counts[f.type] || 0) + 1
  })
  return { counts, totalCount: facilitiesData.length }
}

function getStates(): string[] {
  const states = [...new Set(facilitiesData.map((f: any) => f.location?.state).filter(Boolean))] as string[]
  return states.sort()
}

function getRailroads(): string[] {
  const names = new Set<string>()
  for (const f of facilitiesData as any[]) {
    if (!f.railroads) continue
    for (const r of f.railroads) {
      const name = r.railroad?.name
      if (name && name.length >= 2) names.add(name)
    }
  }
  return [...names].sort()
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const allFacilities = await getFacilities(params)

  const rawPage = parseInt(params.page || '1', 10)
  const currentPage = isNaN(rawPage) ? 1 : Math.max(1, rawPage)
  const totalPages = Math.ceil(allFacilities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const facilities = allFacilities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const stats = getStats()
  const states = getStates()
  const railroads = getRailroads()

  return (
    <main className="min-h-screen">
      <a href="#main-results" className="skip-link">
        Skip to results
      </a>

      <header className="py-10 px-4" style={{ background: 'linear-gradient(135deg, rgba(230,81,0,0.1) 0%, transparent 50%, rgba(230,81,0,0.05) 100%)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3">
            <span aria-hidden="true">🚂 </span>Railhub
          </h1>
          <p className="text-lg opacity-90 mb-6" style={{ color: 'var(--text-secondary)' }}>Free Rail Freight Directory</p>
          <Stats {...stats} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchFilters
          states={states}
          railroads={railroads}
          totalResults={facilitiesData.length}
          filteredResults={allFacilities.length}
        />

        <div id="main-results" className="mt-6" role="region" aria-label="Facility results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility: any) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>

          {facilities.length === 0 && (
            <div className="text-center py-20">
              <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No facilities found</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Try removing some filters or searching a different term.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Popular:</span>
                {['Transload', 'Storage', 'Texas', 'Ohio', 'BNSF'].map((term) => (
                  <a
                    key={term}
                    href={`/?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1 rounded-full transition hover:opacity-80"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params as { [key: string]: string | undefined }}
            />
          )}
        </div>
      </div>
    </main>
  )
}
