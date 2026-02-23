import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAdvisoryBySlug } from '@/lib/industry/queries'
import { AdvisoryBadge } from '@/components/industry/advisory-badge'
import { formatRelativeTime, formatReportWeek } from '@/lib/industry/format'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const advisory = await getAdvisoryBySlug(slug)
  if (!advisory) return { title: 'Advisory Not Found | Railhub' }

  return {
    title: `${advisory.title} | Railhub`,
    description: advisory.description.slice(0, 160),
  }
}

export default async function AdvisoryDetailPage({ params }: PageProps) {
  const { slug } = await params
  const advisory = await getAdvisoryBySlug(slug)

  if (!advisory) notFound()

  return (
    <main>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/industry" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Industry Data</Link>
          <span>/</span>
          <Link href="/industry/advisories" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Advisories</Link>
          <span>/</span>
          <span>{advisory.railroad}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <AdvisoryBadge type={advisory.advisoryType} />
          <span
            className="badge"
            style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}
          >
            {advisory.railroad}
          </span>
          {!advisory.isActive && (
            <span className="badge" style={{ background: 'var(--badge-red-bg)', borderColor: 'var(--badge-red-border)', color: 'var(--badge-red-text)' }}>
              Expired
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {advisory.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          <span>Issued: {formatReportWeek(advisory.issuedAt)}</span>
          {advisory.expiresAt && (
            <span>Expires: {formatReportWeek(advisory.expiresAt)}</span>
          )}
          {advisory.affectedArea && (
            <span>Area: {advisory.affectedArea}</span>
          )}
        </div>

        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <div
            className="prose max-w-none text-sm leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text-secondary)' }}
          >
            {advisory.description}
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/industry/advisories"
            className="text-sm font-medium"
            style={{ color: 'var(--accent-text)' }}
          >
            &larr; Back to advisories
          </Link>
        </div>
      </div>
    </main>
  )
}
