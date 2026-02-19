'use client'

import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <header className="py-12 px-4 text-center page-header-gradient">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            An unexpected error occurred. Please try again.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-overlay)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
