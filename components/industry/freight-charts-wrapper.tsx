'use client'

import dynamic from 'next/dynamic'
import type { FreightTrendPoint } from '@/lib/industry/types'

const FreightCharts = dynamic(
  () => import('@/components/industry/freight-charts').then((m) => m.FreightCharts),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex items-center justify-center rounded-xl"
        style={{
          height: '420px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading charts...</p>
      </div>
    ),
  }
)

export function FreightChartsWrapper({ trends }: { trends: FreightTrendPoint[] }) {
  return <FreightCharts trends={trends} />
}
