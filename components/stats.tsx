'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeType = searchParams.get('type')

  const topTypes = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  function handleBadgeClick(type: string) {
    const params = new URLSearchParams(searchParams.toString())
    const typeValue = type.toLowerCase()

    if (activeType === typeValue) {
      params.delete('type')
    } else {
      params.set('type', typeValue)
    }
    params.delete('page')
    router.push(`/?${params.toString()}`)
  }

  function handleTotalClick() {
    router.push('/')
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-8" role="group" aria-label="Filter by facility type">
      {topTypes.map(([type, count]) => {
        const isActive = activeType === type.toLowerCase()
        return (
          <button
            key={type}
            onClick={() => handleBadgeClick(type)}
            className="backdrop-blur rounded-lg px-5 py-3 transition-all duration-150 cursor-pointer border"
            style={{
              backgroundColor: isActive ? 'rgba(230, 81, 0, 0.25)' : 'rgba(45, 45, 45, 0.8)',
              borderColor: isActive ? '#e65100' : 'transparent',
            }}
            aria-pressed={isActive}
            title={`Filter by ${TYPE_LABELS[type] || type}`}
          >
            <div className="text-2xl font-bold" style={{ color: isActive ? '#ff7043' : '#e65100' }}>
              {count.toLocaleString()}
            </div>
            <div className="text-xs" style={{ color: isActive ? '#ffffff' : '#a0a0a0' }}>
              {TYPE_LABELS[type] || type.replace(/_/g, ' ')}
            </div>
          </button>
        )
      })}
      <button
        onClick={handleTotalClick}
        className="backdrop-blur rounded-lg px-5 py-3 border-2 transition-all duration-150 cursor-pointer"
        style={{
          backgroundColor: !activeType ? 'rgba(230, 81, 0, 0.2)' : 'rgba(45, 45, 45, 0.8)',
          borderColor: !activeType ? 'rgba(230, 81, 0, 0.5)' : 'transparent',
        }}
        aria-pressed={!activeType}
        title="Show all facilities"
      >
        <div className="text-2xl font-bold" style={{ color: '#ffffff' }}>{totalCount.toLocaleString()}</div>
        <div className="text-xs" style={{ color: '#a0a0a0' }}>Total Locations</div>
      </button>
    </div>
  )
}
