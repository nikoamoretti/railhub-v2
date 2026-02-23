import type { IndustryStats } from '@/lib/industry/types'

interface IndustryStatsBarProps {
  stats: IndustryStats
}

export function IndustryStatsBar({ stats }: IndustryStatsBarProps) {
  const items = [
    { label: 'Data Points', value: stats.totalMetrics.toLocaleString() },
    { label: 'Active Advisories', value: stats.totalAdvisories.toLocaleString() },
    { label: 'Embargoes', value: stats.activeEmbargoes.toLocaleString() },
  ]

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border px-5 py-3 text-center"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <div className="text-lg font-bold" style={{ color: 'var(--accent-text)' }}>
            {item.value}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
