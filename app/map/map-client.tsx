'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { Facility } from '@/lib/types'
import { FACILITY_TYPES } from '@/lib/facility-types'

// Dynamic import — Leaflet doesn't work with SSR
const FacilityMap = dynamic(
  () => import('@/components/facility-map').then(mod => mod.FacilityMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex items-center justify-center rounded-xl"
        style={{
          height: 'calc(100vh - 56px - 200px)',
          minHeight: '500px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2" aria-hidden="true">🗺️</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading map...</p>
        </div>
      </div>
    ),
  }
)

// Top types for quick filter chips
const TOP_TYPES = [
  'TRANSLOAD', 'TEAM_TRACK', 'STORAGE', 'INTERMODAL',
  'BULK_TRANSFER', 'REPAIR_SHOP', 'TANK_WASH', 'SHORTLINE',
]

interface MapClientProps {
  facilities: Facility[]
  allCount: number
  states: string[]
}

export function MapClient({ facilities, allCount, states }: MapClientProps) {
  const [typeFilter, setTypeFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const hasFilters = typeFilter || stateFilter || searchQuery

  function clearAll() {
    setTypeFilter('')
    setStateFilter('')
    setSearchQuery('')
  }

  const selectStyle = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  }

  return (
    <main>
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Facility Map
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {facilities.length.toLocaleString()} of {allCount.toLocaleString()} facilities with coordinates
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-medium transition hover:underline"
            style={{ color: 'var(--accent-text)' }}
          >
            ← Back to directory
          </Link>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            type="text"
            placeholder="Search name or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none"
            style={selectStyle}
          />

          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none"
            style={selectStyle}
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none"
            style={selectStyle}
          >
            <option value="">All Types</option>
            {FACILITY_TYPES.map(t => (
              <option key={t.value} value={t.value.toLowerCase()}>{t.label}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs px-3 py-2 transition hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Quick type chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TOP_TYPES.map(t => {
            const active = typeFilter === t.toLowerCase()
            const typeObj = FACILITY_TYPES.find(ft => ft.value === t)
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(active ? '' : t.toLowerCase())}
                className="px-3 py-1 rounded-full text-xs font-medium transition"
                style={{
                  background: active ? 'var(--accent-muted)' : 'var(--bg-card)',
                  color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: active ? 'var(--accent-border)' : 'var(--border-default)',
                }}
              >
                {typeObj?.label || t}
              </button>
            )
          })}
        </div>

        {/* Map */}
        <FacilityMap
          facilities={facilities}
          typeFilter={typeFilter}
          stateFilter={stateFilter}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  )
}
