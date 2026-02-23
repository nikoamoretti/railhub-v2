import type { Metadata } from 'next'
import Link from 'next/link'
import { getIndustryStats, getLatestMetrics, getActiveAdvisories } from '@/lib/industry/queries'
import { IndustryStatsBar } from '@/components/industry/industry-stats'
import { DataFreshness } from '@/components/industry/data-freshness'
import { MetricCard } from '@/components/industry/metric-card'
import { AdvisoryCard } from '@/components/industry/advisory-card'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Industry Data & Market Intelligence | Railhub',
  description: 'Live rail industry metrics, fuel surcharges, service advisories, and regulatory updates from Class I railroads and government agencies.',
}

export default async function IndustryPage() {
  const [stats, metrics, { advisories }] = await Promise.all([
    getIndustryStats(),
    getLatestMetrics(),
    getActiveAdvisories({ page: 1 }),
  ])

  // Show top metrics (one per type, first railroad)
  const seenTypes = new Set<string>()
  const topMetrics = metrics.filter((m) => {
    if (seenTypes.has(m.metricType)) return false
    seenTypes.add(m.metricType)
    return true
  }).slice(0, 4)

  const topAdvisories = advisories.slice(0, 3)

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Industry Data
          </h1>
          <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
            Live rail performance metrics and market intelligence
          </p>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Auto-updated from USDA, STB, FRA, and Class I railroad sources.
          </p>
          <IndustryStatsBar stats={stats} />
          <div className="mt-3">
            <DataFreshness lastUpdated={stats.lastUpdated} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { href: '/industry/metrics', label: 'Service Metrics', desc: 'Train speed, dwell time, carloads' },
            { href: '/industry/fuel-surcharges', label: 'Fuel Surcharges', desc: 'Carrier rate comparison' },
            { href: '/industry/advisories', label: 'Advisories', desc: 'Embargoes & service alerts' },
            { href: '/regulatory', label: 'Regulatory', desc: 'STB, FRA, PHMSA updates' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border p-5 transition hover:border-[var(--accent)] hover:shadow-md"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{link.label}</h3>
              <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* Top Metrics */}
        {topMetrics.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Latest Metrics</h2>
              <Link href="/industry/metrics" className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topMetrics.map((m) => (
                <MetricCard key={m.id} metric={m} />
              ))}
            </div>
          </section>
        )}

        {/* Active Advisories */}
        {topAdvisories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Active Advisories</h2>
              <Link href="/industry/advisories" className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topAdvisories.map((a) => (
                <AdvisoryCard key={a.id} advisory={a} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {topMetrics.length === 0 && topAdvisories.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No data yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Industry data will populate automatically after the cron jobs run.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
