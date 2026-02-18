import facilitiesData from '@/data/facilities.json'
import { SearchFilters } from '@/components/search-filters'
import { FacilityCard } from '@/components/facility-card'
import { Stats } from '@/components/stats'

interface SearchParams {
  q?: string
  state?: string
  type?: string
}

async function getFacilities(searchParams: SearchParams) {
  let facilities = facilitiesData as any[]
  
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    facilities = facilities.filter(f => 
      f.name?.toLowerCase().includes(q) ||
      f.location?.city?.toLowerCase().includes(q) ||
      f.location?.state?.toLowerCase().includes(q)
    )
  }
  
  if (searchParams.state) {
    facilities = facilities.filter(f => f.location?.state === searchParams.state)
  }
  
  if (searchParams.type) {
    facilities = facilities.filter(f => f.type === searchParams.type.toUpperCase())
  }
  
  return facilities.slice(0, 100)
}

function getStats() {
  const transload = facilitiesData.filter(f => f.type === 'TRANSLOAD').length
  const storage = facilitiesData.filter(f => f.type === 'STORAGE').length
  return { transloadCount: transload, storageCount: storage, totalCount: facilitiesData.length }
}

function getStates() {
  const states = [...new Set(facilitiesData.map(f => f.location?.state).filter(Boolean))]
  return states.sort()
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams
  const [facilities, stats, states] = await Promise.all([
    getFacilities(params),
    getStats(),
    getStates(),
  ])

  return (
    <main className="min-h-screen">
      <header className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">🚂 Railhub</h1>
          <p className="text-xl opacity-90 mb-8">Free Rail Freight Directory</p>
          <Stats {...stats} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <SearchFilters states={states} />
        <div className="mt-8">
          <p className="text-gray-600 mb-4">Showing {facilities.length} facilities</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
          {facilities.length === 0 && (
            <div className="text-center py-12 text-gray-500">No facilities found.</div>
          )}
        </div>
      </div>
    </main>
  )
}