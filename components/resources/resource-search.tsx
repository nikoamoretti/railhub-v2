'use client'

import { useState, useEffect, useRef } from 'react'

interface ResourceSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
}

export function ResourceSearch({ placeholder = 'Search...', onSearch, debounceMs = 200 }: ResourceSearchProps) {
  const [value, setValue] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onSearch(value), debounceMs)
    return () => clearTimeout(timerRef.current)
  }, [value, debounceMs, onSearch])

  return (
    <div className="relative">
      <label htmlFor="resource-search" className="sr-only">{placeholder}</label>
      <input
        id="resource-search"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none text-sm"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
        }}
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm transition hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  )
}
