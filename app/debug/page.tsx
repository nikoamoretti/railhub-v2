import { prisma } from '@/lib/db'

export default async function DebugPage() {
  let facilityCount = 0
  let error = null
  let envCheck = {
    databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'NOT SET',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
  }
  
  try {
    facilityCount = await prisma.facility.count()
  } catch (e: any) {
    error = e.message
  }
  
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold">Environment:</h2>
        <pre className="text-sm">{JSON.stringify(envCheck, null, 2)}</pre>
      </div>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold">Database:</h2>
        <p>Facility count: {facilityCount}</p>
        {error && (
          <div className="text-red-600 mt-2">
            <p className="font-semibold">Error:</p>
            <pre className="text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
      
      {!error && facilityCount === 0 && (
        <div className="bg-yellow-100 p-4 rounded">
          <p>Database connected but no facilities found.</p>
          <p>Import is running in background.</p>
        </div>
      )}
    </main>
  )
}