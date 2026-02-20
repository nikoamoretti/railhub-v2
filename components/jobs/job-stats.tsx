import type { JobStats } from '@/lib/jobs/types'
import { formatJobType } from '@/lib/jobs/format'

interface JobStatsProps {
  stats: JobStats
}

export function JobStatsBar({ stats }: JobStatsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 stats-bar">
      <div
        className="px-4 py-2.5 rounded-lg text-center border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {stats.totalActive.toLocaleString()}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Active Jobs</div>
      </div>

      <div
        className="px-4 py-2.5 rounded-lg text-center border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        <div className="text-lg font-bold" style={{ color: 'var(--badge-green-text)' }}>
          {stats.newThisWeek.toLocaleString()}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>New This Week</div>
      </div>

      {stats.byType.slice(0, 3).map((t) => (
        <div
          key={t.type}
          className="px-4 py-2.5 rounded-lg text-center border"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {t.count.toLocaleString()}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formatJobType(t.type)}
          </div>
        </div>
      ))}
    </div>
  )
}
