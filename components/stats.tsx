'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { getTypeLabel } from '@/lib/facility-types'

interface StatsProps {
  counts: { [key: string]: number }
  totalCount: number
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
    <div className="stats-bar flex flex-wrap justify-center gap-2 mt-8" role="group" aria-label="Filter by facility type">
      {topTypes.map(([type, count]) => {
        const isActive = activeType === type.toLowerCase()
        return (
          <button
            key={type}
            onClick={() => handleBadgeClick(type)}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer border"
            style={{
              backgroundColor: isActive ? 'var(--accent-muted)' : 'var(--bg-card)',
              borderColor: isActive ? 'var(--accent)' : 'var(--border-default)',
              color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
            aria-pressed={isActive}
            title={`Filter by ${getTypeLabel(type)}`}
          >
            <span className="font-bold" style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-primary)' }}>
              {count.toLocaleString()}
            </span>
            {' '}
            {getTypeLabel(type)}
          </button>
        )
      })}
      <button
        onClick={handleTotalClick}
        className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer border"
        style={{
          backgroundColor: !activeType ? 'var(--accent-muted)' : 'var(--bg-card)',
          borderColor: !activeType ? 'var(--accent-border)' : 'var(--border-default)',
          color: !activeType ? 'var(--accent-text)' : 'var(--text-secondary)',
        }}
        aria-pressed={!activeType}
        title="Show all facilities"
      >
        <span className="font-bold" style={{ color: !activeType ? 'var(--accent-text)' : 'var(--text-primary)' }}>
          {totalCount.toLocaleString()}
        </span>
        {' '}
        Total
      </button>
    </div>
  )
}
