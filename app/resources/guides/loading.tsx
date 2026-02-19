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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  )
}
