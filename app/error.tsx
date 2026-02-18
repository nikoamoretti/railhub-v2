'use client'

export default function Error({ error }: { error: Error }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-red-600">Error</h1>
      <pre className="mt-4 bg-gray-100 p-4 rounded">{error.message}</pre>
    </main>
  )
}
