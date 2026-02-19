import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import guidesData from '@/public/data/guides.json'
import type { Guide } from '@/lib/resource-types'
import { TableOfContents } from '@/components/resources/table-of-contents'
import { SectionRenderer } from '@/components/resources/section-renderer'

const guides = guidesData as Guide[]

const categoryBadges: Record<string, { bg: string; border: string; text: string }> = {
  Regulatory: { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  Commercial: { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  Shipping: { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
}

export function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = guides.find(g => g.slug === slug)
  if (!guide) return { title: 'Guide Not Found | Railhub' }

  return {
    title: `${guide.title} | Railhub Guides`,
    description: guide.excerpt,
  }
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params
  const guide = guides.find(g => g.slug === slug)

  if (!guide) notFound()

  const tocItems = guide.sections.map(s => ({ id: s.id, title: s.heading }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    datePublished: guide.publishDate,
    publisher: {
      '@type': 'Organization',
      name: 'Railhub',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main>
        <header className="py-10 px-4 page-header-gradient">
          <div className="max-w-4xl mx-auto">
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
                <li>
                  <Link href="/resources/guides" style={{ color: 'var(--accent-text)' }} className="hover:underline">Guides</Link>
                </li>
                <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
                <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{guide.title}</li>
              </ol>
            </nav>

            <div className="flex items-center gap-3 mb-3">
              <span
                className="badge"
                style={{
                  background: (categoryBadges[guide.category] || categoryBadges.Commercial).bg,
                  borderColor: (categoryBadges[guide.category] || categoryBadges.Commercial).border,
                  color: (categoryBadges[guide.category] || categoryBadges.Commercial).text,
                }}
              >
                {guide.category}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {guide.readingTimeMin} min read
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {guide.title}
            </h1>
            <p className="text-lg mt-3" style={{ color: 'var(--text-secondary)' }}>
              {guide.excerpt}
            </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Sidebar TOC — desktop only */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <TableOfContents items={tocItems} />
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <SectionRenderer sections={guide.sections} />
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
