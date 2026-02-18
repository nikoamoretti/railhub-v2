'use client'

import { useState } from 'react'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState('commtrex')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('source', source)

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Import Facilities</h1>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Data Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="commtrex">Commtrex</option>
                <option value="manual">Manual Import</option>
                <option value="scraped">Scraped Data</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Expected columns: id, name, street_address, city, state, zip_code, phone, 
                description, product_types, railroads, track_capacity, etc.
              </p>
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Importing...' : 'Import Data'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-700">{result.imported}</div>
                  <div className="text-sm text-green-600">Imported</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{result.updated}</div>
                  <div className="text-sm text-blue-600">Updated</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">{result.failed}</div>
                  <div className="text-sm text-red-600">Failed</div>
                </div>
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-700">Errors (first 10):</p>
                  <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                    {result.errors.join('\n')}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <a href="/" className="text-blue-600 hover:underline">
            ← Back to directory
          </a>
        </div>
      </div>
    </main>
  )
}