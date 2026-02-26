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
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/industry/advisories"
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
            { type: 'EMBARGO', label: 'Embargoes' },
            { type: 'SERVICE_ALERT', label: 'Service Alerts' },
            { type: 'WEATHER_ADVISORY', label: 'Weather' },
            { type: 'MAINTENANCE_NOTICE', label: 'Maintenance' },
          ].map((f) => (
            <Link
              key={f.type}
              href={`/industry/advisories?type=${f.type}`}
              className="px-3 py-1.5 rounded-full text-sm transition"
              style={{
                background: advisoryType === f.type ? 'var(--accent-muted)' : 'var(--bg-card)',
                color: advisoryType === f.type ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: advisoryType === f.type ? 'var(--accent-border)' : 'var(--border-default)',
              }}
            >
              {f.label}
            </Link>
          ))}
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
              {advisoryType ? 'Try removing the filter to see all advisories.' : 'Advisories will appear after the cron jobs run.'}
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
