import type { RawMetricData } from '../types'
import type { MetricType } from '@prisma/client'

// USDA Agricultural Transportation Open Data — Socrata JSON API
// Each STB metric category is a separate dataset

const BASE_URL = 'https://agtransport.usda.gov/resource'

// Verified Socrata dataset IDs (returning fresh data as of Feb 2026)
const DATASETS: { id: string; metricType: MetricType; unit: string; valueField: string; commodityField?: string }[] = [
  { id: '2wy9-nmz4', metricType: 'TRAIN_SPEED', unit: 'mph', valueField: 'mph', commodityField: 'commodity' },
  { id: '9z94-b4fw', metricType: 'TERMINAL_DWELL', unit: 'hours', valueField: 'value' },
  { id: 'grdc-x6yk', metricType: 'CARS_ON_LINE', unit: 'carloads', valueField: 'cars' },
  { id: 'tb7q-kn5i', metricType: 'CARLOADS_ORIGINATED', unit: 'carloads', valueField: 'carloads', commodityField: 'commodity' },
]

const RAILROAD_MAP: Record<string, string> = {
  'BNSF': 'BNSF',
  'Union Pacific': 'UP',
  'UP': 'UP',
  'CSX': 'CSX',
  'CSXT': 'CSX',
  'CSX Transportation': 'CSX',
  'Norfolk Southern': 'NS',
  'NS': 'NS',
  'Canadian National': 'CN',
  'CN': 'CN',
  'Canadian Pacific Kansas City': 'CPKC',
  'CPKC': 'CPKC',
  'KCS': 'CPKC',
}

function normalizeRailroad(name: string): string {
  return RAILROAD_MAP[name] || name
}

export async function fetchUSDAMetrics(): Promise<RawMetricData[]> {
  console.log('USDA: fetching rail service metrics...')

  const metrics: RawMetricData[] = []

  for (const dataset of DATASETS) {
    try {
      // Fetch latest 100 rows ordered by date descending
      const url = `${BASE_URL}/${dataset.id}.json?$limit=100&$order=date%20DESC`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      })

      if (!res.ok) {
        console.error(`USDA ${dataset.metricType}: status ${res.status}`)
        continue
      }

      const rows = (await res.json()) as Record<string, string>[]
      console.log(`USDA ${dataset.metricType}: received ${rows.length} row(s)`)

      for (const row of rows) {
        const railroad = normalizeRailroad(row.railroad || '')
        if (!railroad) continue

        // For dwell time, skip individual yards — only keep "System Average"
        if (dataset.metricType === 'TERMINAL_DWELL' && row.yard && row.yard !== 'System Average') {
          continue
        }

        // For carloadings, only keep "Originated" type
        if (dataset.metricType === 'CARLOADS_ORIGINATED' && row.type && row.type !== 'Originated') {
          continue
        }

        const reportWeek = new Date(row.date || '')
        if (isNaN(reportWeek.getTime())) continue

        const rawValue = row[dataset.valueField]
        if (!rawValue) continue
        const value = parseFloat(String(rawValue).replace(/,/g, ''))
        if (isNaN(value)) continue

        const commodity = dataset.commodityField ? (row[dataset.commodityField] || undefined) : undefined

        metrics.push({
          railroad,
          metricType: dataset.metricType,
          value,
          unit: dataset.unit,
          reportWeek,
          commodity,
        })
      }
    } catch (err) {
      console.error(`USDA ${dataset.metricType}: fetch error:`, err)
    }
  }

  console.log(`USDA: returning ${metrics.length} metric(s)`)
  return metrics
}
