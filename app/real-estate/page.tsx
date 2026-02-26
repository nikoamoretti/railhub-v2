import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Rail-Served Real Estate & Industrial Development | Railhub',
  description: 'Guide to rail-served industrial sites, build-to-suit facilities, rail spur construction, and development resources including RRIF loans and INFRA grants.',
}

interface ContentSection {
  id: string
  title: string
  icon: string
  content: string[]
  details?: { label: string; info: string }[]
  callout?: { heading: string; items: string[] }
}

const SECTIONS: ContentSection[] = [
  {
    id: 'rail-served-sites',
    title: 'Rail-Served Industrial Sites',
    icon: '\u{1F3D7}\uFE0F',
    content: [
      'A rail-served site is any industrial property with direct access to a railroad for loading and unloading freight cars. Rail access can significantly reduce transportation costs for bulk commodities, making it a key consideration for manufacturers, distributors, and processors.',
      'Not all rail access is equal. The value of a rail-served site depends on which railroad provides service, the capacity of the existing trackwork, and how the site connects to the broader rail network.',
    ],
    details: [
      { label: 'Proximity to Mainline', info: 'Sites directly on or adjacent to a Class I mainline offer the best service frequency. Spur distance from the mainline affects switching costs and transit time.' },
      { label: 'Switch Access', info: 'Industrial switches connect a facility\'s spur track to the railroad. Switch type (power switch vs. hand-throw) and facing-point vs. trailing-point orientation affect operations.' },
      { label: 'Spur Capacity', info: 'The number of cars a spur can hold determines maximum shipment size. A typical spur holds 5-20 cars; larger facilities may have loop tracks for unit train service (100+ cars).' },
      { label: 'Class I vs. Shortline Access', info: 'Class I service provides direct long-haul capability. Shortline access adds a switching charge but may offer more flexible service windows and lower minimum volume requirements.' },
    ],
  },
  {
    id: 'build-to-suit',
    title: 'Build-to-Suit Facilities',
    icon: '\u{1F3E2}',
    content: [
      'Build-to-suit (BTS) rail facilities are custom-designed transload, warehouse, or distribution buildings constructed on rail-served land to meet a specific tenant\'s requirements. This approach is common for shippers who need specialized commodity handling but don\'t want to own the real estate.',
      'The BTS process typically involves a developer or railroad-affiliated company that owns rail-served land, designs the facility to tenant specifications, and leases the completed building on a long-term basis (10-20 years). This shifts the capital expenditure from the shipper to the developer.',
    ],
    details: [
      { label: 'Transload Facilities', info: 'Transfer freight between rail and truck. Designed for specific commodities: bulk materials, lumber, steel, plastics. Includes rail-side loading docks, overhead cranes, or conveyor systems.' },
      { label: 'Rail-Served Warehouses', info: 'Indoor storage with direct rail car access via interior or dock-height rail doors. Used for weather-sensitive commodities and cross-docking operations.' },
      { label: 'Distribution Centers', info: 'Large-format facilities combining rail receiving with truck dispatch. Ideal for high-volume consumer goods, building materials, and food products.' },
    ],
    callout: {
      heading: 'Key Developers',
      items: [
        'Watco (rail-served terminals and transload facilities nationwide)',
        'CenterPoint Properties (industrial logistics real estate with rail access)',
        'Railcar-served parks developed by BNSF Logistics Parks and NS Thoroughbred Bulk Transfer',
        'Regional short line holding companies (Genesee & Wyoming, OmniTRAX) often develop sites along their networks',
      ],
    },
  },
  {
    id: 'spur-construction',
    title: 'Rail Spur Construction',
    icon: '\u{1F6E4}\uFE0F',
    content: [
      'Building a new rail spur connects an industrial site to an existing rail line. The process involves engineering design, permitting, railroad approval, and construction. Timeline from initial inquiry to operational spur is typically 6-18 months.',
    ],
    details: [
      { label: 'Engineering & Design', info: 'Survey, grading plan, track geometry, drainage, and turnout design. Must comply with the serving railroad\'s engineering standards and AREMA guidelines.' },
      { label: 'Railroad Approval', info: 'The serving railroad must approve the connection to their line. This includes a traffic study (projected carloads per year), insurance requirements, and an industry track agreement.' },
      { label: 'Permitting', info: 'Local building permits, environmental review (especially for wetlands or flood plains), and potential STB filings for new rail service.' },
      { label: 'Construction', info: 'Includes grading, sub-ballast, ballast, ties, rail, turnout installation, and signal integration if required. Contractor must be approved by the serving railroad.' },
    ],
    callout: {
      heading: 'Typical Cost Ranges',
      items: [
        'Short spur (500-1,500 ft): $150,000 - $500,000',
        'Medium spur with turnout (1,500-3,000 ft): $500,000 - $1,000,000',
        'Large installation with loop track or yard: $1,000,000+',
        'Cost drivers: length, terrain, required drainage, bridge/culvert work, signal modifications',
      ],
    },
  },
  {
    id: 'development-resources',
    title: 'Industrial Development Resources',
    icon: '\u{1F4B0}',
    content: [
      'Federal and state programs provide funding, loans, and technical assistance for rail-served industrial development. These resources can significantly offset the cost of rail infrastructure construction and site preparation.',
    ],
    details: [
      { label: 'RRIF Loans (FRA)', info: 'Railroad Rehabilitation & Improvement Financing program offers direct federal loans and loan guarantees up to $35 billion for rail infrastructure projects. Low interest rates and flexible terms of up to 35 years.' },
      { label: 'INFRA Grants', info: 'Infrastructure for Rebuilding America grants for nationally significant freight and highway projects. Rail projects are eligible, particularly those that improve safety, efficiency, or reduce highway congestion.' },
      { label: 'CRISI Grants', info: 'Consolidated Rail Infrastructure and Safety Improvements program funds rail capital projects, planning, and safety improvements. Available to states, railroads, and other eligible entities.' },
      { label: 'State Railroad Development Agencies', info: 'Most states have rail development offices that offer grants, tax incentives, and technical assistance for rail-served industrial projects. Programs vary significantly by state.' },
    ],
    callout: {
      heading: 'State-Level Resources',
      items: [
        'Texas: Rail Relocation and Improvement Fund',
        'Ohio: Rail Development Commission grants',
        'Virginia: Rail Industrial Access Program (up to $450K per project)',
        'Pennsylvania: Rail Freight Assistance Program (RFAP)',
        'Many states offer property tax abatements, TIF districts, and enterprise zone incentives for rail-served development',
      ],
    },
  },
]

export default function RealEstatePage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Real Estate</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Real Estate &amp; Development
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Rail-served industrial sites, spur construction, build-to-suit facilities, and funding resources for rail development.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id}>
            <h2
              className="text-2xl font-bold mb-4 scroll-mt-20"
              style={{ color: 'var(--text-primary)' }}
            >
              <span style={{ color: 'var(--accent-text)' }}>{section.icon} </span>
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.content.map((paragraph, i) => (
                <p key={i} className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {section.details && section.details.length > 0 && (
              <div className="mt-6 grid gap-3">
                {section.details.map(d => (
                  <div
                    key={d.label}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                  >
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {d.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {d.info}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {section.callout && (
              <div
                className="mt-6 rounded-xl border p-5"
                style={{ backgroundColor: 'var(--accent-muted)', borderColor: 'var(--accent-border)' }}
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--accent-text)' }}>
                  {section.callout.heading}
                </h3>
                <ul className="space-y-2">
                  {section.callout.items.map((item, i) => (
                    <li key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      &bull; {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
