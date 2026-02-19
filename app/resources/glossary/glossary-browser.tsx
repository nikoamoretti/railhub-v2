'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import type { GlossaryTerm } from '@/lib/resource-types'
import { ResourceSearch } from '@/components/resources/resource-search'
import { AlphabetFilter } from '@/components/resources/alphabet-filter'

interface GlossaryBrowserProps {
  terms: GlossaryTerm[]
  categories: string[]
}

export function GlossaryBrowser({ terms, categories }: GlossaryBrowserProps) {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)

  const onSearch = useCallback((q: string) => setQuery(q), [])

  const availableLetters = useMemo(
    () => new Set(terms.map(t => t.term[0].toUpperCase())),
    [terms]
  )

  const filtered = useMemo(() => {
    let result = terms
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.abbreviation?.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      )
    }
    if (letter) {
      result = result.filter(t => t.term[0].toUpperCase() === letter)
    }
    if (category) {
      result = result.filter(t => t.category === category)
    }
    return result.sort((a, b) => a.term.localeCompare(b.term))
  }, [terms, query, letter, category])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <ResourceSearch
            placeholder="Search terms, abbreviations, definitions..."
            onSearch={onSearch}
          />
        </div>
        <div>
          <label htmlFor="category-filter" className="sr-only">Filter by category</label>
          <select
            id="category-filter"
            value={category || ''}
            onChange={(e) => setCategory(e.target.value || null)}
            className="w-full px-3 py-3 border rounded-lg text-sm focus:ring-2 focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
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
        {filtered.length} term{filtered.length !== 1 ? 's' : ''}
        {(query || letter || category) && ' matching filters'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(term => (
          <Link
            key={term.slug}
            href={`/resources/glossary/${term.slug}`}
            className="block rounded-xl border p-5 transition hover:border-[var(--accent)]"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                {term.term}
                {term.abbreviation && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--accent-text)' }}>
                    ({term.abbreviation})
                  </span>
                )}
              </h3>
              <span
                className="badge flex-shrink-0"
                style={{
                  background: 'var(--badge-gray-bg)',
                  borderColor: 'var(--badge-gray-border)',
                  color: 'var(--badge-gray-text)',
                }}
              >
                {term.category}
              </span>
            </div>
            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {term.definition}
            </p>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No terms found</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try a different search or clear your filters.
          </p>
        </div>
      )}
    </div>
  )
}
