import Link from 'next/link'

const TOP_STATES = [
  { code: 'TX', name: 'Texas' },
  { code: 'CA', name: 'California' },
  { code: 'IL', name: 'Illinois' },
  { code: 'OH', name: 'Ohio' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'FL', name: 'Florida' },
]

const TOP_TYPES = [
  { value: 'transload', label: 'Transload' },
  { value: 'team_track', label: 'Team Track' },
  { value: 'storage', label: 'Storage' },
  { value: 'intermodal', label: 'Intermodal' },
  { value: 'bulk_transfer', label: 'Bulk Transfer' },
  { value: 'repair_shop', label: 'Repair Shop' },
]

export function Footer() {
  return (
    <footer
      className="border-t mt-12"
      style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
          {/* Top States */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Top States
            </h3>
            <ul className="space-y-2">
              {TOP_STATES.map(s => (
                <li key={s.code}>
                  <Link
                    href={`/state/${s.code}`}
                    className="text-sm transition hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/states"
                  className="text-sm font-medium transition hover:underline"
                  style={{ color: 'var(--accent-text)' }}
                >
                  View all states
                </Link>
              </li>
            </ul>
          </div>

          {/* Facility Types */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Facility Types
            </h3>
            <ul className="space-y-2">
              {TOP_TYPES.map(t => (
                <li key={t.value}>
                  <Link
                    href={`/?type=${t.value}`}
                    className="text-sm transition hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              Resources
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/resources/glossary', label: 'Glossary' },
                { href: '/resources/car-types', label: 'Car Types' },
                { href: '/resources/guides', label: 'How-To Guides' },
                { href: '/resources/rail-101', label: 'Rail 101' },
              ].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition hover:underline"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/resources"
                  className="text-sm font-medium transition hover:underline"
                  style={{ color: 'var(--accent-text)' }}
                >
                  All resources
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
              About Railhub
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Free directory of 7,900+ rail freight facilities across North America.
              Find transload locations, team tracks, storage yards, and more with
              railroad connections and capacity details.
            </p>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t text-center"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; {new Date().getFullYear()} Railhub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
