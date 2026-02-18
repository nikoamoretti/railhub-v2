'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface SearchFiltersProps {
  states: string[]
}

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
    <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, city, or state..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="transload">Transload</option>
          <option value="storage">Storage</option>
        </select>
        
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Search
        </button>
        
        {(query || state || type) && (
          <button
            type="button"
            onClick={handleClear}
            className="px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  )
}