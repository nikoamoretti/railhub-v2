'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  searchParams: { [key: string]: string | undefined }
  basePath?: string
}

function pageHref(params: Record<string, string | undefined>, basePath: string, page: number) {
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== 'page') p.set(key, value)
  }
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

const btnStyle = {
  backgroundColor: 'var(--bg-overlay)',
  borderColor: 'var(--border-default)',
  color: 'var(--text-primary)',
}

const btnDisabledStyle = {
  backgroundColor: 'var(--bg-input)',
  borderColor: 'var(--border-subtle)',
  color: 'var(--text-muted)',
}

export function Pagination({ currentPage, totalPages, searchParams, basePath = '/' }: PaginationProps) {
  const router = useRouter()
  const [jumpValue, setJumpValue] = useState('')

  function handleJump(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseInt(jumpValue, 10)
    if (!isNaN(parsed)) {
      const page = Math.max(1, Math.min(totalPages, parsed))
      router.push(pageHref(searchParams, basePath,page))
      setJumpValue('')
    }
  }

  // Build page numbers to show: first, last, and a window around current
  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | '...')[] = []
    pages.push(1)

    if (currentPage > 3) pages.push('...')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('...')

    pages.push(totalPages)
    return pages
  }

  return (
    <nav className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={pageHref(searchParams, basePath,currentPage - 1)}
          className="px-3 py-2 border rounded-lg transition hover:opacity-80 text-sm"
          style={btnStyle}
          aria-label="Go to previous page"
        >
          <span aria-hidden="true">&larr; </span>Previous
        </Link>
      ) : (
        <span
          className="px-3 py-2 border rounded-lg text-sm cursor-not-allowed"
          style={btnDisabledStyle}
          aria-disabled="true"
        >
          <span aria-hidden="true">&larr; </span>Previous
        </span>
      )}

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`dots-${idx}`} className="px-2 py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={pageHref(searchParams, basePath,page)}
              className="px-3 py-2 border rounded-lg text-sm transition hover:opacity-80"
              style={page === currentPage
                ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: '#ffffff' }
                : btnStyle
              }
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={pageHref(searchParams, basePath,currentPage + 1)}
          className="px-3 py-2 border rounded-lg transition hover:opacity-80 text-sm"
          style={btnStyle}
          aria-label="Go to next page"
        >
          Next<span aria-hidden="true"> &rarr;</span>
        </Link>
      ) : (
        <span
          className="px-3 py-2 border rounded-lg text-sm cursor-not-allowed"
          style={btnDisabledStyle}
          aria-disabled="true"
        >
          Next<span aria-hidden="true"> &rarr;</span>
        </span>
      )}

      {/* Jump to page */}
      <form onSubmit={handleJump} className="flex items-center gap-2 ml-2">
        <label htmlFor="page-jump" className="sr-only">Jump to page</label>
        <input
          id="page-jump"
          type="number"
          min={1}
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          placeholder="Page #"
          className="w-20 px-2 py-2 border rounded-lg text-sm text-center focus:ring-2 focus:outline-none"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        />
        <button
          type="submit"
          className="px-3 py-2 border rounded-lg text-sm transition hover:opacity-80"
          style={btnStyle}
        >
          Go
        </button>
      </form>
    </nav>
  )
}
