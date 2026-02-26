import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Rail Industry Organizations & Events | Railhub',
  description: 'Directory of rail freight industry organizations, trade associations, conferences, and advocacy groups including AAR, ASLRRA, AREMA, RSI, and more.',
}

interface OrgCard {
  title: string
  abbreviation?: string
  description: string
  icon: string
  url?: string
  tag: 'association' | 'conference' | 'group'
}

const ORGANIZATIONS: OrgCard[] = [
  {
    title: 'Association of American Railroads',
    abbreviation: 'AAR',
    description: 'Industry standards, rules, and advocacy for Class I railroads. Sets interchange rules, car maintenance standards, and lobbies on federal rail policy.',
    icon: '\u{1F3DB}\uFE0F',
    url: 'https://www.aar.org',
    tag: 'association',
  },
  {
    title: 'American Short Line and Regional Railroad Association',
    abbreviation: 'ASLRRA',
    description: 'Represents 600+ short line and regional railroads. Provides legislative advocacy, safety programs, and the annual CONNECTIONS conference.',
    icon: '\u{1F6E4}\uFE0F',
    url: 'https://www.aslrra.org',
    tag: 'association',
  },
  {
    title: 'American Railway Engineering and Maintenance-of-Way Association',
    abbreviation: 'AREMA',
    description: 'Develops and publishes track and infrastructure standards. The go-to reference for rail engineering practices, bridge design, and maintenance of way.',
    icon: '\u{1F527}',
    url: 'https://www.arema.org',
    tag: 'association',
  },
  {
    title: 'Railway Supply Institute',
    abbreviation: 'RSI',
    description: 'Trade association for rail suppliers and manufacturers. Covers locomotive, freight car, track, and signal equipment manufacturers.',
    icon: '\u{2699}\uFE0F',
    url: 'https://www.rsiweb.org',
    tag: 'association',
  },
  {
    title: 'RailConnect',
    description: 'Annual industry networking conference connecting shortline railroads with shippers, suppliers, and Class I partners. Features one-on-one meetings and industry panels.',
    icon: '\u{1F91D}',
    tag: 'conference',
  },
  {
    title: 'MARS Conference',
    description: 'Motor and Railroad Supply conference for rail industry procurement. Brings together railroad purchasing departments with equipment and service vendors.',
    icon: '\u{1F4C5}',
    tag: 'conference',
  },
  {
    title: 'Regional Rail Associations',
    description: 'State and regional bodies like the Midwest Association of Rail Shippers (MARS), Pacific Northwest Railroad Association, and Texas Railroad Association.',
    icon: '\u{1F5FA}\uFE0F',
    tag: 'group',
  },
  {
    title: 'Shipper Advocacy Groups',
    description: 'Organizations representing rail shippers including the National Industrial Transportation League (NITL), American Chemistry Council, and The Fertilizer Institute.',
    icon: '\u{1F4E2}',
    tag: 'group',
  },
]

const TAG_LABELS: Record<OrgCard['tag'], string> = {
  association: 'Trade Association',
  conference: 'Conference',
  group: 'Industry Group',
}

export default function OrganizationsPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Organizations</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Industry Organizations &amp; Events
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Trade associations, conferences, and advocacy groups that shape the North American rail freight industry.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ORGANIZATIONS.map(org => {
            const inner = (
              <article
                className="rounded-xl border p-6 transition hover:border-[var(--accent)] hover:shadow-lg h-full"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl" aria-hidden="true">{org.icon}</div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent-text)' }}
                  >
                    {TAG_LABELS[org.tag]}
                  </span>
                </div>
                <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  {org.abbreviation ? `${org.abbreviation} — ` : ''}{org.title}
                </h2>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {org.description}
                </p>
                {org.url && (
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                    Visit website &rarr;
                  </span>
                )}
              </article>
            )

            if (org.url) {
              return (
                <a
                  key={org.title}
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {inner}
                </a>
              )
            }

            return <div key={org.title}>{inner}</div>
          })}
        </div>
      </div>
    </main>
  )
}
