import type { Metadata } from 'next'
import Link from 'next/link'
import codesData from '@/public/data/commodity-codes.json'
import type { CommodityGroup } from '@/lib/resource-types'
import { CommodityTree } from './commodity-tree'

export const metadata: Metadata = {
  title: 'STCC Commodity Code Browser — Rail Freight Classification | Railhub',
  description: 'Browse 49 STCC commodity code groups used in rail freight classification. Includes NMFC cross-references and hierarchical code navigation.',
}

const groups = codesData as CommodityGroup[]

export default function CommodityCodesPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Commodity Codes</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            STCC Commodity Code Browser
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {groups.length} major commodity groups with STCC codes and NMFC freight class cross-references.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <CommodityTree groups={groups} />
      </div>
    </main>
  )
}
