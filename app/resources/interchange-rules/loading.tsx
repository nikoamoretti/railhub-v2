export default function Loading() {
  return (
    <main>
      <div className="py-10 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-4 w-48 mb-4" />
          <div className="skeleton h-10 w-64" />
          <div className="skeleton h-5 w-80 mt-3" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="skeleton h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="skeleton h-36 rounded-xl" />
              <div className="skeleton h-36 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
