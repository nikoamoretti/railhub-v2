import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import glossaryData from '@/public/data/glossary.json'
import type { GlossaryTerm } from '@/lib/resource-types'

const glossary = glossaryData as GlossaryTerm[]

export function generateStaticParams() {
  return glossary.map(t => ({ slug: t.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const term = glossary.find(t => t.slug === slug)
  if (!term) return { title: 'Term Not Found | Railhub' }

  const title = `${term.term}${term.abbreviation ? ` (${term.abbreviation})` : ''} — Rail Freight Glossary | Railhub`
  return {
    title,
    description: term.definition,
  }
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { slug } = await params
  const term = glossary.find(t => t.slug === slug)

  if (!term) notFound()

  const related = term.relatedTerms
    ?.map(s => glossary.find(t => t.slug === s))
    .filter(Boolean) as GlossaryTerm[] | undefined

  const sameCategoryTerms = glossary
    .filter(t => t.category === term.category && t.slug !== term.slug)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term.term,
    description: term.definition,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: 'Railhub Rail Freight Glossary',
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
          <div className="max-w-3xl mx-auto">
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
                  <Link href="/resources/glossary" style={{ color: 'var(--accent-text)' }} className="hover:underline">Glossary</Link>
                </li>
                <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
                <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{term.term}</li>
              </ol>
            </nav>

            <span
              className="badge mb-3"
              style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}
            >
              {term.category}
            </span>

            <h1 className="text-4xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>
              {term.term}
              {term.abbreviation && (
                <span className="ml-3 text-2xl font-normal" style={{ color: 'var(--accent-text)' }}>
                  ({term.abbreviation})
                </span>
              )}
            </h1>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
              Definition
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {term.definition}
            </p>
          </div>

          {related && related.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Related Terms
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map(r => (
                  <Link
                    key={r.slug}
                    href={`/resources/glossary/${r.slug}`}
                    className="rounded-xl border p-4 transition hover:border-[var(--accent)]"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {r.term}
                      {r.abbreviation && (
                        <span className="ml-1 font-normal" style={{ color: 'var(--accent-text)' }}>({r.abbreviation})</span>
                      )}
                    </h3>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {r.definition}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {sameCategoryTerms.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                More in {term.category}
              </h2>
              <div className="flex flex-wrap gap-2">
                {sameCategoryTerms.map(t => (
                  <Link
                    key={t.slug}
                    href={`/resources/glossary/${t.slug}`}
                    className="px-3 py-1.5 rounded-full text-sm border transition hover:border-[var(--accent)]"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
                  >
                    {t.term}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
