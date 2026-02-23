export default function Loading() {
  return (
    <main>
      <div className="py-10 px-4" style={{ background: 'var(--bg-elevated)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="skeleton h-4 w-32 mb-4" />
          <div className="skeleton h-9 w-52" />
          <div className="skeleton h-5 w-96 mt-3" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    </main>
  )
}
