import Link from 'next/link'
import facilitiesData from '../public/facilities.json'
import type { Facility } from '@/lib/types'
import { getStateName } from '@/lib/states'
import { getTypeLabel, getBadgeStyle } from '@/lib/facility-types'
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

const facilities_typed = facilitiesData as Facility[]

async function getFacilities(searchParams: SearchParams) {
  let facilities = [...facilities_typed]

  if (searchParams.q) {
    const q = searchParams.q.toLowerCase()
    facilities = facilities.filter((f) =>
      f.name?.toLowerCase().includes(q) ||
      f.location?.city?.toLowerCase().includes(q) ||
      f.location?.state?.toLowerCase().includes(q)
    )
  }

  if (searchParams.state) {
    facilities = facilities.filter((f) => f.location?.state === searchParams.state)
  }

  if (searchParams.type) {
    facilities = facilities.filter((f) => f.type === searchParams.type?.toUpperCase())
  }

  if (searchParams.railroad) {
    const rr = searchParams.railroad.toLowerCase()
    facilities = facilities.filter((f) =>
      f.railroads?.some((r) => {
        const name = r.railroad?.name?.toLowerCase() ?? ''
        return name === rr || name.includes(rr) || rr.includes(name)
      })
    )
  }

  if (searchParams.sort) {
    const sort = searchParams.sort
    facilities = [...facilities].sort((a, b) => {
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
        case 'rating_desc': {
          const rA = a.google_rating ?? 0
          const rB = b.google_rating ?? 0
          if (rB !== rA) return rB - rA
          return (b.google_review_count ?? 0) - (a.google_review_count ?? 0)
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
  facilities_typed.forEach((f) => {
    counts[f.type] = (counts[f.type] || 0) + 1
  })
  return { counts, totalCount: facilities_typed.length }
}

function getStates(): string[] {
  const states = [...new Set(facilities_typed.map((f) => f.location?.state).filter(Boolean))] as string[]
  return states.sort()
}

function getRailroads(): string[] {
  const names = new Set<string>()
  for (const f of facilities_typed) {
    if (!f.railroads) continue
    for (const r of f.railroads) {
      const name = r.railroad?.name
      if (name && name.length >= 2) names.add(name)
    }
  }
  return [...names].sort()
}

function getTopStates(n: number) {
  const counts = new Map<string, number>()
  for (const f of facilities_typed) {
    const st = f.location?.state
    if (st) counts.set(st, (counts.get(st) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([code, count]) => ({ code, name: getStateName(code), count }))
}

function getTopTypes(n: number) {
  const counts = new Map<string, number>()
  for (const f of facilities_typed) {
    counts.set(f.type, (counts.get(f.type) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([type, count]) => ({ type, label: getTypeLabel(type), badge: getBadgeStyle(type), count }))
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
  const hasFilters = !!(params.q || params.state || params.type || params.railroad)
  const topStates = getTopStates(12)
  const topTypes = getTopTypes(6)

  return (
    <main>
      <a href="#main-results" className="skip-link">
        Skip to results
      </a>

      <header className="py-10 px-4" style={{ background: 'linear-gradient(135deg, rgba(230,81,0,0.1) 0%, transparent 50%, rgba(230,81,0,0.05) 100%)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">
            <span aria-hidden="true">🚂 </span>Railhub
          </h1>
          <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>Free Rail Freight Directory</p>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Search {facilities_typed.length.toLocaleString()} rail-served facilities across North America.
            Find transload locations, team tracks, storage, and more.
          </p>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Link
              href="/states"
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
            >
              Browse by State
            </Link>
            <a
              href="#search-input"
              className="px-5 py-2.5 rounded-lg text-sm font-medium border transition hover:opacity-80"
              style={{
                backgroundColor: 'var(--accent-muted)',
                borderColor: 'var(--accent-border)',
                color: 'var(--accent-text)',
              }}
            >
              Search Facilities
            </a>
          </div>
          <Stats {...stats} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchFilters
          states={states}
          railroads={railroads}
          totalResults={facilities_typed.length}
          filteredResults={allFacilities.length}
        />

        <div id="main-results" className="mt-6" role="region" aria-label="Facility results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map((facility) => (
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

        {/* Browse sections — only on unfiltered homepage */}
        {!hasFilters && currentPage === 1 && (
          <>
            {/* Browse by State */}
            <section className="mt-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Browse by State
                </h2>
                <Link
                  href="/states"
                  className="text-sm font-medium transition hover:underline"
                  style={{ color: 'var(--accent-text)' }}
                >
                  View all states &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {topStates.map(s => (
                  <Link
                    key={s.code}
                    href={`/state/${s.code}`}
                    className="rounded-xl border p-3 text-center transition hover:border-[var(--accent)] hover:shadow-md"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                  >
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--accent-text)' }}>
                      {s.count.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Popular Facility Types */}
            <section className="mt-10 mb-4">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Popular Facility Types
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {topTypes.map(t => (
                  <Link
                    key={t.type}
                    href={`/?type=${t.type.toLowerCase()}`}
                    className="rounded-xl border p-4 text-center transition hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-default)',
                    }}
                  >
                    <span
                      className="badge"
                      style={{ background: t.badge.bg, borderColor: t.badge.border, color: t.badge.text }}
                    >
                      {t.label}
                    </span>
                    <div className="text-lg font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
                      {t.count.toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
