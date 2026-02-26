import type { Metadata } from 'next'
import Link from 'next/link'
import { getIndustryStats, getLatestMetrics, getActiveAdvisories, getLatestFuelSurcharges } from '@/lib/industry/queries'
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
  const [stats, metrics, { advisories }, fuelSurcharges] = await Promise.all([
    getIndustryStats(),
    getLatestMetrics(),
    getActiveAdvisories({ page: 1 }),
    getLatestFuelSurcharges(),
  ])

  // Show top metrics (one per type, first railroad)
  const seenTypes = new Set<string>()
  const topMetrics = metrics.filter((m) => {
    if (seenTypes.has(m.metricType)) return false
    seenTypes.add(m.metricType)
    return true
  }).slice(0, 4)

  const topAdvisories = advisories.slice(0, 6)

  // Deduplicate fuel surcharges: one row per railroad (carload)
  const fuelByRailroad = new Map<string, typeof fuelSurcharges[0]>()
  for (const s of fuelSurcharges) {
    if (s.trafficType === 'Carload' && !fuelByRailroad.has(s.railroad)) {
      fuelByRailroad.set(s.railroad, s)
    }
  }
  const topFuel = [...fuelByRailroad.values()].slice(0, 6)

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
            { href: '/industry/metrics', label: 'Service Metrics', desc: 'Train speed, dwell time, carloads', icon: '📊', accent: 'var(--badge-blue-text)', accentBg: 'var(--badge-blue-bg)' },
            { href: '/industry/fuel-surcharges', label: 'Fuel Surcharges', desc: 'Carrier rate comparison', icon: '⛽', accent: 'var(--badge-green-text)', accentBg: 'var(--badge-green-bg)' },
            { href: '/industry/advisories', label: 'Advisories', desc: 'Embargoes & service alerts', icon: '⚠️', accent: 'var(--badge-orange-text)', accentBg: 'var(--badge-orange-bg)' },
            { href: '/industry/freight-trends', label: 'Freight Trends', desc: 'Carloads, intermodal & indices', icon: '📈', accent: 'var(--badge-cyan-text)', accentBg: 'var(--badge-cyan-bg)' },
            { href: '/regulatory', label: 'Regulatory', desc: 'STB, FRA, PHMSA updates', icon: '📋', accent: 'var(--badge-purple-text)', accentBg: 'var(--badge-purple-bg)' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border p-5 transition hover:shadow-lg group"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg mb-3"
                style={{ background: link.accentBg }}
              >
                {link.icon}
              </div>
              <h3 className="font-semibold group-hover:underline" style={{ color: link.accent }}>{link.label}</h3>
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

        {/* Fuel Surcharges snapshot */}
        {topFuel.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Fuel Surcharges</h2>
              <Link href="/industry/fuel-surcharges" className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                View all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {topFuel.map((s) => (
                <div
                  key={s.railroad}
                  className="rounded-xl border p-4 text-center"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                >
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    {s.railroad}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--badge-green-text)' }}>
                    {s.surchargeRate}%
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Carload
                  </p>
                </div>
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
