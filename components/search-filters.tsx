'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SearchFiltersProps {
  states: string[]
  totalResults: number
  filteredResults: number
}

const FACILITY_TYPES = [
  { value: 'TRANSLOAD', label: 'Transload' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'TEAM_TRACK', label: 'Team Track' },
  { value: 'BULK_TRANSFER', label: 'Bulk Transfer' },
  { value: 'REPAIR_SHOP', label: 'Repair Shop' },
  { value: 'INTERMODAL', label: 'Intermodal' },
  { value: 'TANK_WASH', label: 'Tank Wash' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'SHORTLINE', label: 'Shortline Railroad' },
  { value: 'PRIVATESIDING', label: 'Private Siding' },
  { value: 'WAREHOUSING', label: 'Warehousing' },
  { value: 'LINING', label: 'Lining/Coating' },
  { value: 'CUSTOMS', label: 'Customs Broker' },
  { value: 'SCALE', label: 'Scale/Weigh Station' },
  { value: 'TRANSLOADING', label: 'Transloading Operator' },
  { value: 'INSPECTION', label: 'Inspection Service' },
  { value: 'MOBILEREPAIR', label: 'Mobile Repair' },
  { value: 'DRAYAGE', label: 'Drayage' },
  { value: 'LEASING', label: 'Leasing Company' },
  { value: 'CARBUILDER', label: 'Car Builder' },
  { value: 'PARTS', label: 'Parts Supplier' },
  { value: 'SIGNAL', label: 'Signal Contractor' },
  { value: 'MANAGEMENT', label: 'Management Company' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'FREIGHTFORWARDER', label: 'Freight Forwarder' },
  { value: 'ENGINEERING', label: 'Engineering/Construction' },
  { value: 'CHASSIS', label: 'Chassis Provider' },
  { value: 'LOCOMOTIVESHOP', label: 'Locomotive Shop' },
  { value: 'LOCOMOTIVELEASING', label: 'Locomotive Leasing' },
  { value: 'SWITCHING', label: 'Switching Railroad' },
  { value: 'TMS', label: 'TMS Platform' },
  { value: 'FUMIGATION', label: 'Fumigation' },
  { value: 'DEMURRAGE', label: 'Demurrage Consulting' },
  { value: 'TRACKING', label: 'Tracking Platform' },
  { value: 'EDI', label: 'EDI Provider' },
  { value: 'FLEETMGMT', label: 'Fleet Management' },
  { value: 'LOADPLAN', label: 'Load Planning' },
  { value: 'YARDMGMT', label: 'Yard Management' },
  { value: 'DEMURRAGESOFT', label: 'Demurrage Software' },
]

const TYPE_MAP = Object.fromEntries(FACILITY_TYPES.map(t => [t.value.toLowerCase(), t.label]))

export function SearchFilters({ states, totalResults, filteredResults }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const currentState = searchParams.get('state') || ''
  const currentType = searchParams.get('type') || ''
  const currentQuery = searchParams.get('q') || ''

  // Sync query input with URL params when they change externally (e.g. stat badge click)
  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const hasFilters = currentQuery || currentState || currentType

  function buildUrl(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    params.delete('page')
    return `/?${params.toString()}`
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ q: query || null }))
  }

  function removeFilter(key: string) {
    router.push(buildUrl({ [key]: null }))
  }

  function clearAll() {
    setQuery('')
    router.push('/')
  }

  const inputStyle = {
    backgroundColor: '#1a1a1a',
    borderColor: '#3d3d3d',
    color: '#ffffff',
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} role="search" className="rounded-xl shadow-sm border p-4 sm:p-6" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d' }}>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <label htmlFor="search-input" className="sr-only">Search by name, city, or state</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search by name, city, or state..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="state-filter" className="sr-only">Filter by state</label>
            <select
              id="state-filter"
              value={currentState}
              onChange={(e) => router.push(buildUrl({ state: e.target.value || null }))}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
              style={inputStyle}
            >
              <option value="" style={{ backgroundColor: '#1a1a1a' }}>All States</option>
              {states.map((s) => (
                <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="sr-only">Filter by facility type</label>
            <select
              id="type-filter"
              value={currentType}
              onChange={(e) => router.push(buildUrl({ type: e.target.value || null }))}
              className="px-4 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
              style={inputStyle}
            >
              <option value="" style={{ backgroundColor: '#1a1a1a' }}>All Types ({FACILITY_TYPES.length})</option>
              {FACILITY_TYPES.map((t) => (
                <option key={t.value} value={t.value.toLowerCase()} style={{ backgroundColor: '#1a1a1a' }}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg transition hover:opacity-90 text-sm font-medium"
            style={{ backgroundColor: '#e65100', color: '#ffffff' }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Active filters + result count */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-sm" style={{ color: '#a0a0a0' }}>
          {hasFilters
            ? `Showing ${filteredResults.toLocaleString()} of ${totalResults.toLocaleString()} facilities`
            : `${totalResults.toLocaleString()} facilities`
          }
        </p>

        {hasFilters && (
          <>
            <span className="text-sm" style={{ color: '#3d3d3d' }}>|</span>

            {currentQuery && (
              <button
                onClick={() => removeFilter('q')}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(230, 81, 0, 0.12)',
                  border: '1px solid rgba(230, 81, 0, 0.3)',
                  color: '#ff7043',
                }}
              >
                &ldquo;{currentQuery}&rdquo;
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove search query filter</span>
              </button>
            )}

            {currentState && (
              <button
                onClick={() => removeFilter('state')}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(230, 81, 0, 0.12)',
                  border: '1px solid rgba(230, 81, 0, 0.3)',
                  color: '#ff7043',
                }}
              >
                {currentState}
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove state filter</span>
              </button>
            )}

            {currentType && (
              <button
                onClick={() => removeFilter('type')}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition hover:opacity-80"
                style={{
                  backgroundColor: 'rgba(230, 81, 0, 0.12)',
                  border: '1px solid rgba(230, 81, 0, 0.3)',
                  color: '#ff7043',
                }}
              >
                {TYPE_MAP[currentType] || currentType}
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove type filter</span>
              </button>
            )}

            <button
              onClick={clearAll}
              className="text-xs hover:opacity-80 transition ml-1"
              style={{ color: '#e65100' }}
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  )
}
