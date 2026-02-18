interface StatsProps {
  counts: { [key: string]: number }
  totalCount: number
}

const TYPE_LABELS: { [key: string]: string } = {
  TRANSLOAD: 'Transload',
  STORAGE: 'Storage',
  TEAM_TRACK: 'Team Tracks',
  BULK_TRANSFER: 'Bulk Transfer',
  REPAIR_SHOP: 'Repair Shops',
  INTERMODAL: 'Intermodal',
  TANK_WASH: 'Tank Wash',
  MANUFACTURING: 'Manufacturing',
}

export function Stats({ counts, totalCount }: StatsProps) {
  // Show top 6 types + total
  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-8">
      {topTypes.map(([type, count]) => (
        <div key={type} className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
          <div className="text-2xl font-bold">{count.toLocaleString()}</div>
          <div className="text-xs opacity-80">{TYPE_LABELS[type] || type.replace(/_/g, ' ')}</div>
        </div>
      ))}
      <div className="bg-white/20 backdrop-blur rounded-lg px-6 py-3 border-2 border-white/30">
        <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
        <div className="text-xs opacity-80">Total Locations</div>
      </div>
    </div>
  )
}