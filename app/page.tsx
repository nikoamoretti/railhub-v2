import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import { FacilityCard } from '@/components/facility-card'
import { SearchFilters } from '@/components/search-filters'
import { Stats } from '@/components/stats'

async function getFacilities(searchParams: { [key: string]: string | string[] | undefined }) {
  const where: any = { status: 'ACTIVE' }
  
  if (searchParams.q) {
    where.OR = [
      { name: { contains: String(searchParams.q), mode: 'insensitive' } },
      { location: { city: { contains: String(searchParams.q), mode: 'insensitive' } } },
      { location: { state: { contains: String(searchParams.q), mode: 'insensitive' } } },
    ]
  }
  
  if (searchParams.state) {
    where.location = { ...where.location, state: String(searchParams.state) }
  }
  
  if (searchParams.type) {
    where.type = String(searchParams.type).toUpperCase()
  }
  
  const facilities = await prisma.facility.findMany({
    where,
    include: {
      location: true,
      capabilities: true,
      categories: { include: { category: true } },
      railroads: { include: { railroad: true } },
    },
    take: 100,
    orderBy: { name: 'asc' },
  })
  
  return facilities
}

async function getStats() {
  const [transloadCount, storageCount, totalCount] = await Promise.all([
    prisma.facility.count({ where: { type: 'TRANSLOAD', status: 'ACTIVE' } }),
    prisma.facility.count({ where: { type: 'STORAGE', status: 'ACTIVE' } }),
    prisma.facility.count({ where: { status: 'ACTIVE' } }),
  ])
  
  return { transloadCount, storageCount, totalCount }
}

async function getStates() {
  const locations = await prisma.location.findMany({
    select: { state: true },
    distinct: ['state'],
    orderBy: { state: 'asc' },
  })
  return locations.map(l => l.state)
}

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [facilities, stats, states] = await Promise.all([
    getFacilities(searchParams),
    getStats(),
    getStates(),
  ])

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">🚂 Railhub</h1>
          <p className="text-xl opacity-90 mb-8">
            Free Rail Freight Directory — Transload & Railcar Storage Facilities
          </p>
          <Stats {...stats} />
        </div>
      </header>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SearchFilters states={states} />
        
        {/* Results */}
        <div className="mt-8">
          <p className="text-gray-600 mb-4">
            Showing {facilities.length} facilities
          </p>
          
          <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <FacilityCard key={facility.id} facility={facility} />
              ))}
            </div>
          </Suspense>
          
          {facilities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No facilities found. Try adjusting your search.
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-gray-600">
        <p>Railhub — Free rail freight data for everyone</p>
      </footer>
    </main>
  )
}