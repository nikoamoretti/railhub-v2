import type { RegulatoryAgency } from '@/lib/industry/types'

interface AgencyBadgeProps {
  agency: RegulatoryAgency
}

const BADGE_STYLES: Record<RegulatoryAgency, { bg: string; border: string; text: string }> = {
  STB: { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  FRA: { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  PHMSA: { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  AAR: { bg: 'var(--badge-purple-bg)', border: 'var(--badge-purple-border)', text: 'var(--badge-purple-text)' },
}

export function AgencyBadge({ agency }: AgencyBadgeProps) {
  const style = BADGE_STYLES[agency] || BADGE_STYLES.FRA

  return (
    <span
      className="badge"
      style={{ background: style.bg, borderColor: style.border, color: style.text }}
    >
      {agency}
    </span>
  )
}
