import Link from 'next/link'

export default function NotFound() {
  return (
    <main>
      <header className="py-16 px-4 text-center page-header-gradient">
        <div className="max-w-2xl mx-auto">
          <p className="text-7xl font-bold" style={{ color: 'var(--accent)' }}>404</p>
          <h1 className="text-2xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
            Page not found
          </h1>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Try one of these instead:
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            Browse All Facilities
          </Link>
          <Link
            href="/states"
            className="px-5 py-2.5 rounded-lg text-sm font-medium border transition hover:opacity-80"
            style={{
              backgroundColor: 'var(--accent-muted)',
              borderColor: 'var(--accent-border)',
              color: 'var(--accent-text)',
            }}
          >
            Browse by State
          </Link>
        </div>
      </div>
    </main>
  )
}
