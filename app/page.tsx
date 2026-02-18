import facilitiesData from '../public/facilities.json'
import { SearchFilters } from '@/components/search-filters'
import { FacilityCard } from '@/components/facility-card'
import { Stats } from '@/components/stats'
import Link from 'next/link'

interface SearchParams {
  q?: string
  state?: string
  type?: string
  page?: string
}

const ITEMS_PER_PAGE = 24

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
  
  // Pagination
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const totalPages = Math.ceil(allFacilities.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const facilities = allFacilities.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  
  const [stats, states] = await Promise.all([
    getStats(),
    getStates(),
  ])

  const hasFilters = params.q || params.state || params.type

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
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Showing {facilities.length} of {allFacilities.length} facilities
              {hasFilters && ' (filtered)'}
            </p>
            {hasFilters && (
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear filters
              </Link>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility: any) => (
              <FacilityCard key={facility.id} facility={facility} />
            ))}
          </div>
          
          {facilities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">No facilities found.</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={{ 
                    pathname: '/', 
                    query: { ...params, page: currentPage - 1 } 
                  }}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                >
                  ← Previous
                </Link>
              )}
              
              <span className="px-4 py-2 text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Link
                  href={{ 
                    pathname: '/', 
                    query: { ...params, page: currentPage + 1 } 
                  }}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}