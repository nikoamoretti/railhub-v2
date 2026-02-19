'use client'

import { useState, useMemo, useCallback } from 'react'
import type { CommodityGroup } from '@/lib/resource-types'
import { ResourceSearch } from '@/components/resources/resource-search'

interface CommodityTreeProps {
  groups: CommodityGroup[]
}

export function CommodityTree({ groups }: CommodityTreeProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const onSearch = useCallback((q: string) => {
    setQuery(q)
    if (q) {
      // Auto-expand matching groups
      const matching = new Set<string>()
      const ql = q.toLowerCase()
      for (const g of groups) {
        const groupMatches = g.name.toLowerCase().includes(ql) || g.stccPrefix.includes(ql)
        const subMatches = g.subgroups.some(
          s => s.name.toLowerCase().includes(ql) || s.stccCode.includes(ql)
        )
        if (groupMatches || subMatches) matching.add(g.stccPrefix)
      }
      setExpanded(matching)
    }
  }, [groups])

  const filtered = useMemo(() => {
    if (!query) return groups
    const ql = query.toLowerCase()
    return groups.filter(g =>
      g.name.toLowerCase().includes(ql) ||
      g.stccPrefix.includes(ql) ||
      g.description.toLowerCase().includes(ql) ||
      g.subgroups.some(s => s.name.toLowerCase().includes(ql) || s.stccCode.includes(ql))
    )
  }, [groups, query])

  function toggleGroup(prefix: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(prefix)) {
        next.delete(prefix)
      } else {
        next.add(prefix)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <ResourceSearch
        placeholder="Search commodity groups, codes, descriptions..."
        onSearch={onSearch}
      />

      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {filtered.length} group{filtered.length !== 1 ? 's' : ''}
        {query && ' matching search'}
      </p>

      <div className="space-y-2">
        {filtered.map(group => {
          const isExpanded = expanded.has(group.stccPrefix)
          return (
            <div
              key={group.stccPrefix}
              className="rounded-xl border overflow-hidden"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => toggleGroup(group.stccPrefix)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left transition hover:opacity-90"
                aria-expanded={isExpanded}
              >
                <span
                  className="text-lg font-mono font-bold w-10 text-center flex-shrink-0"
                  style={{ color: 'var(--accent-text)' }}
                >
                  {group.stccPrefix}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {group.name}
                  </span>
                  <span className="text-sm ml-2" style={{ color: 'var(--text-muted)' }}>
                    ({group.subgroups.length} subgroups)
                  </span>
                </div>
                <span
                  className="text-sm transition-transform flex-shrink-0"
                  style={{
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  }}
                >
                  &#9654;
                </span>
              </button>

              {isExpanded && (
                <div
                  className="border-t px-5 py-4"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                    {group.description}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>STCC</th>
                          <th className="text-left py-2 pr-4 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Name</th>
                          <th className="text-left py-2 font-semibold" style={{ color: 'var(--text-tertiary)' }}>NMFC Class</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.subgroups.map(sub => (
                          <tr key={sub.stccCode} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td className="py-2 pr-4 font-mono" style={{ color: 'var(--accent-text)' }}>
                              {sub.stccCode}
                            </td>
                            <td className="py-2 pr-4" style={{ color: 'var(--text-primary)' }}>
                              {sub.name}
                            </td>
                            <td className="py-2" style={{ color: 'var(--text-secondary)' }}>
                              {sub.nmfcClass || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No commodity groups found</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try a different search term.
          </p>
        </div>
      )}
    </div>
  )
}
