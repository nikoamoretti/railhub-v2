'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const primaryLinks = [
  { href: '/map', label: 'Map' },
  { href: '/states', label: 'Browse States' },
  { href: '/railroads', label: 'Railroads' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/industry', label: 'Industry Data' },
  { href: '/resources', label: 'Resources' },
]

const moreLinks = [
  { href: '/organizations', label: 'Organizations' },
  { href: '/cross-border', label: 'Cross-Border' },
  { href: '/real-estate', label: 'Real Estate' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [moreOpen])

  const isMoreActive = moreLinks.some(l => pathname === l.href)

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--bg-nav)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg"
          style={{ color: 'var(--text-primary)' }}
        >
          <span aria-hidden="true">🚂</span>
          <span>Railhub</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {primaryLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition hover:opacity-80"
              style={{
                color: pathname === link.href ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="text-sm font-medium transition hover:opacity-80 flex items-center gap-1"
              style={{
                color: isMoreActive ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              More
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`}
              >
                <path d="M3 4.5L6 7.5L9 4.5" />
              </svg>
            </button>

            {moreOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-lg border shadow-lg py-1"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-default)',
                }}
              >
                {moreLinks.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2 text-sm font-medium transition hover:opacity-80"
                    style={{
                      color: pathname === link.href ? 'var(--accent-text)' : 'var(--text-secondary)',
                      backgroundColor: pathname === link.href ? 'var(--accent-muted)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg transition"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          aria-label="Toggle navigation menu"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div
          id="mobile-nav-menu"
          className="sm:hidden border-t px-4 py-3"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {[...primaryLinks, ...moreLinks].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-sm font-medium"
              style={{
                color: pathname === link.href ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
