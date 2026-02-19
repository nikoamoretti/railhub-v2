import type { Metadata } from 'next'
import Link from 'next/link'
import facilitiesData from '@/public/facilities.json'
import type { Facility } from '@/lib/types'
import { getStateName, isCanadianProvince, isMexicanState } from '@/lib/states'

const facilities = facilitiesData as Facility[]

export const metadata: Metadata = {
  title: 'Browse Rail Freight Facilities by State | Railhub',
  description: 'Explore rail freight facilities across US states, Canadian provinces, and Mexican states. Find transload, storage, team track, and intermodal locations.',
}

const allStates = (() => {
  const counts = new Map<string, number>()
  for (const f of facilities) {
    const st = f.location?.state
    if (st) counts.set(st, (counts.get(st) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: getStateName(code), count }))
    .sort((a, b) => a.name.localeCompare(b.name))
})()

const usStates = allStates.filter(s => !isCanadianProvince(s.code) && !isMexicanState(s.code))
const caProvinces = allStates.filter(s => isCanadianProvince(s.code))
const mxStates = allStates.filter(s => isMexicanState(s.code))

export default function StatesPage() {

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-default)',
  }

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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Browse States</li>
            </ol>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Browse by State
          </h1>
          <p className="text-lg mt-2" style={{ color: 'var(--text-secondary)' }}>
            {allStates.length} states and provinces &middot; {facilities.length.toLocaleString()} facilities
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* US States */}
        <section>
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            United States
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {usStates.map(s => (
              <Link
                key={s.code}
                href={`/state/${s.code}`}
                className="rounded-xl border p-4 transition hover:border-[var(--accent)] hover:shadow-md"
                style={cardStyle}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {s.name}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.code}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                    {s.count.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Canadian Provinces */}
        {caProvinces.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Canada
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {caProvinces.map(s => (
                <Link
                  key={s.code}
                  href={`/state/${s.code}`}
                  className="rounded-xl border p-4 transition hover:border-[var(--accent)] hover:shadow-md"
                  style={cardStyle}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.code}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                      {s.count.toLocaleString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Mexican States */}
        {mxStates.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Mexico
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mxStates.map(s => (
                <Link
                  key={s.code}
                  href={`/state/${s.code}`}
                  className="rounded-xl border p-4 transition hover:border-[var(--accent)] hover:shadow-md"
                  style={cardStyle}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {s.name}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.code}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                      {s.count.toLocaleString()}
                    </span>
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
