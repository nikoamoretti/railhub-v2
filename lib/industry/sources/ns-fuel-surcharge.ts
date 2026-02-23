import type { RawFuelSurcharge } from '../types'

// EIA Weekly Retail On-Highway Diesel Prices RSS (source for all railroad fuel surcharges)
const EIA_DIESEL_RSS = 'https://www.eia.gov/petroleum/gasdiesel/includes/gas_diesel_rss.xml'

// All Class I railroads base fuel surcharges on EIA/DOE weekly retail diesel prices.
// Formulas sourced from publicly available tariff data:
//   NS:   Tariff NS-8004 (Carload), NS-8003 (Intermodal) — tiered %
//   UP:   Tariff UP 6004 Revenue-Based HDF — formula: 1.5% + 0.5% per $0.05 above $1.35/gal
//   BNSF: Rules Book 6100 Item 3377 — tiered % (approximate, exact table behind login)
//   CSX:  Publication 8661-C — tiered % (approximate, exact methodology behind login)

interface SurchargeConfig {
  railroad: string
  trafficType: string
  formula: (dieselPrice: number) => number
}

const SURCHARGE_CONFIGS: SurchargeConfig[] = [
  // ── Norfolk Southern ───────────────────────────────────────
  {
    railroad: 'NS',
    trafficType: 'Carload',
    formula: (diesel) => {
      if (diesel <= 2.00) return 0
      if (diesel <= 2.50) return 4
      if (diesel <= 3.00) return 8
      if (diesel <= 3.50) return 13
      if (diesel <= 4.00) return 18
      if (diesel <= 4.50) return 24
      return 30
    },
  },
  {
    railroad: 'NS',
    trafficType: 'Intermodal',
    formula: (diesel) => {
      if (diesel <= 2.00) return 0
      if (diesel <= 2.50) return 15
      if (diesel <= 3.00) return 25
      if (diesel <= 3.50) return 35
      if (diesel <= 4.00) return 40
      return 45
    },
  },

  // ── Union Pacific ──────────────────────────────────────────
  // UP Revenue-Based HDF (publicly published formula)
  // Strike: $1.35/gal, starts at 1.5%, +0.5% per $0.05 increment
  // Source: up.com/customers/surcharge/revenue
  {
    railroad: 'UP',
    trafficType: 'Carload',
    formula: (diesel) => {
      if (diesel < 1.35) return 0
      const steps = Math.floor((diesel - 1.35) / 0.05)
      return 1.5 + steps * 0.5
    },
  },
  // UP Intermodal — weekly %, approximate from published announcements
  {
    railroad: 'UP',
    trafficType: 'Intermodal',
    formula: (diesel) => {
      if (diesel < 1.35) return 0
      // UP intermodal uses a steeper curve than carload
      const steps = Math.floor((diesel - 1.35) / 0.05)
      return 2.0 + steps * 0.6
    },
  },

  // ── BNSF ───────────────────────────────────────────────────
  // Approximate — exact table behind customer.bnsf.com login
  // Strike: $2.50/gal per Rules Book 6100 Item 3377
  {
    railroad: 'BNSF',
    trafficType: 'Carload',
    formula: (diesel) => {
      if (diesel <= 2.50) return 0
      if (diesel <= 3.00) return 6
      if (diesel <= 3.50) return 12
      if (diesel <= 4.00) return 18
      if (diesel <= 4.50) return 24
      return 30
    },
  },
  {
    railroad: 'BNSF',
    trafficType: 'Intermodal',
    formula: (diesel) => {
      if (diesel <= 2.50) return 0
      if (diesel <= 3.00) return 10
      if (diesel <= 3.50) return 20
      if (diesel <= 4.00) return 30
      if (diesel <= 4.50) return 38
      return 44
    },
  },

  // ── CSX ────────────────────────────────────────────────────
  // Approximate — CSX publishes monthly rate only (Publication 8661-C)
  // Recent rates: ~13% at $3.50/gal, ~18% at $4.00/gal
  {
    railroad: 'CSX',
    trafficType: 'Carload',
    formula: (diesel) => {
      if (diesel <= 2.00) return 0
      if (diesel <= 2.50) return 5
      if (diesel <= 3.00) return 9
      if (diesel <= 3.50) return 13
      if (diesel <= 4.00) return 18
      if (diesel <= 4.50) return 24
      return 30
    },
  },
  {
    railroad: 'CSX',
    trafficType: 'Intermodal',
    formula: (diesel) => {
      if (diesel <= 2.00) return 0
      if (diesel <= 2.50) return 12
      if (diesel <= 3.00) return 22
      if (diesel <= 3.50) return 32
      if (diesel <= 4.00) return 38
      return 44
    },
  },
]

export async function fetchAllFuelSurcharges(): Promise<RawFuelSurcharge[]> {
  console.log('Fuel Surcharges: fetching for all carriers...')

  const surcharges: RawFuelSurcharge[] = []

  try {
    const dieselPrice = await fetchCurrentDieselPrice()
    if (!dieselPrice) {
      console.error('Fuel Surcharges: could not determine current diesel price')
      return []
    }

    console.log(`Fuel Surcharges: current DOE diesel price = $${dieselPrice.toFixed(3)}/gal`)

    const effectiveDate = getMondayOfCurrentWeek()

    for (const config of SURCHARGE_CONFIGS) {
      const surchargeRate = config.formula(dieselPrice)
      surcharges.push({
        railroad: config.railroad,
        effectiveDate,
        fuelPrice: dieselPrice,
        surchargeRate,
        trafficType: config.trafficType,
      })
    }
  } catch (err) {
    console.error('Fuel Surcharges: fetch error:', err)
  }

  console.log(`Fuel Surcharges: returning ${surcharges.length} surcharge(s)`)
  return surcharges
}

// Keep the old name as an alias for backward compatibility in the cron route import
export const fetchNSFuelSurcharges = fetchAllFuelSurcharges

async function fetchCurrentDieselPrice(): Promise<number | null> {
  try {
    const res = await fetch(EIA_DIESEL_RSS)
    if (!res.ok) return null

    const xml = await res.text()

    // Parse diesel price from RSS description
    // Format in RSS: "3.456  .. U.S." for diesel section
    const descMatch = xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/g)
    if (!descMatch) return null

    for (const desc of descMatch) {
      if (desc.includes('Diesel') && desc.includes('U.S.')) {
        const priceMatch = desc.match(/(\d+\.\d+)\s+\.\.?\s+U\.S\./g)
        if (priceMatch) {
          for (const match of priceMatch) {
            const numMatch = match.match(/(\d+\.\d+)/)
            if (numMatch) {
              const price = parseFloat(numMatch[1])
              if (price > 1.5 && price < 8) {
                return price
              }
            }
          }
        }
      }
    }

    return null
  } catch (err) {
    console.error('EIA diesel RSS error:', err)
    return null
  }
}

function getMondayOfCurrentWeek(): Date {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  return monday
}
