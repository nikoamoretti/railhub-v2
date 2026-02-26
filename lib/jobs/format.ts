export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function formatSalary(min?: number | null, max?: number | null, period?: string | null): string | null {
  if (!min && !max) return null

  const fmt = (n: number) => {
    if (period === 'HOURLY') return `$${n}`
    if (n >= 1000) return `$${Math.round(n / 1000)}K`
    return `$${n}`
  }

  const suffix = period === 'HOURLY' ? '/hr' : period === 'YEARLY' ? '/yr' : ''

  if (min && max) return `${fmt(min)}-${fmt(max)}${suffix}`
  if (min) return `${fmt(min)}+${suffix}`
  if (max) return `Up to ${fmt(max)}${suffix}`
  return null
}

export function formatPostedDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function formatJobType(type: string): string {
  const map: Record<string, string> = {
    FULL_TIME: 'Full-time',
    PART_TIME: 'Part-time',
    CONTRACT: 'Contract',
    INTERNSHIP: 'Internship',
    TEMPORARY: 'Temporary',
  }
  return map[type] || type
}

export function formatWorkMode(mode: string): string {
  const map: Record<string, string> = {
    ONSITE: 'On-site',
    REMOTE: 'Remote',
    HYBRID: 'Hybrid',
  }
  return map[mode] || mode
}

export function formatExperienceLevel(level: string): string {
  const map: Record<string, string> = {
    ENTRY: 'Entry Level',
    MID: 'Mid Level',
    SENIOR: 'Senior',
    EXECUTIVE: 'Executive',
  }
  return map[level] || level
}
