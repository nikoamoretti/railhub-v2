import type { MetricWithTrend } from '@/lib/industry/types'
import { formatMetricType, formatMetricUnit, formatReportWeek } from '@/lib/industry/format'

interface MetricTableProps {
  metrics: MetricWithTrend[]
  reportWeek?: string
}

export function MetricTable({ metrics, reportWeek }: MetricTableProps) {
  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No metrics available</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Data will appear after the first scrape runs.
        </p>
      </div>
    )
  }

  // Group by metric type
  const metricTypes = [...new Set(metrics.map((m) => m.metricType))]
  const railroads = [...new Set(metrics.map((m) => m.railroad))].sort()

  return (
    <div className="overflow-x-auto">
      {reportWeek && (
        <p className="text-sm mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Week of {reportWeek}
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderColor: 'var(--border-default)' }}>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Railroad
            </th>
            {metricTypes.map((type) => (
              <th key={type} className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
                {formatMetricType(type)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {railroads.map((railroad) => {
            const rrMetrics = metrics.filter((m) => m.railroad === railroad)
            return (
              <tr
                key={railroad}
                className="border-t transition hover:bg-[var(--bg-elevated)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                  {railroad}
                </td>
                {metricTypes.map((type) => {
                  const metric = rrMetrics.find((m) => m.metricType === type)
                  if (!metric) {
                    return (
                      <td key={type} className="text-right py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                        —
                      </td>
                    )
                  }

                  const isPositive = metric.changePercent != null && metric.changePercent >= 0
                  const trendColor = type === 'TERMINAL_DWELL'
                    ? (isPositive ? 'var(--badge-red-text)' : 'var(--badge-green-text)')
                    : (isPositive ? 'var(--badge-green-text)' : 'var(--badge-red-text)')

                  return (
                    <td key={type} className="text-right py-3 px-4">
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                        {formatMetricUnit(metric.unit)}
                      </span>
                      {metric.changePercent != null && (
                        <span className="text-xs ml-2" style={{ color: trendColor }}>
                          {metric.changePercent >= 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
