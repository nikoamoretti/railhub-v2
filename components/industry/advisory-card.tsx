import Link from 'next/link'
import type { ServiceAdvisory } from '@/lib/industry/types'
import { AdvisoryBadge } from './advisory-badge'
import { formatRelativeTime } from '@/lib/industry/format'

interface AdvisoryCardProps {
  advisory: ServiceAdvisory
}

export function AdvisoryCard({ advisory }: AdvisoryCardProps) {
  return (
    <Link href={`/industry/advisories/${advisory.slug}`} className="block">
      <article className="facility-card advisory-card">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <AdvisoryBadge type={advisory.advisoryType} />
            <span
              className="badge"
              style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}
            >
              {advisory.railroad}
            </span>
          </div>
          {!advisory.isActive && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', background: 'var(--bg-elevated)' }}>
              Expired
            </span>
          )}
        </div>

        <h3 className="text-base font-semibold mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {advisory.title}
        </h3>

        <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
          {advisory.description}
        </p>

        {advisory.affectedArea && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {advisory.affectedArea}
          </p>
        )}

        <div className="card-divider" />

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span>Issued {formatRelativeTime(advisory.issuedAt)}</span>
          <span style={{ color: 'var(--accent-text)' }}>Details &rarr;</span>
        </div>
      </article>
    </Link>
  )
}
