import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getRegulatoryBySlug } from '@/lib/industry/queries'
import { AgencyBadge } from '@/components/regulatory/agency-badge'
import { formatAgency, formatReportWeek } from '@/lib/industry/format'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const update = await getRegulatoryBySlug(slug)
  if (!update) return { title: 'Update Not Found | Railhub' }

  return {
    title: `${update.title} | Railhub`,
    description: update.summary.slice(0, 160),
  }
}

export default async function RegulatoryDetailPage({ params }: PageProps) {
  const { slug } = await params
  const update = await getRegulatoryBySlug(slug)

  if (!update) notFound()

  return (
    <main>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/regulatory" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Regulatory</Link>
          <span>/</span>
          <span>{update.agency}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <AgencyBadge agency={update.agency} />
          <span
            className="badge"
            style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}
          >
            {update.updateType}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {update.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          <span>{formatAgency(update.agency)}</span>
          <span>Published: {formatReportWeek(update.publishedAt)}</span>
          {update.docketNumber && (
            <span className="font-mono">Docket: {update.docketNumber}</span>
          )}
        </div>

        <div
          className="rounded-xl border p-6 mb-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Summary</h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {update.summary}
          </p>

          {update.content && (
            <>
              <h2 className="font-semibold mt-6 mb-3" style={{ color: 'var(--text-primary)' }}>Full Text</h2>
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {update.content}
              </div>
            </>
          )}
        </div>

        {update.documentUrl && (
          <a
            href={update.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium mb-6"
            style={{ color: 'var(--accent-text)' }}
          >
            View original document &rarr;
          </a>
        )}

        <div className="mt-4">
          <Link
            href="/regulatory"
            className="text-sm font-medium"
            style={{ color: 'var(--accent-text)' }}
          >
            &larr; Back to regulatory updates
          </Link>
        </div>
      </div>
    </main>
  )
}
