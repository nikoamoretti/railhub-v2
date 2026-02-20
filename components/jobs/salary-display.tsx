import type { SalaryPeriod } from '@prisma/client'
import { formatSalary } from '@/lib/jobs/format'

interface SalaryDisplayProps {
  min?: number | null
  max?: number | null
  period?: SalaryPeriod | null
}

export function SalaryDisplay({ min, max, period }: SalaryDisplayProps) {
  const formatted = formatSalary(min, max, period)
  if (!formatted) return null

  return (
    <span className="text-sm font-semibold" style={{ color: 'var(--badge-green-text)' }}>
      {formatted}
    </span>
  )
}
