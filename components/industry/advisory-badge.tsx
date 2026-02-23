import type { AdvisoryType } from '@prisma/client'
import { formatAdvisoryType } from '@/lib/industry/format'

interface AdvisoryBadgeProps {
  type: AdvisoryType
}

const BADGE_STYLES: Record<AdvisoryType, { bg: string; border: string; text: string }> = {
  EMBARGO: { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  SERVICE_ALERT: { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  WEATHER_ADVISORY: { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
  MAINTENANCE_NOTICE: { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
}

export function AdvisoryBadge({ type }: AdvisoryBadgeProps) {
  const style = BADGE_STYLES[type] || BADGE_STYLES.SERVICE_ALERT

  return (
    <span
      className="badge"
      style={{ background: style.bg, borderColor: style.border, color: style.text }}
    >
      {formatAdvisoryType(type)}
    </span>
  )
}
