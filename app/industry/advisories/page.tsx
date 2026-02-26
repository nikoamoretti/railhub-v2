import type { Metadata } from 'next'
import Link from 'next/link'
import { getActiveAdvisories, getAllActiveAdvisories, ITEMS_PER_PAGE } from '@/lib/industry/queries'
import { AdvisoryCard } from '@/components/industry/advisory-card'
import { AdvisoryMapSection } from '@/components/industry/advisory-map-section'
import { Pagination } from '@/components/pagination'
import type { AdvisoryType } from '@/lib/industry/types'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Service Advisories & Embargoes | Railhub',
  description: 'Active railroad embargoes, service alerts, weather advisories, and maintenance notices from BNSF, CSX, and other Class I carriers.',
}

const VALID_TYPES = new Set(['EMBARGO', 'SERVICE_ALERT', 'WEATHER_ADVISORY', 'MAINTENANCE_NOTICE'])
const CLASS_I_RAILROADS = ['BNSF', 'CSX', 'NS', 'UP', 'CN', 'CPKC'] as const

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function AdvisoriesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const advisoryType = params.type && VALID_TYPES.has(params.type) ? params.type as AdvisoryType : undefined
  const railroad = params.railroad || undefined
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)

  const [{ advisories, total }, allAdvisories] = await Promise.all([
    getActiveAdvisories({ railroad, advisoryType, page }),
    getAllActiveAdvisories(),
  ])
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  // Count advisories per railroad for filter pills
  const rrCounts = new Map<string, number>()
  for (const a of allAdvisories) {
    rrCounts.set(a.railroad, (rrCounts.get(a.railroad) || 0) + 1)
  }

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/industry" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Industry Data</Link>
            <span>/</span>
            <span>Advisories</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Service Advisories
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Active embargoes, service alerts, and operational notices from Class I railroads.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Type filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>Type</span>
          <Link
            href={railroad ? `/industry/advisories?railroad=${railroad}` : '/industry/advisories'}
            className="px-3 py-1.5 rounded-full text-sm transition"
            style={{
              background: !advisoryType ? 'var(--accent-muted)' : 'var(--bg-card)',
              color: !advisoryType ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: !advisoryType ? 'var(--accent-border)' : 'var(--border-default)',
            }}
          >
            All ({total})
          </Link>
          {[
            { type: 'EMBARGO', label: 'Embargoes', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
            { type: 'SERVICE_ALERT', label: 'Service Alerts', color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
            { type: 'WEATHER_ADVISORY', label: 'Weather', color: '#eab308', bg: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.35)' },
            { type: 'MAINTENANCE_NOTICE', label: 'Maintenance', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)' },
          ].map((f) => {
            const isActive = advisoryType === f.type
            const href = railroad
              ? `/industry/advisories?type=${f.type}&railroad=${railroad}`
              : `/industry/advisories?type=${f.type}`
            return (
              <Link
                key={f.type}
                href={href}
                className="px-3 py-1.5 rounded-full text-sm font-medium transition"
                style={{
                  background: isActive ? f.bg : 'var(--bg-card)',
                  color: isActive ? f.color : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? f.border : 'var(--border-default)',
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ background: f.color, opacity: isActive ? 1 : 0.5 }}
                />
                {f.label}
              </Link>
            )
          })}
        </div>

        {/* Railroad filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>Railroad</span>
          <Link
            href={advisoryType ? `/industry/advisories?type=${advisoryType}` : '/industry/advisories'}
            className="px-3 py-1.5 rounded-full text-sm transition"
            style={{
              background: !railroad ? 'var(--accent-muted)' : 'var(--bg-card)',
              color: !railroad ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: !railroad ? 'var(--accent-border)' : 'var(--border-default)',
            }}
          >
            All Railroads
          </Link>
          {CLASS_I_RAILROADS.filter(rr => rrCounts.has(rr)).map((rr) => {
            const href = advisoryType
              ? `/industry/advisories?type=${advisoryType}&railroad=${rr}`
              : `/industry/advisories?railroad=${rr}`
            return (
              <Link
                key={rr}
                href={href}
                className="px-3 py-1.5 rounded-full text-sm transition"
                style={{
                  background: railroad === rr ? 'var(--accent-muted)' : 'var(--bg-card)',
                  color: railroad === rr ? 'var(--accent-text)' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: railroad === rr ? 'var(--accent-border)' : 'var(--border-default)',
                }}
              >
                {rr} ({rrCounts.get(rr)})
              </Link>
            )
          })}
        </div>

        {/* Map + Filtered Card Grid */}
        <AdvisoryMapSection
          allAdvisories={allAdvisories}
          advisories={advisories}
        />

        {advisories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No active advisories</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {advisoryType || railroad ? 'Try removing filters to see all advisories.' : 'Advisories will appear after the cron jobs run.'}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={params as Record<string, string | undefined>}
            basePath="/industry/advisories"
          />
        )}
      </div>
    </main>
  )
}
