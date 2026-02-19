'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { FACILITY_TYPES, TYPE_LABEL_MAP_LOWER } from '@/lib/facility-types'

interface SearchFiltersProps {
  states: string[]
  railroads: string[]
  totalResults: number
  filteredResults: number
  basePath?: string
  hideStateFilter?: boolean
}

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'state', label: 'State' },
  { value: 'capacity_desc', label: 'Capacity (high to low)' },
]

export function SearchFilters({ states, railroads, totalResults, filteredResults, basePath = '/', hideStateFilter = false }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const currentState = searchParams.get('state') || ''
  const currentType = searchParams.get('type') || ''
  const currentRailroad = searchParams.get('railroad') || ''
  const currentSort = searchParams.get('sort') || ''
  const currentQuery = searchParams.get('q') || ''

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const hasFilters = currentQuery || currentState || currentType || currentRailroad

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
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
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
    router.push(basePath)
  }

  const selectClass = "px-3 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
  const selectStyle = {
    backgroundColor: 'var(--bg-input)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  }
  const optionStyle = { backgroundColor: 'var(--bg-input)' }

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSearch}
        role="search"
        className="rounded-xl border p-4 sm:p-5"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        {/* Row 1: Search + primary filters */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search-input" className="sr-only">Search by name, city, or state</label>
            <input
              id="search-input"
              type="text"
              placeholder="Search facilities, cities, states..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
              style={selectStyle}
            />
          </div>

          {!hideStateFilter && (
            <div>
              <label htmlFor="state-filter" className="sr-only">Filter by state</label>
              <select id="state-filter" value={currentState} onChange={(e) => router.push(buildUrl({ state: e.target.value || null }))} className={selectClass} style={selectStyle}>
                <option value="" style={optionStyle}>All States</option>
                {states.map((s) => <option key={s} value={s} style={optionStyle}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="type-filter" className="sr-only">Filter by facility type</label>
            <select id="type-filter" value={currentType} onChange={(e) => router.push(buildUrl({ type: e.target.value || null }))} className={selectClass} style={selectStyle}>
              <option value="" style={optionStyle}>All Types</option>
              {FACILITY_TYPES.map((t) => <option key={t.value} value={t.value.toLowerCase()} style={optionStyle}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="railroad-filter" className="sr-only">Filter by railroad</label>
            <select id="railroad-filter" value={currentRailroad} onChange={(e) => router.push(buildUrl({ railroad: e.target.value || null }))} className={selectClass} style={selectStyle}>
              <option value="" style={optionStyle}>All Railroads</option>
              {railroads.map((rr) => <option key={rr} value={rr} style={optionStyle}>{rr}</option>)}
            </select>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg transition hover:opacity-90 text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            Search
          </button>
        </div>

        {/* Row 2: Sort */}
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <label htmlFor="sort-by" className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Sort by:</label>
          <select
            id="sort-by"
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value || null }))}
            className="text-xs px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none"
            style={selectStyle}
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value} style={optionStyle}>{o.label}</option>)}
          </select>
        </div>
      </form>

      {/* Active filters + result count */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {hasFilters
            ? `Showing ${filteredResults.toLocaleString()} of ${totalResults.toLocaleString()} facilities`
            : `${totalResults.toLocaleString()} facilities`
          }
        </p>

        {hasFilters && (
          <>
            <span className="text-sm" style={{ color: 'var(--border-default)' }}>|</span>

            {currentQuery && (
              <button onClick={() => removeFilter('q')} className="filter-chip">
                &ldquo;{currentQuery}&rdquo;
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove search filter</span>
              </button>
            )}

            {currentState && (
              <button onClick={() => removeFilter('state')} className="filter-chip">
                {currentState}
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove state filter</span>
              </button>
            )}

            {currentType && (
              <button onClick={() => removeFilter('type')} className="filter-chip">
                {TYPE_LABEL_MAP_LOWER[currentType] || currentType}
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove type filter</span>
              </button>
            )}

            {currentRailroad && (
              <button onClick={() => removeFilter('railroad')} className="filter-chip">
                {currentRailroad}
                <span aria-hidden="true">&times;</span>
                <span className="sr-only">Remove railroad filter</span>
              </button>
            )}

            <button onClick={clearAll} className="text-xs hover:opacity-80 transition ml-1" style={{ color: 'var(--accent)' }}>
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  )
}
