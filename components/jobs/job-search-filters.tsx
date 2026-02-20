'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { formatJobType, formatWorkMode } from '@/lib/jobs/format'
import type { JobFilterOptions } from '@/lib/jobs/types'

interface JobSearchFiltersProps {
  filterOptions: JobFilterOptions
  totalResults: number
  filteredResults: number
}

const SORT_OPTIONS = [
  { value: '', label: 'Newest' },
  { value: 'salary_desc', label: 'Salary (high to low)' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'company_asc', label: 'Company A-Z' },
]

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY'] as const
const WORK_MODES = ['ONSITE', 'REMOTE', 'HYBRID'] as const

export function JobSearchFilters({ filterOptions, totalResults, filteredResults }: JobSearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const currentState = searchParams.get('state') || ''
  const currentCompany = searchParams.get('company') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentJobType = searchParams.get('jobType') || ''
  const currentWorkMode = searchParams.get('workMode') || ''
  const currentSort = searchParams.get('sort') || ''
  const currentQuery = searchParams.get('q') || ''

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  const hasFilters = currentQuery || currentState || currentCompany || currentCategory || currentJobType || currentWorkMode

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
    return qs ? `/jobs?${qs}` : '/jobs'
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
    router.push('/jobs')
  }

  const selectClass = 'px-3 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm'
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
        {/* Row 1: Search + filters */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="job-search-input" className="sr-only">Search jobs by title, company, or location</label>
            <input
              id="job-search-input"
              type="text"
              placeholder="Search jobs, companies, locations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:outline-none text-sm"
              style={selectStyle}
            />
          </div>

          <div>
            <label htmlFor="job-state-filter" className="sr-only">Filter by state</label>
            <select id="job-state-filter" value={currentState} onChange={(e) => router.push(buildUrl({ state: e.target.value || null }))} className={selectClass} style={selectStyle}>
              <option value="" style={optionStyle}>All States</option>
              {filterOptions.states.map((s) => (
                <option key={s.value} value={s.value} style={optionStyle}>{s.value} ({s.count})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-type-filter" className="sr-only">Filter by job type</label>
            <select id="job-type-filter" value={currentJobType} onChange={(e) => router.push(buildUrl({ jobType: e.target.value || null }))} className={selectClass} style={selectStyle}>
              <option value="" style={optionStyle}>All Types</option>
              {JOB_TYPES.map((t) => (
                <option key={t} value={t} style={optionStyle}>{formatJobType(t)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-mode-filter" className="sr-only">Filter by work mode</label>
            <select id="job-mode-filter" value={currentWorkMode} onChange={(e) => router.push(buildUrl({ workMode: e.target.value || null }))} className={selectClass} style={selectStyle}>
              <option value="" style={optionStyle}>All Modes</option>
              {WORK_MODES.map((m) => (
                <option key={m} value={m} style={optionStyle}>{formatWorkMode(m)}</option>
              ))}
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

        {/* Row 2: Category + Company + Sort */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <label htmlFor="job-category-filter" className="sr-only">Filter by category</label>
            <select id="job-category-filter" value={currentCategory} onChange={(e) => router.push(buildUrl({ category: e.target.value || null }))} className="text-xs px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none" style={selectStyle}>
              <option value="" style={optionStyle}>All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c.value} value={c.value} style={optionStyle}>{c.value} ({c.count})</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="job-company-filter" className="sr-only">Filter by company</label>
            <select id="job-company-filter" value={currentCompany} onChange={(e) => router.push(buildUrl({ company: e.target.value || null }))} className="text-xs px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none" style={selectStyle}>
              <option value="" style={optionStyle}>All Companies</option>
              {filterOptions.companies.map((c) => (
                <option key={c.slug} value={c.slug} style={optionStyle}>{c.value} ({c.count})</option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <label htmlFor="job-sort-by" className="text-xs mr-1" style={{ color: 'var(--text-tertiary)' }}>Sort:</label>
            <select
              id="job-sort-by"
              value={currentSort}
              onChange={(e) => router.push(buildUrl({ sort: e.target.value || null }))}
              className="text-xs px-2 py-1.5 border rounded-md focus:ring-2 focus:outline-none"
              style={selectStyle}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} style={optionStyle}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </form>

      {/* Active filters + result count */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {hasFilters
            ? `Showing ${filteredResults.toLocaleString()} of ${totalResults.toLocaleString()} jobs`
            : `${totalResults.toLocaleString()} jobs`
          }
        </p>

        {hasFilters && (
          <>
            <span className="text-sm" style={{ color: 'var(--border-default)' }}>|</span>

            {currentQuery && (
              <button onClick={() => removeFilter('q')} className="filter-chip">
                &ldquo;{currentQuery}&rdquo;
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {currentState && (
              <button onClick={() => removeFilter('state')} className="filter-chip">
                {currentState}
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {currentJobType && (
              <button onClick={() => removeFilter('jobType')} className="filter-chip">
                {formatJobType(currentJobType)}
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {currentWorkMode && (
              <button onClick={() => removeFilter('workMode')} className="filter-chip">
                {formatWorkMode(currentWorkMode)}
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {currentCategory && (
              <button onClick={() => removeFilter('category')} className="filter-chip">
                {currentCategory}
                <span aria-hidden="true">&times;</span>
              </button>
            )}
            {currentCompany && (
              <button onClick={() => removeFilter('company')} className="filter-chip">
                Company
                <span aria-hidden="true">&times;</span>
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
