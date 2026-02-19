import type { Metadata } from 'next'
import Link from 'next/link'
import guidesData from '@/public/data/guides.json'
import type { Guide } from '@/lib/resource-types'

export const metadata: Metadata = {
  title: 'Rail Freight How-To Guides | Railhub',
  description: 'Practical guides for shipping by rail. Learn how to dispute demurrage, file rate complaints, choose transload providers, and more.',
}

const guides = guidesData as Guide[]

const categoryBadges: Record<string, { bg: string; border: string; text: string }> = {
  Regulatory: { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  Commercial: { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  Shipping: { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
}

export default function GuidesPage() {
  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li>
                <Link href="/resources" style={{ color: 'var(--accent-text)' }} className="hover:underline">Resources</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Guides</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            How-To Guides
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Practical, step-by-step guides for navigating rail freight shipping.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guides.map(guide => {
            const badge = categoryBadges[guide.category] || categoryBadges.Commercial
            return (
              <Link
                key={guide.slug}
                href={`/resources/guides/${guide.slug}`}
                className="block"
              >
                <article
                  className="rounded-xl border p-6 h-full transition hover:border-[var(--accent)] hover:shadow-lg"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="badge"
                      style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                    >
                      {guide.category}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {guide.readingTimeMin} min read
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {guide.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {guide.excerpt}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {guide.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'var(--badge-gray-bg)', color: 'var(--badge-gray-text)', border: '1px solid var(--badge-gray-border)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
