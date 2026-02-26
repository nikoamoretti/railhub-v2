import type { Metadata } from 'next'
import Link from 'next/link'
import { getFreightTrends } from '@/lib/industry/queries'
import { FreightChartsWrapper } from '@/components/industry/freight-charts-wrapper'
import type { FreightTrendPoint } from '@/lib/industry/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'National Freight Trends | Railhub',
  description: 'Monthly rail carloads, intermodal traffic, and freight indices from BTS and FRED.',
}

// ── Summary card ─────────────────────────────────────

interface SummaryCardProps {
  label: string
  value: string | null
  change: number | null
  unit?: string
  accentColor: string
  accentBg: string
}

function SummaryCard({ label, value, change, unit, accentColor, accentBg }: SummaryCardProps) {
  const isUp = change != null && change >= 0
  const changeColor = isUp ? 'var(--badge-green-text)' : 'var(--badge-red-text)'

  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </p>
        {change != null && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: changeColor }}>
            {isUp ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      {value != null ? (
        <p className="text-2xl font-bold mt-2" style={{ color: accentColor }}>
          {value}
          {unit && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-tertiary)' }}>{unit}</span>}
        </p>
      ) : (
        <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-muted)' }}>—</p>
      )}
      <div
        className="mt-3 h-1 rounded-full"
        style={{ background: accentBg, opacity: 0.6 }}
      />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────

function monthOverMonth(trends: FreightTrendPoint[], key: keyof FreightTrendPoint): number | null {
  const valid = trends.filter((t) => t[key] != null)
  if (valid.length < 2) return null
  const latest = valid[valid.length - 1][key] as number
  const prev = valid[valid.length - 2][key] as number
  if (prev === 0) return null
  return ((latest - prev) / prev) * 100
}

function latestValue(trends: FreightTrendPoint[], key: keyof FreightTrendPoint): number | null {
  const valid = trends.filter((t) => t[key] != null)
  if (valid.length === 0) return null
  return valid[valid.length - 1][key] as number
}

function latestMonth(trends: FreightTrendPoint[]): string {
  if (trends.length === 0) return ''
  const last = trends[trends.length - 1].date
  const [year, month] = last.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

// ── Page ──────────────────────────────────────────────

export default async function FreightTrendsPage() {
  const trends = await getFreightTrends()

  const latestCarloads = latestValue(trends, 'carloadsSA')
  const latestIntermodal = latestValue(trends, 'intermodalSA')
  const latestTsi = latestValue(trends, 'tsiFreight')
  const latestPpi = latestValue(trends, 'ppiRail')

  const cards: SummaryCardProps[] = [
    {
      label: 'Carloads (SA)',
      value: latestCarloads != null ? latestCarloads.toLocaleString() : null,
      change: monthOverMonth(trends, 'carloadsSA'),
      unit: 'units',
      accentColor: '#f97316',
      accentBg: 'rgba(249,115,22,0.25)',
    },
    {
      label: 'Intermodal (SA)',
      value: latestIntermodal != null ? latestIntermodal.toLocaleString() : null,
      change: monthOverMonth(trends, 'intermodalSA'),
      unit: 'units',
      accentColor: '#3b82f6',
      accentBg: 'rgba(59,130,246,0.25)',
    },
    {
      label: 'TSI Freight Index',
      value: latestTsi != null ? latestTsi.toFixed(1) : null,
      change: monthOverMonth(trends, 'tsiFreight'),
      accentColor: 'var(--accent-text)',
      accentBg: 'rgba(99,102,241,0.25)',
    },
    {
      label: 'PPI Rail',
      value: latestPpi != null ? latestPpi.toFixed(1) : null,
      change: monthOverMonth(trends, 'ppiRail'),
      accentColor: '#22c55e',
      accentBg: 'rgba(34,197,94,0.25)',
    },
  ]

  const asOf = latestMonth(trends)

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/industry" className="hover:underline" style={{ color: 'var(--accent-text)' }}>
              Industry Data
            </Link>
            <span>/</span>
            <span>Freight Trends</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            National Freight Trends
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Monthly rail carloads, intermodal traffic, and freight indices from BTS and FRED.
          </p>
          {asOf && (
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Latest data: {asOf}
            </p>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cards.map((card) => (
            <SummaryCard key={card.label} {...card} />
          ))}
        </div>

        {/* Charts */}
        <FreightChartsWrapper trends={trends} />

        {/* Source footnote */}
        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          Sources: Bureau of Transportation Statistics (TSI), Bureau of Labor Statistics (PPI), Cass Information
          Systems, Association of American Railroads (AAR). SA = seasonally adjusted.
        </p>
      </div>
    </main>
  )
}
