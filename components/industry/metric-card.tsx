import type { MetricWithTrend } from '@/lib/industry/types'
import { formatMetricType, formatMetricUnit } from '@/lib/industry/format'

interface MetricCardProps {
  metric: MetricWithTrend
}

export function MetricCard({ metric }: MetricCardProps) {
  const isPositive = metric.changePercent != null && metric.changePercent >= 0
  const trendColor = metric.metricType === 'TERMINAL_DWELL'
    ? (isPositive ? 'var(--badge-red-text)' : 'var(--badge-green-text)')
    : (isPositive ? 'var(--badge-green-text)' : 'var(--badge-red-text)')

  return (
    <div
      className="rounded-xl border p-4 transition hover:shadow-md"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            {formatMetricType(metric.metricType)}
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            {metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>
              {formatMetricUnit(metric.unit)}
            </span>
          </p>
        </div>
        {metric.changePercent != null && (
          <span
            className="text-sm font-semibold px-2 py-0.5 rounded-full"
            style={{ color: trendColor }}
          >
            {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
        {metric.railroad}
      </p>
    </div>
  )
}
