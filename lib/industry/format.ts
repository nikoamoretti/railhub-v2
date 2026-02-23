import type { MetricType, AdvisoryType, RegulatoryAgency } from '@prisma/client'

export function formatMetricType(type: MetricType): string {
  const map: Record<MetricType, string> = {
    TRAIN_SPEED: 'Train Speed',
    TERMINAL_DWELL: 'Terminal Dwell',
    CARS_ON_LINE: 'Cars on Line',
    CARLOADS_ORIGINATED: 'Carloads Originated',
    INTERMODAL_VOLUME: 'Intermodal Volume',
  }
  return map[type] || type
}

export function formatMetricUnit(unit: string): string {
  const map: Record<string, string> = {
    mph: 'mph',
    hours: 'hrs',
    carloads: 'carloads',
    units: 'units',
  }
  return map[unit] || unit
}

export function formatAdvisoryType(type: AdvisoryType): string {
  const map: Record<AdvisoryType, string> = {
    EMBARGO: 'Embargo',
    SERVICE_ALERT: 'Service Alert',
    WEATHER_ADVISORY: 'Weather Advisory',
    MAINTENANCE_NOTICE: 'Maintenance Notice',
  }
  return map[type] || type
}

export function formatAgency(agency: RegulatoryAgency): string {
  const map: Record<RegulatoryAgency, string> = {
    STB: 'Surface Transportation Board',
    FRA: 'Federal Railroad Administration',
    PHMSA: 'Pipeline & Hazardous Materials Safety',
    AAR: 'Association of American Railroads',
  }
  return map[agency] || agency
}

export function formatAgencyShort(agency: RegulatoryAgency): string {
  return agency
}

export function formatChangePercent(current: number, previous: number): string {
  if (previous === 0) return 'N/A'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export function formatReportWeek(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (hours < 1) return 'Just now'
  if (hours === 1) return '1 hour ago'
  if (hours < 24) return `${hours} hours ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  return `${weeks} weeks ago`
}
