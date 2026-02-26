import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRailroadDetail } from '@/lib/railroads/queries'
import { getAllRailroadSlugs } from '@/lib/railroads'
import { FacilityCard } from '@/components/facility-card'
import { JobCard } from '@/components/jobs/job-card'
import { SearchFilters } from '@/components/search-filters'
import { Pagination } from '@/components/pagination'
import { TYPE_LABEL_MAP_LOWER } from '@/lib/facility-types'

const ITEMS_PER_PAGE = 48

export function generateStaticParams() {
  return getAllRailroadSlugs().map(slug => ({ slug }))
}

interface SearchParams {
  tab?: string
  q?: string
  type?: string
  sort?: string
  page?: string
}

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rr = getRailroadDetail(slug)
  if (!rr) return { title: 'Railroad Not Found | Railhub' }
  return {
    title: `${rr.meta.name} — Facilities & Jobs | Railhub`,
    description: `Browse ${rr.facilityCount.toLocaleString()} rail freight facilities served by ${rr.meta.name} across ${rr.stateCount} states. ${rr.jobCount} open positions.`,
  }
}

const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }

export default async function RailroadPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams

  const rr = getRailroadDetail(slug)
  if (!rr) notFound()

  const activeTab = sp.tab === 'jobs' ? 'jobs' : sp.tab === 'service-area' ? 'service-area' : 'facilities'
  const basePath = `/railroad/${slug}`

  // Filter facilities
  let filtered = [...rr.facilities]
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
  if (sp.sort) {
    filtered = [...filtered].sort((a, b) => {
      switch (sp.sort) {
        case 'name_asc': return (a.name || '').localeCompare(b.name || '')
        case 'name_desc': return (b.name || '').localeCompare(a.name || '')
        case 'capacity_desc': return (b.capabilities?.track_capacity || 0) - (a.capabilities?.track_capacity || 0)
        case 'rating_desc': {
          const rA = a.google_rating ?? 0
          const rB = b.google_rating ?? 0
          if (rB !== rA) return rB - rA
          return (b.google_review_count ?? 0) - (a.google_review_count ?? 0)
        }
        default: return 0
      }
    })
  }

  const currentPage = Math.max(1, parseInt(sp.page || '1', 10) || 1)
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const tabs = [
    { key: 'facilities', label: `Facilities (${rr.facilityCount.toLocaleString()})`, href: basePath },
    { key: 'jobs', label: `Jobs (${rr.jobCount})`, href: `${basePath}?tab=jobs` },
    { key: 'service-area', label: `Service Area (${rr.stateCount})`, href: `${basePath}?tab=service-area` },
  ]

  return (
    <main>
      {/* Header */}
      <header
        className="py-8 px-4"
        style={{
          background: `linear-gradient(135deg, ${rr.meta.accentColor}18 0%, transparent 60%)`,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li>
                <Link href="/railroads" style={{ color: 'var(--accent-text)' }} className="hover:underline">Railroads</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{rr.meta.shortName}</li>
            </ol>
          </nav>

          <div className="flex items-start gap-4">
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: rr.meta.accentColor }}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge" style={{
                  background: 'var(--badge-blue-bg)',
                  borderColor: 'var(--badge-blue-border)',
                  color: 'var(--badge-blue-text)',
                }}>
                  {rr.meta.tier === 'class1' ? 'Class I' : 'Regional'}
                </span>
                {rr.meta.hq && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    HQ: {rr.meta.hq}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {rr.meta.name}
              </h1>
              <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                {rr.meta.description}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-5">
            {[
              { label: 'Facilities', value: rr.facilityCount.toLocaleString() },
              { label: 'States', value: rr.stateCount.toString() },
              { label: 'Open Jobs', value: rr.jobCount.toString() },
            ].map(({ label, value }) => (
              <div key={label} className="text-sm">
                <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          {tabs.map(tab => (
            <Link
              key={tab.key}
              href={tab.href}
              className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition"
              style={{
                borderColor: activeTab === tab.key ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.key ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Facilities tab */}
        {activeTab === 'facilities' && (
          <>
            <SearchFilters
              states={[]}
              railroads={[]}
              totalResults={rr.facilityCount}
              filteredResults={filtered.length}
              basePath={basePath}
              hideStateFilter
            />

            {/* Facility type breakdown */}
            {rr.facilityTypes.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-4 mb-2">
                {rr.facilityTypes.slice(0, 8).map(ft => (
                  <Link
                    key={ft.type}
                    href={`${basePath}?type=${ft.type.toLowerCase()}`}
                    className="badge transition hover:opacity-80"
                    style={{
                      background: sp.type?.toUpperCase() === ft.type ? 'var(--accent-muted)' : 'var(--badge-gray-bg)',
                      borderColor: sp.type?.toUpperCase() === ft.type ? 'var(--accent-border)' : 'var(--badge-gray-border)',
                      color: sp.type?.toUpperCase() === ft.type ? 'var(--accent-text)' : 'var(--badge-gray-text)',
                    }}
                  >
                    {TYPE_LABEL_MAP_LOWER[ft.type.toLowerCase()] || ft.type.replace(/_/g, ' ')} ({ft.count})
                  </Link>
                ))}
              </div>
            )}

            <div id="main-results" className="mt-4" role="region" aria-label="Facility results">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paged.map(facility => (
                  <FacilityCard key={facility.id} facility={facility} />
                ))}
              </div>

              {paged.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No facilities found</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Try removing some filters or searching a different term.
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  searchParams={sp as Record<string, string | undefined>}
                  basePath={basePath}
                />
              )}
            </div>
          </>
        )}

        {/* Jobs tab */}
        {activeTab === 'jobs' && (
          <div>
            {rr.jobs.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No active job listings</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Check back later or browse <Link href="/jobs" style={{ color: 'var(--accent-text)' }} className="hover:underline">all railroad jobs</Link>.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {rr.jobs.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Service area tab */}
        {activeTab === 'service-area' && (
          <div>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              {rr.meta.name} serves facilities in {rr.stateCount} states and provinces.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {rr.states.map(s => (
                <Link
                  key={s.code}
                  href={`/state/${s.code}?railroad=${rr.meta.shortName}`}
                  className="rounded-xl border p-4 text-center transition hover:border-[var(--accent)] hover:shadow-md"
                  style={cardStyle}
                >
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{s.code}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.name}</div>
                  <div className="text-xs mt-1 font-medium" style={{ color: 'var(--accent-text)' }}>
                    {s.count} {s.count === 1 ? 'facility' : 'facilities'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
