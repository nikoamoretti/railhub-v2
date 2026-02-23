import type { Metadata } from 'next'
import Link from 'next/link'
import { getLatestFuelSurcharges } from '@/lib/industry/queries'
import { FuelSurchargeTable } from '@/components/industry/fuel-surcharge-table'
import { DataFreshness } from '@/components/industry/data-freshness'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Fuel Surcharges | Railhub',
  description: 'Compare current fuel surcharge rates across Class I railroads. Updated weekly with carrier-specific intermodal and carload rates.',
}

export default async function FuelSurchargesPage() {
  const surcharges = await getLatestFuelSurcharges()

  const lastUpdated = surcharges.length > 0 ? new Date(surcharges[0].createdAt) : null

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            <Link href="/industry" className="hover:underline" style={{ color: 'var(--accent-text)' }}>Industry Data</Link>
            <span>/</span>
            <span>Fuel Surcharges</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Fuel Surcharges
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Side-by-side comparison of current fuel surcharge rates across Class I railroads.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <FuelSurchargeTable surcharges={surcharges} />
        </div>

        {lastUpdated && (
          <div className="mt-4">
            <DataFreshness lastUpdated={lastUpdated} />
          </div>
        )}
      </div>
    </main>
  )
}
