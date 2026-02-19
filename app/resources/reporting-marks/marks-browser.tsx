'use client'

import { useState, useCallback, useMemo } from 'react'
import type { ReportingMark } from '@/lib/resource-types'
import { ResourceSearch } from '@/components/resources/resource-search'
import { AlphabetFilter } from '@/components/resources/alphabet-filter'

interface MarksBrowserProps {
  marks: ReportingMark[]
  types: string[]
}

const typeBadgeStyles: Record<string, { bg: string; border: string; text: string }> = {
  'Class I': { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  'Class II': { bg: 'var(--badge-indigo-bg)', border: 'var(--badge-indigo-border)', text: 'var(--badge-indigo-text)' },
  'Class III': { bg: 'var(--badge-purple-bg)', border: 'var(--badge-purple-border)', text: 'var(--badge-purple-text)' },
  'Shortline': { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  'Terminal': { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  'Leasing': { bg: 'var(--badge-cyan-bg)', border: 'var(--badge-cyan-border)', text: 'var(--badge-cyan-text)' },
  'Private': { bg: 'var(--badge-gray-bg)', border: 'var(--badge-gray-border)', text: 'var(--badge-gray-text)' },
}

export function MarksBrowser({ marks, types }: MarksBrowserProps) {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const onSearch = useCallback((q: string) => setQuery(q), [])

  const availableLetters = useMemo(
    () => new Set(marks.map(m => m.mark[0].toUpperCase())),
    [marks]
  )

  const filtered = useMemo(() => {
    let result = marks
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(m =>
        m.mark.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.parentCompany?.toLowerCase().includes(q) ||
        m.headquarters?.toLowerCase().includes(q)
      )
    }
    if (letter) {
      result = result.filter(m => m.mark[0].toUpperCase() === letter)
    }
    if (typeFilter) {
      result = result.filter(m => m.type === typeFilter)
    }
    return result.sort((a, b) => a.mark.localeCompare(b.mark))
  }, [marks, query, letter, typeFilter])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <ResourceSearch
            placeholder="Search marks, railroad names, headquarters..."
            onSearch={onSearch}
          />
        </div>
        <div>
          <label htmlFor="type-filter" className="sr-only">Filter by type</label>
          <select
            id="type-filter"
            value={typeFilter || ''}
            onChange={(e) => setTypeFilter(e.target.value || null)}
            className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Types</option>
            {types.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <AlphabetFilter
        activeLetter={letter}
        availableLetters={availableLetters}
        onSelect={setLetter}
      />

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {filtered.length} mark{filtered.length !== 1 ? 's' : ''}
        {(query || letter || typeFilter) && ' matching filters'}
      </p>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Mark</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Name</th>
                <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell" style={{ color: 'var(--text-tertiary)' }}>Type</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--text-tertiary)' }}>Headquarters</th>
                <th className="text-right px-4 py-3 font-semibold hidden lg:table-cell" style={{ color: 'var(--text-tertiary)' }}>Miles</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const badge = typeBadgeStyles[m.type] || typeBadgeStyles['Private']
                return (
                  <tr
                    key={m.mark}
                    className="transition hover:opacity-90"
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--accent-text)' }}>
                      {m.mark}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                      {m.name}
                      {m.parentCompany && (
                        <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>
                          ({m.parentCompany})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="badge" style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {m.headquarters || '—'}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {m.milesOperated ? m.milesOperated.toLocaleString() : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No marks found</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try a different search or clear your filters.
          </p>
        </div>
      )}
    </div>
  )
}
