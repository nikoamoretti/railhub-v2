import Link from 'next/link'
import type { RegulatoryUpdate } from '@prisma/client'
import { AgencyBadge } from './agency-badge'
import { formatRelativeTime } from '@/lib/industry/format'

interface RegulatoryCardProps {
  update: RegulatoryUpdate
}

export function RegulatoryCard({ update }: RegulatoryCardProps) {
  return (
    <Link href={`/regulatory/${update.slug}`} className="block">
      <article className="facility-card">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <AgencyBadge agency={update.agency} />
            <span
              className="badge"
              style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}
            >
              {update.updateType}
            </span>
          </div>
          {update.docketNumber && (
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              {update.docketNumber}
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {update.title}
        </h3>

        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {update.summary}
        </p>

        <div className="card-divider" />

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>{formatRelativeTime(update.publishedAt)}</span>
          <span style={{ color: 'var(--accent-text)' }}>Read more &rarr;</span>
        </div>
      </article>
    </Link>
  )
}
