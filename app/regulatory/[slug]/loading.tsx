export default function Loading() {
  return (
    <main>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="skeleton h-4 w-32 mb-6" />
        <div className="flex gap-2 mb-4">
          <div className="skeleton h-6 w-16 rounded-full" />
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
        <div className="skeleton h-8 w-3/4 mb-4" />
        <div className="skeleton h-4 w-64 mb-6" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    </main>
  )
}
