import type { Metadata } from 'next'
import Link from 'next/link'
import { getLatestMetrics } from '@/lib/industry/queries'
import { MetricTable } from '@/components/industry/metric-table'
import { DataFreshness } from '@/components/industry/data-freshness'
import { formatReportWeek } from '@/lib/industry/format'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Rail Service Metrics | Railhub',
  description: 'Weekly railroad performance metrics including train speed, terminal dwell time, carloads originated, and intermodal volume by Class I railroad.',
}

export default async function MetricsPage() {
  const metrics = await getLatestMetrics()

  const reportWeek = metrics.length > 0
    ? formatReportWeek(metrics[0].reportWeek)
    : undefined

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/industry" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Industry Data</Link>
            <span>/</span>
            <span>Service Metrics</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rail Service Metrics
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Weekly performance data from Class I railroads, sourced from USDA/STB reports.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <MetricTable metrics={metrics} reportWeek={reportWeek} />
        </div>

        {reportWeek && (
          <div className="mt-4">
            <DataFreshness lastUpdated={metrics[0]?.createdAt || null} />
          </div>
        )}
      </div>
    </main>
  )
}
