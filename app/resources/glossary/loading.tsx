export default function Loading() {
  return (
    <main>
      <div className="py-10 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-4 w-48 mb-4" />
          <div className="skeleton h-10 w-72" />
          <div className="skeleton h-5 w-96 mt-3" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="skeleton h-12 w-full rounded-lg" />
        <div className="skeleton h-8 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
