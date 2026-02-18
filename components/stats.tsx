interface StatsProps {
  transloadCount: number
  storageCount: number
  totalCount: number
}

export function Stats({ transloadCount, storageCount, totalCount }: StatsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-8 mt-8">
      <div className="bg-white/10 backdrop-blur rounded-lg px-8 py-4">
        <div className="text-3xl font-bold">{transloadCount.toLocaleString()}</div>
        <div className="text-sm opacity-80">Transload Facilities</div>
      </div>
      <div className="bg-white/10 backdrop-blur rounded-lg px-8 py-4">
        <div className="text-3xl font-bold">{storageCount.toLocaleString()}</div>
        <div className="text-sm opacity-80">Storage Facilities</div>
      </div>
      <div className="bg-white/10 backdrop-blur rounded-lg px-8 py-4">
        <div className="text-3xl font-bold">{totalCount.toLocaleString()}</div>
        <div className="text-sm opacity-80">Total Locations</div>
      </div>
    </div>
  )
}