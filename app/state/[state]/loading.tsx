export default function StateLoading() {
  return (
    <main>
      {/* Header skeleton */}
      <div className="py-8 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="skeleton h-9 w-72" />
          <div className="skeleton h-5 w-40 mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter skeleton */}
        <div className="skeleton h-20 w-full rounded-xl" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
