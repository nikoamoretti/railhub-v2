export default function Loading() {
  return (
    <main>
      {/* Hero skeleton */}
      <div className="py-10 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="skeleton h-10 w-64 mx-auto" />
          <div className="skeleton h-5 w-80 mx-auto mt-3" />
          <div className="flex justify-center gap-3 mt-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="skeleton h-24 w-full rounded-xl" />

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-52 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
