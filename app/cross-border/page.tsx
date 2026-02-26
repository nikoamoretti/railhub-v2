import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cross-Border & International Rail Freight | Railhub',
  description: 'Guide to cross-border rail freight between the US, Mexico, and Canada. Key gateways, customs procedures, Mexican railroad networks, and free trade zones.',
}

interface ContentSection {
  id: string
  title: string
  icon: string
  content: string[]
  highlights?: { label: string; detail: string }[]
}

const SECTIONS: ContentSection[] = [
  {
    id: 'us-mexico',
    title: 'US-Mexico Rail Corridors',
    icon: '\u{1F1F2}\u{1F1FD}',
    content: [
      'The US-Mexico border handles billions of dollars in rail freight annually. Five primary rail gateways connect the two countries, each serving distinct commodity flows and carrier combinations.',
    ],
    highlights: [
      { label: 'Laredo / Nuevo Laredo', detail: 'Busiest crossing. CPKC and UP interchange with Ferromex and CPKC Mexico. Handles automotive, consumer goods, and agricultural products.' },
      { label: 'El Paso / Ciudad Juarez', detail: 'BNSF and UP connect with Ferromex. Major corridor for maquiladora freight, metals, and building materials.' },
      { label: 'Eagle Pass / Piedras Negras', detail: 'UP interchange with Ferromex. Handles coal, minerals, and agricultural commodities.' },
      { label: 'Brownsville / Matamoros', detail: 'UP connects with Ferromex. Serves petrochemical, grain, and steel traffic from the Rio Grande Valley.' },
      { label: 'Nogales', detail: 'BNSF and UP interchange with Ferromex. Key gateway for fresh produce, mining products, and manufactured goods from western Mexico.' },
    ],
  },
  {
    id: 'us-canada',
    title: 'US-Canada Interchange Points',
    icon: '\u{1F1E8}\u{1F1E6}',
    content: [
      'US-Canada rail interchange is deeply integrated, with CN and CPKC operating extensive networks on both sides of the border. Major crossings carry auto parts, potash, lumber, crude oil, and intermodal containers.',
    ],
    highlights: [
      { label: 'Detroit / Windsor', detail: 'CN and CP tunnel and bridge crossings. Highest-volume corridor handling automotive, chemicals, and intermodal traffic.' },
      { label: 'Buffalo / Fort Erie', detail: 'CN, CSX, and NS interchange. Serves eastern corridor traffic including steel, paper, and consumer goods.' },
      { label: 'Chicago Gateway', detail: 'While not a border point, Chicago is the primary inland interchange for US-Canada traffic. CN and CPKC connect with all Class I carriers.' },
      { label: 'Portal / North Portal', detail: 'CPKC crossing in North Dakota/Saskatchewan. Key corridor for potash, grain, and crude oil.' },
      { label: 'Emerson / Noyes', detail: 'BNSF and CN interchange at the Manitoba/Minnesota border. Handles agricultural products and intermodal freight.' },
    ],
  },
  {
    id: 'customs',
    title: 'Customs & Border Procedures',
    icon: '\u{1F6C3}',
    content: [
      'Cross-border rail freight requires compliance with customs and border protection requirements in all three countries. Understanding these procedures is critical for avoiding delays and penalties.',
      'U.S. Customs and Border Protection (CBP) requires an Automated Commercial Environment (ACE) manifest filing for all inbound rail shipments. Carriers must transmit consist data, bills of lading, and commodity information electronically before arrival at the border.',
    ],
    highlights: [
      { label: 'ACE Manifest Filing', detail: 'Electronic advance cargo information submitted to CBP. Required for all inbound rail freight to the United States.' },
      { label: 'In-Bond Transit', detail: 'Allows goods to move through the US under customs bond without formal entry. Used for Canadian traffic transiting US territory.' },
      { label: 'FAST Program', detail: 'Free and Secure Trade program for pre-approved carriers, importers, and drivers. Expedites border processing for trusted participants.' },
      { label: 'CSA (Canada)', detail: 'Canada Border Services Agency program streamlining customs for pre-approved importers. Separates accounting from release of goods.' },
    ],
  },
  {
    id: 'mexico-networks',
    title: 'Mexican Railroad Networks',
    icon: '\u{1F6E4}\uFE0F',
    content: [
      'Mexico\'s rail network was privatized in the late 1990s, creating concession-based operators. Today, three major carriers and a terminal railroad handle the majority of freight traffic.',
    ],
    highlights: [
      { label: 'Ferromex', detail: 'Largest Mexican railroad with approximately 8,000 km of track. Grupo Mexico subsidiary serving the northern and Pacific corridors. Handles mining, agricultural, and industrial freight.' },
      { label: 'Ferrosur', detail: 'Serves southeastern Mexico with roughly 1,800 km of track. Also a Grupo Mexico property. Handles cement, agricultural products, and industrial goods.' },
      { label: 'CPKC Mexico (formerly KCSM)', detail: 'Part of Canadian Pacific Kansas City. Operates approximately 4,300 km connecting Laredo and Lazaro Cardenas port with Mexico City and Monterrey.' },
      { label: 'Ferrovalle', detail: 'Terminal railroad operating in the Mexico City metropolitan area. Provides switching and interchange services between Ferromex, Ferrosur, and CPKC Mexico.' },
    ],
  },
  {
    id: 'free-trade-zones',
    title: 'Free Trade Zones',
    icon: '\u{1F3ED}',
    content: [
      'Mexico\'s maquiladora and IMMEX programs allow manufacturers to import raw materials duty-free for assembly and re-export. Many of these operations are located along the US-Mexico border with direct rail access.',
      'Key industrial corridors with rail-served maquiladora operations include Monterrey-Saltillo (automotive and appliances), Ciudad Juarez (electronics and automotive), Tijuana-Mexicali (electronics and medical devices), and the Bajio region (automotive and aerospace).',
      'The USMCA trade agreement (which replaced NAFTA in 2020) governs rules of origin and tariff preferences for rail freight moving between the three countries. Automotive content requirements and agricultural provisions are particularly relevant for rail shippers.',
    ],
  },
]

export default function CrossBorderPage() {
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
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Cross-Border</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Cross-Border &amp; International
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Rail gateways, customs procedures, and railroad networks connecting the US, Mexico, and Canada.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {SECTIONS.map((section, idx) => (
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

            {section.highlights && section.highlights.length > 0 && (
              <div className="mt-6 grid gap-3">
                {section.highlights.map(h => (
                  <div
                    key={h.label}
                    className="rounded-xl border p-4"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                  >
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                      {h.label}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {h.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}
