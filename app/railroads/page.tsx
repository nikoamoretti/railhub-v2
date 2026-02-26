import type { Metadata } from 'next'
import Link from 'next/link'
import { getRailroadIndex } from '@/lib/railroads/queries'

export const metadata: Metadata = {
  title: 'Railroads — Class I & Regional Carriers | Railhub',
  description: 'Browse Class I railroads and regional carriers. Find facilities, job openings, and service areas for BNSF, UP, CSX, NS, CN, CPKC, and more.',
}

const cardStyle = {
  backgroundColor: 'var(--bg-card)',
  borderColor: 'var(--border-default)',
}

export default function RailroadsPage() {
  const railroads = getRailroadIndex()
  const class1 = railroads.filter(r => r.meta.tier === 'class1')
  const regionals = railroads.filter(r => r.meta.tier === 'regional')

  return (
    <main>
      <header className="py-8 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Railroads</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Railroads
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            {class1.length} Class I carriers &middot; {regionals.length} regional carriers
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Class I */}
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Class I Railroads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {class1.map(rr => (
              <Link
                key={rr.meta.slug}
                href={`/railroad/${rr.meta.slug}`}
                className="rounded-xl border p-5 transition hover:border-[var(--accent)] hover:shadow-md"
                style={cardStyle}
              >
                <div
                  className="w-10 h-1 rounded-full mb-3"
                  style={{ backgroundColor: rr.meta.accentColor }}
                />
                <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                  {rr.meta.shortName}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {rr.meta.name}
                </div>
                <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>
                  {rr.meta.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span>
                    <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                      {rr.facilityCount.toLocaleString()}
                    </span> facilities
                  </span>
                  {rr.jobCount > 0 && (
                    <span>
                      <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                        {rr.jobCount}
                      </span> jobs
                    </span>
                  )}
                  <span>{rr.stateCount} states</span>
                </div>

                {rr.topStates.length > 0 && (
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Top: {rr.topStates.map(s => s.code).join(', ')}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Regionals */}
        {regionals.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Regional & Short Line Carriers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regionals.map(rr => (
                <Link
                  key={rr.meta.slug}
                  href={`/railroad/${rr.meta.slug}`}
                  className="rounded-xl border p-5 transition hover:border-[var(--accent)] hover:shadow-md"
                  style={cardStyle}
                >
                  <div
                    className="w-10 h-1 rounded-full mb-3"
                    style={{ backgroundColor: rr.meta.accentColor }}
                  />
                  <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    {rr.meta.shortName}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {rr.meta.name}
                  </div>
                  <div className="mt-3 flex gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>
                      <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                        {rr.facilityCount.toLocaleString()}
                      </span> facilities
                    </span>
                    {rr.jobCount > 0 && (
                      <span>
                        <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>
                          {rr.jobCount}
                        </span> jobs
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
