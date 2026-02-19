import facilitiesData from '../public/facilities.json'
import { SearchFilters } from '@/components/search-filters'
import { FacilityCard } from '@/components/facility-card'
import { Stats } from '@/components/stats'
import { Pagination } from '@/components/pagination'

interface SearchParams {
  q?: string
  state?: string
  type?: string
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

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const allFacilities = await getFacilities(params)

  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const totalPages = Math.ceil(allFacilities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const facilities = allFacilities.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const [stats, states] = await Promise.all([
    getStats(),
    getStates(),
  ])

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
          <p className="text-lg opacity-90 mb-6" style={{ color: '#c0c0c0' }}>Free Rail Freight Directory</p>
          <Stats {...stats} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchFilters
          states={states}
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
            <div className="text-center py-16">
              <p className="text-lg mb-2" style={{ color: '#c0c0c0' }}>No facilities found</p>
              <p className="text-sm mb-4" style={{ color: '#808080' }}>
                Try removing some filters or searching a different term.
              </p>
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
