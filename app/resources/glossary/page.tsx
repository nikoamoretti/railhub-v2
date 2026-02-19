import type { Metadata } from 'next'
import Link from 'next/link'
import glossaryData from '@/public/data/glossary.json'
import type { GlossaryTerm } from '@/lib/resource-types'
import { GlossaryBrowser } from './glossary-browser'

export const metadata: Metadata = {
  title: 'Rail Freight Glossary — A-Z Terminology | Railhub',
  description: 'Searchable glossary of 150+ rail freight terms, acronyms, and definitions. From demurrage to DPU, learn the language of railroad shipping.',
}

const glossary = glossaryData as GlossaryTerm[]
const categories = [...new Set(glossary.map(t => t.category))].sort()

export default function GlossaryPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Glossary</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rail Freight Glossary
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {glossary.length} terms covering operations, equipment, regulations, and more.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <GlossaryBrowser terms={glossary} categories={categories} />
      </div>
    </main>
  )
}
