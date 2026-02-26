import type { FuelSurcharge } from '@/lib/industry/types'

interface FuelSurchargeTableProps {
  surcharges: FuelSurcharge[]
}

export function FuelSurchargeTable({ surcharges }: FuelSurchargeTableProps) {
  if (surcharges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>No surcharge data available</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Data will appear after the first scrape runs.
        </p>
      </div>
    )
  }

  // Group by railroad
  const byRailroad = new Map<string, typeof surcharges>()
  for (const s of surcharges) {
    const existing = byRailroad.get(s.railroad) || []
    existing.push(s)
    byRailroad.set(s.railroad, existing)
  }

  const railroads = [...byRailroad.keys()].sort()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderColor: 'var(--border-default)' }}>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Railroad</th>
            <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Traffic Type</th>
            <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Surcharge Rate</th>
            <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Fuel Price</th>
            <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Effective Date</th>
          </tr>
        </thead>
        <tbody>
          {railroads.map((railroad) => {
            const items = byRailroad.get(railroad)!
            return items.map((s, i) => (
              <tr
                key={s.id}
                className="border-t transition hover:bg-[var(--bg-elevated)]"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {i === 0 ? (
                  <td
                    className="py-3 px-4 font-medium"
                    style={{ color: 'var(--text-primary)' }}
                    rowSpan={items.length}
                  >
                    {railroad}
                  </td>
                ) : null}
                <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                  {s.trafficType || 'All Traffic'}
                </td>
                <td className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {s.surchargeRate.toFixed(1)}%
                </td>
                <td className="text-right py-3 px-4" style={{ color: 'var(--text-secondary)' }}>
                  {s.fuelPrice ? `$${s.fuelPrice.toFixed(2)}` : '—'}
                </td>
                <td className="text-right py-3 px-4" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(s.effectiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}
