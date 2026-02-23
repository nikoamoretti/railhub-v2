import { formatRelativeTime } from '@/lib/industry/format'

interface DataFreshnessProps {
  lastUpdated: Date | null
}

export function DataFreshness({ lastUpdated }: DataFreshnessProps) {
  if (!lastUpdated) return null

  return (
    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
      Last updated {formatRelativeTime(lastUpdated)}
    </p>
  )
}
