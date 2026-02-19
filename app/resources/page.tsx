import type { Metadata } from 'next'
import Link from 'next/link'
import { ResourceCard } from '@/components/resources/resource-card'

export const metadata: Metadata = {
  title: 'Rail Freight Resources & Education | Railhub',
  description: 'Learn about rail freight with glossaries, car type guides, reporting marks, commodity codes, interchange rules, and how-to guides for shippers and logistics professionals.',
}

const SECTIONS = [
  {
    href: '/resources/glossary',
    title: 'Rail Freight Glossary',
    description: 'A-Z definitions of rail freight terminology, acronyms, and industry jargon.',
    count: '150+ terms',
    icon: '\u{1F4D6}',
  },
  {
    href: '/resources/car-types',
    title: 'Railcar Type Guide',
    description: 'AAR mechanical designations with dimensions, capacities, and commodity compatibility.',
    count: '20 car types',
    icon: '\u{1F683}',
  },
  {
    href: '/resources/reporting-marks',
    title: 'Reporting Mark Directory',
    description: 'Look up railroad reporting marks for Class I carriers, shortlines, and leasing companies.',
    count: '200+ marks',
    icon: '\u{1F3F7}\uFE0F',
  },
  {
    href: '/resources/commodity-codes',
    title: 'Commodity Code Browser',
    description: 'Browse STCC commodity codes with NMFC cross-references used in rail freight classification.',
    count: '49 groups',
    icon: '\u{1F4E6}',
  },
  {
    href: '/resources/interchange-rules',
    title: 'Interchange Rules',
    description: 'Summaries of AAR interchange rules covering car hire, maintenance, and liability.',
    count: '15+ rules',
    icon: '\u{2696}\uFE0F',
  },
  {
    href: '/resources/guides',
    title: 'How-To Guides',
    description: 'Step-by-step guides for shipping by rail, disputing charges, and choosing providers.',
    count: '6 guides',
    icon: '\u{1F4CB}',
  },
  {
    href: '/resources/rail-101',
    title: 'Rail Freight 101',
    description: 'A beginner-friendly introduction to rail freight covering pricing, equipment, and process.',
    count: '8 sections',
    icon: '\u{1F393}',
  },
]

export default function ResourcesHub() {
  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center justify-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Resources</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Resources &amp; Education
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to understand rail freight — from terminology and equipment to regulations and best practices.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SECTIONS.map(section => (
            <ResourceCard key={section.href} {...section} />
          ))}
        </div>
      </div>
    </main>
  )
}
