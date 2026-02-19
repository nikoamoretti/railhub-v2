import type { Metadata } from 'next'
import Link from 'next/link'
import carTypesData from '@/public/data/car-types.json'
import type { CarType } from '@/lib/resource-types'

export const metadata: Metadata = {
  title: 'AAR Railcar Type Guide — Dimensions & Specifications | Railhub',
  description: 'Complete guide to AAR railcar mechanical designations. Compare dimensions, capacities, and commodity compatibility for boxcars, hoppers, tank cars, and more.',
}

const carTypes = carTypesData as CarType[]

export default function CarTypesPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Car Types</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Railcar Type Guide
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {carTypes.length} AAR mechanical designations with dimensions, capacities, and commodity compatibility.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {carTypes.map(ct => (
            <Link
              key={ct.designation}
              href={`/resources/car-types/${ct.designation}`}
              className="block"
            >
              <article
                className="rounded-xl border p-5 h-full transition hover:border-[var(--accent)] hover:shadow-lg"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  {ct.aarCodes.slice(0, 3).map(code => (
                    <span
                      key={code}
                      className="badge"
                      style={{ background: 'var(--badge-blue-bg)', borderColor: 'var(--badge-blue-border)', color: 'var(--badge-blue-text)' }}
                    >
                      {code}
                    </span>
                  ))}
                </div>
                <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {ct.name}
                </h2>
                <p className="text-sm line-clamp-2 mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {ct.description}
                </p>
                <div className="card-divider" />
                <div className="flex flex-wrap gap-1.5">
                  {ct.commonCommodities.slice(0, 3).map(c => (
                    <span
                      key={c}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--badge-gray-bg)', color: 'var(--badge-gray-text)', border: '1px solid var(--badge-gray-border)' }}
                    >
                      {c}
                    </span>
                  ))}
                  {ct.commonCommodities.length > 3 && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      +{ct.commonCommodities.length - 3} more
                    </span>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
