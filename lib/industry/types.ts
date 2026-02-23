import type {
  RailServiceMetric,
  FuelSurcharge,
  ServiceAdvisory,
  RegulatoryUpdate,
  DataFeedSource,
  DataFeedLog,
  MetricType,
  AdvisoryType,
  RegulatoryAgency,
} from '@prisma/client'

export type {
  RailServiceMetric,
  FuelSurcharge,
  ServiceAdvisory,
  RegulatoryUpdate,
  DataFeedSource,
  DataFeedLog,
  MetricType,
  AdvisoryType,
  RegulatoryAgency,
}

// Raw types returned by source fetchers

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

// Frontend display types

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
