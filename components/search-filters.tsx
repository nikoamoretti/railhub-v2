'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface SearchFiltersProps {
  states: string[]
}

// All facility types with display labels
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

export function SearchFilters({ states }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [state, setState] = useState(searchParams.get('state') || '')
  const [type, setType] = useState(searchParams.get('type') || '')
  
  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (state) params.set('state', state)
    if (type) params.set('type', type)
    router.push(`/?${params.toString()}`)
  }
  
  function handleClear() {
    setQuery('')
    setState('')
    setType('')
    router.push('/')
  }

  return (
    <form onSubmit={handleSearch} className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d' }}>
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, city, or state..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none"
          style={{ 
            backgroundColor: '#1a1a1a', 
            borderColor: '#3d3d3d', 
            color: '#ffffff',
            '--tw-ring-color': '#e65100'
          } as React.CSSProperties}
        />
        
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none"
          style={{ 
            backgroundColor: '#1a1a1a', 
            borderColor: '#3d3d3d', 
            color: '#ffffff',
            '--tw-ring-color': '#e65100'
          } as React.CSSProperties}
        >
          <option value="" style={{ backgroundColor: '#1a1a1a' }}>All States</option>
          {states.map((s) => (
            <option key={s} value={s} style={{ backgroundColor: '#1a1a1a' }}>{s}</option>
          ))}
        </select>
        
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none"
          style={{ 
            backgroundColor: '#1a1a1a', 
            borderColor: '#3d3d3d', 
            color: '#ffffff',
            '--tw-ring-color': '#e65100'
          } as React.CSSProperties}
        >
          <option value="" style={{ backgroundColor: '#1a1a1a' }}>All Types ({FACILITY_TYPES.length})</option>
          {FACILITY_TYPES.map((t) => (
            <option key={t.value} value={t.value.toLowerCase()} style={{ backgroundColor: '#1a1a1a' }}>{t.label}</option>
          ))}
        </select>
        
        <button
          type="submit"
          className="px-6 py-2 rounded-lg transition hover:opacity-90"
          style={{ backgroundColor: '#e65100', color: '#ffffff' }}
        >
          Search
        </button>
        
        {(query || state || type) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-2 hover:opacity-80 transition"
            style={{ color: '#a0a0a0' }}
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}