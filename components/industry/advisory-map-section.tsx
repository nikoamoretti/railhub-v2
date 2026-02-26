'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { ServiceAdvisory, AdvisoryType } from '@/lib/industry/types'
import { AdvisoryCard } from './advisory-card'
import { STATE_NAMES } from '@/lib/industry/regions'

// Dynamic import -- Leaflet doesn't work with SSR
const AdvisoryMap = dynamic(
  () => import('@/components/industry/advisory-map').then(mod => mod.AdvisoryMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full flex items-center justify-center rounded-xl"
        style={{
          height: '400px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="text-center">
          <div className="text-3xl mb-2" aria-hidden="true">🗺️</div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading advisory map...</p>
        </div>
      </div>
    ),
  }
)

interface AdvisoryMapSectionProps {
  /** All active advisories (unpaginated) for the map */
  allAdvisories: ServiceAdvisory[]
  /** Paginated advisories for the card grid (before state filter) */
  advisories: ServiceAdvisory[]
  /** Active type filter from URL */
  activeType?: AdvisoryType
  /** Active railroad filter from URL */
  activeRailroad?: string
}

export function AdvisoryMapSection({ allAdvisories, advisories, activeType, activeRailroad }: AdvisoryMapSectionProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)

  // Filter advisories for the map based on active URL filters
  const mapAdvisories = useMemo(() => {
    let filtered = allAdvisories
    if (activeType) {
      filtered = filtered.filter(a => a.advisoryType === activeType)
    }
    if (activeRailroad) {
      filtered = filtered.filter(a => a.railroad === activeRailroad)
    }
    return filtered
  }, [allAdvisories, activeType, activeRailroad])

  // When a state is selected, filter the card grid to only that state's advisories
  const filteredAdvisories = useMemo(() => {
    if (!selectedState) return advisories
    return mapAdvisories.filter(a => {
      if (!a.affectedArea) return false
      const codes = a.affectedArea.split(',').map(s => s.trim().toUpperCase())
      return codes.includes(selectedState)
    })
  }, [selectedState, advisories, mapAdvisories])

  const stateLabel = selectedState ? STATE_NAMES[selectedState] || selectedState : null

  return (
    <div>
      {/* Map */}
      <div className="mb-6">
        <AdvisoryMap
          advisories={mapAdvisories}
          selectedState={selectedState}
          onStateSelect={setSelectedState}
        />
      </div>

      {/* State filter indicator */}
      {selectedState && (
        <div className="flex items-center gap-3 mb-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredAdvisories.length}</strong> advisor{filteredAdvisories.length === 1 ? 'y' : 'ies'} in{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{stateLabel}</strong>
          </p>
          <button
            onClick={() => setSelectedState(null)}
            className="text-xs px-2 py-1 rounded transition hover:opacity-80"
            style={{
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent-text)',
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAdvisories.map((a) => (
          <AdvisoryCard key={a.id} advisory={a} />
        ))}
      </div>

      {filteredAdvisories.length === 0 && selectedState && (
        <div className="text-center py-12">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No advisories in {stateLabel}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Click the map or press &quot;Clear filter&quot; to see all advisories.
          </p>
        </div>
      )}
    </div>
  )
}
