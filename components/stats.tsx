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
        <div key={type} className="backdrop-blur rounded-lg px-6 py-3" style={{ backgroundColor: 'rgba(45, 45, 45, 0.8)' }}>
          <div className="text-2xl font-bold" style={{ color: '#e65100' }}>{count.toLocaleString()}</div>
          <div className="text-xs" style={{ color: '#a0a0a0' }}>{TYPE_LABELS[type] || type.replace(/_/g, ' ')}</div>
        </div>
      ))}
      <div className="backdrop-blur rounded-lg px-6 py-3 border-2" style={{ backgroundColor: 'rgba(230, 81, 0, 0.2)', borderColor: 'rgba(230, 81, 0, 0.5)' }}>
        <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{totalCount.toLocaleString()}</div>
        <div className="text-xs" style={{ color: '#a0a0a0' }}>Total Locations</div>
      </div>
    </div>
  )
}