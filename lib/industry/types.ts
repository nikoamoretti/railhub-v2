// Standalone types — no Prisma dependency

export type MetricType = 'TRAIN_SPEED' | 'TERMINAL_DWELL' | 'CARS_ON_LINE' | 'CARLOADS_ORIGINATED' | 'INTERMODAL_VOLUME'
export type AdvisoryType = 'EMBARGO' | 'SERVICE_ALERT' | 'WEATHER_ADVISORY' | 'MAINTENANCE_NOTICE'
export type RegulatoryAgency = 'STB' | 'FRA' | 'PHMSA' | 'AAR'

export interface RailServiceMetric {
  id: string
  railroad: string
  metricType: MetricType
  value: number
  unit: string
  reportWeek: string
  commodity: string
  createdAt: string
}

export interface FuelSurcharge {
  id: string
  railroad: string
  effectiveDate: string
  fuelPrice: number | null
  surchargeRate: number
  trafficType: string
  createdAt: string
}

export interface ServiceAdvisory {
  id: string
  externalId: string
  railroad: string
  advisoryType: AdvisoryType
  title: string
  description: string
  affectedArea?: string
  slug: string
  isActive: boolean
  issuedAt: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface RegulatoryUpdate {
  id: string
  externalId: string
  agency: RegulatoryAgency
  updateType: string
  title: string
  summary: string
  content?: string
  documentUrl?: string
  docketNumber?: string
  slug: string
  publishedAt: string
  createdAt: string
}

// Raw types used by cron source fetchers
export interface RawMetricData {
  railroad: string
  metricType: MetricType
  value: number
  unit: string
  reportWeek: Date
  commodity?: string
}

export interface RawFuelSurcharge {
  railroad: string
  effectiveDate: Date
  fuelPrice?: number
  surchargeRate: number
  trafficType?: string
}

export interface RawAdvisory {
  externalId: string
  railroad: string
  advisoryType: AdvisoryType
  title: string
  description: string
  affectedArea?: string
  issuedAt: Date
  expiresAt?: Date
}

export interface RawRegulatoryUpdate {
  externalId: string
  agency: RegulatoryAgency
  updateType: string
  title: string
  summary: string
  content?: string
  documentUrl?: string
  docketNumber?: string
  publishedAt: Date
}

export type FetchResult =
  | { type: 'metrics'; items: RawMetricData[] }
  | { type: 'fuel_surcharges'; items: RawFuelSurcharge[] }
  | { type: 'advisories'; items: RawAdvisory[] }
  | { type: 'regulatory'; items: RawRegulatoryUpdate[] }

// Re-export aliases the cron routes expect
export type { RailServiceMetric as DataFeedSource }
export type { RailServiceMetric as DataFeedLog }

export interface MetricWithTrend extends RailServiceMetric {
  previousValue?: number
  changePercent?: number
}

export interface IndustryStats {
  totalMetrics: number
  totalAdvisories: number
  activeEmbargoes: number
  lastUpdated: Date | null
}

export interface FreightTrendPoint {
  date: string
  carloads: number | null
  carloadsSA: number | null
  intermodal: number | null
  intermodalSA: number | null
  tsiFreight: number | null
  ppiRail: number | null
  cassFreight: number | null
}
