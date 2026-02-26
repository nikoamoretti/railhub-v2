'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from 'recharts'
import type { FreightTrendPoint } from '@/lib/industry/types'

interface FreightChartsProps {
  trends: FreightTrendPoint[]
}

type Tab = 'carloads' | 'tsi' | 'indices'

const TABS: { id: Tab; label: string }[] = [
  { id: 'carloads', label: 'Carloads & Intermodal' },
  { id: 'tsi', label: 'Freight Index (TSI)' },
  { id: 'indices', label: 'PPI & Cass' },
]

// "2024-01" → "Jan '24"
function formatMonthLabel(date: string): string {
  const [year, month] = date.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }).replace(' ', " '")
}

function formatCarloads(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString()
}

function formatIndex(v: number): string {
  return v.toFixed(1)
}

// Shared axis / grid styles
const AXIS_STYLE = { fill: 'var(--text-tertiary)', fontSize: 11 }
const GRID_STROKE = 'var(--border-subtle)'

interface TooltipPayloadEntry {
  name: string
  value: number | null
  color: string
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  label?: string
  payload?: TooltipPayloadEntry[]
  formatter?: (v: number) => string
}

function CustomTooltip({ active, label, payload, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-primary)',
        minWidth: 140,
      }}
    >
      <p className="font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </p>
      {payload.map((entry) =>
        entry.value != null ? (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ) : null,
      )}
    </div>
  )
}

// ── Tab views ─────────────────────────────────────────

function CarloadsChart({ data }: { data: FreightTrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthLabel(d.date),
    carloads: d.carloadsSA,
    intermodal: d.intermodalSA,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCarloads}
          width={52}
          domain={['auto', 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatCarloads}
          width={52}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={
            <CustomTooltip
              formatter={(v) => v.toLocaleString()}
            />
          }
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="carloads"
          name="Carloads (SA)"
          stroke="#f97316"
          fill="rgba(249,115,22,0.15)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="intermodal"
          name="Intermodal (SA)"
          stroke="#3b82f6"
          fill="rgba(59,130,246,0.12)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function TsiChart({ data }: { data: FreightTrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthLabel(d.date),
    tsi: d.tsiFreight,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatIndex}
          width={44}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={<CustomTooltip formatter={formatIndex} />}
        />
        <Area
          type="monotone"
          dataKey="tsi"
          name="TSI Freight"
          stroke="var(--accent-text)"
          fill="rgba(99,102,241,0.15)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function IndicesChart({ data }: { data: FreightTrendPoint[] }) {
  const chartData = data.map((d) => ({
    label: formatMonthLabel(d.date),
    ppi: d.ppiRail,
    cass: d.cassFreight,
  }))

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
        <YAxis
          yAxisId="left"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatIndex}
          width={44}
          domain={['auto', 'auto']}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={AXIS_STYLE}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatIndex}
          width={44}
          domain={['auto', 'auto']}
        />
        <Tooltip
          content={<CustomTooltip formatter={formatIndex} />}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="ppi"
          name="PPI Rail"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cass"
          name="Cass Freight"
          stroke="#a855f7"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ── Main export ───────────────────────────────────────

export function FreightCharts({ trends }: FreightChartsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('carloads')

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-2 px-4 pt-4 pb-0 flex-wrap"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3 py-1.5 rounded-t text-sm font-medium transition-colors relative"
              style={{
                color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--accent-text)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Chart area */}
      <div className="px-4 py-5">
        {activeTab === 'carloads' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <LegendDot color="#f97316" label="Carloads (SA)" />
              <LegendDot color="#3b82f6" label="Intermodal (SA)" />
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                Seasonally adjusted, thousands of units
              </span>
            </div>
            {trends.length > 0 ? <CarloadsChart data={trends} /> : <EmptyChart />}
          </>
        )}
        {activeTab === 'tsi' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <LegendDot color="var(--accent-text)" label="TSI Freight Index" />
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                Bureau of Transportation Statistics
              </span>
            </div>
            {trends.length > 0 ? <TsiChart data={trends} /> : <EmptyChart />}
          </>
        )}
        {activeTab === 'indices' && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <LegendDot color="#22c55e" label="PPI Rail (left)" />
              <LegendDot color="#a855f7" label="Cass Freight (right)" />
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                Index values, dual axes
              </span>
            </div>
            {trends.length > 0 ? <IndicesChart data={trends} /> : <EmptyChart />}
          </>
        )}
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

function EmptyChart() {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ height: 320, background: 'var(--bg-elevated)' }}
    >
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        No freight trend data available yet.
      </p>
    </div>
  )
}
