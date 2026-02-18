import facilitiesData from '../data'

export default function DebugPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="bg-green-100 p-4 rounded mb-4">
        <h2 className="font-semibold">Data Status:</h2>
        <p className="text-lg">✅ {facilitiesData.length} facilities loaded</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold">Sample Facilities:</h2>
        <ul className="mt-2 space-y-1">
          {facilitiesData.slice(0, 3).map((f: any) => (
            <li key={f.id}>{f.name} - {f.location?.city}, {f.location?.state}</li>
          ))}
        </ul>
      </div>
    </main>
  )
}