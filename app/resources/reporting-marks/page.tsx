import type { Metadata } from 'next'
import Link from 'next/link'
import marksData from '@/public/data/reporting-marks.json'
import type { ReportingMark } from '@/lib/resource-types'
import { MarksBrowser } from './marks-browser'

export const metadata: Metadata = {
  title: 'Railroad Reporting Mark Directory | Railhub',
  description: 'Look up 200+ railroad reporting marks. Searchable directory of Class I carriers, shortlines, terminal railroads, and leasing companies.',
}

const marks = marksData as ReportingMark[]
const types = [...new Set(marks.map(m => m.type))].sort()

export default function ReportingMarksPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Reporting Marks</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Reporting Mark Directory
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {marks.length} reporting marks for railroads, leasing companies, and private car owners.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <MarksBrowser marks={marks} types={types} />
      </div>
    </main>
  )
}
