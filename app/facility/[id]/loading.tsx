export default function FacilityLoading() {
  return (
    <main>
      {/* Header skeleton */}
      <div className="py-8 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="skeleton h-4 w-40 mb-4" />
          <div className="flex gap-2 mt-4">
            <div className="skeleton h-6 w-20 rounded-full" />
            <div className="skeleton h-6 w-16 rounded-full" />
          </div>
          <div className="skeleton h-9 w-80 mt-3" />
          <div className="skeleton h-5 w-48 mt-2" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
