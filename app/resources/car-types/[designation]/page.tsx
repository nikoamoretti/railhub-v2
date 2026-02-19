import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import carTypesData from '@/public/data/car-types.json'
import type { CarType } from '@/lib/resource-types'

const carTypes = carTypesData as CarType[]

export function generateStaticParams() {
  return carTypes.map(ct => ({ designation: ct.designation }))
}

interface PageProps {
  params: Promise<{ designation: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { designation } = await params
  const ct = carTypes.find(c => c.designation === designation)
  if (!ct) return { title: 'Car Type Not Found | Railhub' }

  return {
    title: `${ct.name} (${ct.aarCodes.join(', ')}) — Railcar Specifications | Railhub`,
    description: ct.description,
  }
}

const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }

export default async function CarTypeDetailPage({ params }: PageProps) {
  const { designation } = await params
  const ct = carTypes.find(c => c.designation === designation)

  if (!ct) notFound()

  const dims = ct.dimensions
  const dimEntries = Object.entries(dims).filter(([, v]) => v) as [string, string][]
  const dimLabels: Record<string, string> = {
    length: 'Length',
    width: 'Width',
    height: 'Height',
    capacity: 'Cubic Capacity',
    loadLimit: 'Load Limit',
  }

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
              <li>
                <Link href="/resources" style={{ color: 'var(--accent-text)' }} className="hover:underline">Resources</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li>
                <Link href="/resources/car-types" style={{ color: 'var(--accent-text)' }} className="hover:underline">Car Types</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{ct.name}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-2 mb-3">
            {ct.aarCodes.map(code => (
              <span
                key={code}
                className="badge"
                style={{ background: 'var(--badge-blue-bg)', borderColor: 'var(--badge-blue-border)', color: 'var(--badge-blue-text)' }}
              >
                {code}
              </span>
            ))}
          </div>

          <h1 className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {ct.name}
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Description */}
          <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Overview</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ct.description}</p>
          </div>

          {/* Dimensions */}
          {dimEntries.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Dimensions</h2>
              <div className="space-y-3">
                {dimEntries.map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>{dimLabels[key] || key}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Commodities */}
          <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Common Commodities</h2>
            <div className="flex flex-wrap gap-2">
              {ct.commonCommodities.map(c => (
                <span
                  key={c}
                  className="px-3 py-1 rounded-full text-sm border"
                  style={{ background: 'var(--badge-green-bg)', borderColor: 'var(--badge-green-border)', color: 'var(--badge-green-text)' }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Variants */}
          {ct.variants.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Variants</h2>
              <div className="space-y-4">
                {ct.variants.map(v => (
                  <div key={v.name}>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{v.name}</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Use Cases */}
          <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Typical Use Cases</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ct.useCases}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
