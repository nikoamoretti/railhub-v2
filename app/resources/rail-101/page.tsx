import type { Metadata } from 'next'
import Link from 'next/link'
import rail101Data from '@/public/data/rail-101.json'
import type { Rail101Data } from '@/lib/resource-types'
import { TableOfContents } from '@/components/resources/table-of-contents'

export const metadata: Metadata = {
  title: 'Rail Freight 101 — Beginner Guide to Shipping by Rail | Railhub',
  description: 'A beginner-friendly introduction to rail freight. Learn about railcar types, pricing, the shipping process, transloading, demurrage, and how to get started.',
}

const data = rail101Data as Rail101Data

export default function Rail101Page() {
  const tocItems = data.sections
    .sort((a, b) => a.order - b.order)
    .map(s => ({ id: s.id, title: s.title }))

  return (
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Rail 101</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {data.title}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {data.subtitle}
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
          <div className="flex-1 min-w-0 space-y-12">
            {data.sections.sort((a, b) => a.order - b.order).map((section, idx) => (
              <section key={section.id} id={section.id}>
                <h2
                  className="text-2xl font-bold mb-4 scroll-mt-20"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span style={{ color: 'var(--accent-text)' }}>{idx + 1}. </span>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.content.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.keyTakeaways && section.keyTakeaways.length > 0 && (
                  <div
                    className="mt-6 rounded-xl border p-5"
                    style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--accent-border)' }}
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-text)' }}>
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2">
                      {section.keyTakeaways.map((takeaway, i) => (
                        <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          &bull; {takeaway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
