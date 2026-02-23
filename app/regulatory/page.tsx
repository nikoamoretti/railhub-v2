import type { Metadata } from 'next'
import Link from 'next/link'
import { getRegulatoryUpdates, ITEMS_PER_PAGE } from '@/lib/industry/queries'
import { RegulatoryCard } from '@/components/regulatory/regulatory-card'
import { Pagination } from '@/components/pagination'
import type { RegulatoryAgency } from '@prisma/client'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Regulatory & Compliance Updates | Railhub',
  description: 'Latest regulatory updates from STB, FRA, PHMSA, and AAR affecting the rail freight industry. Rulings, notices, data releases, and safety alerts.',
}

const VALID_AGENCIES = new Set(['STB', 'FRA', 'PHMSA', 'AAR'])

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function RegulatoryPage({ searchParams }: PageProps) {
  const params = await searchParams
  const agency = params.agency && VALID_AGENCIES.has(params.agency) ? params.agency as RegulatoryAgency : undefined
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)

  const { updates, total } = await getRegulatoryUpdates({ agency, page })
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Regulatory & Compliance
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Latest updates from federal agencies and industry organizations affecting rail freight.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Agency filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/regulatory"
            className="px-3 py-1.5 rounded-full text-sm transition"
            style={{
              background: !agency ? 'var(--accent-muted)' : 'var(--bg-card)',
              color: !agency ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: !agency ? 'var(--accent-border)' : 'var(--border-default)',
            }}
          >
            All
          </Link>
          {[
            { code: 'STB', label: 'STB' },
            { code: 'FRA', label: 'FRA' },
            { code: 'PHMSA', label: 'PHMSA' },
            { code: 'AAR', label: 'AAR' },
          ].map((a) => (
            <Link
              key={a.code}
              href={`/regulatory?agency=${a.code}`}
              className="px-3 py-1.5 rounded-full text-sm transition"
              style={{
                background: agency === a.code ? 'var(--accent-muted)' : 'var(--bg-card)',
                color: agency === a.code ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: agency === a.code ? 'var(--accent-border)' : 'var(--border-default)',
              }}
            >
              {a.label}
            </Link>
          ))}
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {updates.map((u) => (
            <RegulatoryCard key={u.id} update={u} />
          ))}
        </div>

        {updates.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No regulatory updates</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {agency ? 'Try removing the filter to see all updates.' : 'Updates will appear after the cron jobs run.'}
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            searchParams={params as Record<string, string | undefined>}
            basePath="/regulatory"
          />
        )}
      </div>
    </main>
  )
}
