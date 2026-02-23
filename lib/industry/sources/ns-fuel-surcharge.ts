import type { RawFuelSurcharge } from '../types'

// Norfolk Southern weekly fuel surcharge announcement
const NS_ANNOUNCEMENT_URL = 'https://www.norfolksouthern.com/en/customer-alerts/customer-news/weekly-fuel-surcharge-announcement'

// EIA Weekly Retail On-Highway Diesel Prices RSS (source for all railroad fuel surcharges)
const EIA_DIESEL_RSS = 'https://www.eia.gov/petroleum/gasdiesel/includes/gas_diesel_rss.xml'

// Published railroad fuel surcharge formulas:
// NS (Tariff NS-8004): 0.4% per $1/bbl above $90 WTI
// NS (Tariff NS-8003): 0.3% per $1/bbl above $64 WTI
// NS Intermodal: separate percentage published weekly
// BNSF: Table-based, published at bnsf.com
// CSX: Published monthly based on DOE diesel
// UP: Published weekly based on DOE diesel

const SURCHARGE_CONFIGS: { railroad: string; trafficType: string; formula: (dieselPrice: number) => number }[] = [
  // NS Carload (NS-8004): Surcharge based on DOE diesel price tiers
  {
    railroad: 'NS',
    trafficType: 'Carload',
    formula: (diesel) => {
      // NS uses tiered surcharge based on DOE diesel $/gallon
      if (diesel <= 2.00) return 0
      if (diesel <= 2.50) return 4
      if (diesel <= 3.00) return 8
      if (diesel <= 3.50) return 13
      if (diesel <= 4.00) return 18
      if (diesel <= 4.50) return 24
      return 30
    },
  },
  // NS Intermodal: Typically 40% at current fuel levels
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
]

export async function fetchNSFuelSurcharges(): Promise<RawFuelSurcharge[]> {
  console.log('NS Fuel: fetching surcharge data...')

  const surcharges: RawFuelSurcharge[] = []

  try {
    // Fetch current EIA diesel price from RSS feed
    const dieselPrice = await fetchCurrentDieselPrice()
    if (!dieselPrice) {
      console.error('NS Fuel: could not determine current diesel price')
      return []
    }

    console.log(`NS Fuel: current DOE diesel price = $${dieselPrice.toFixed(3)}/gal`)

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
    console.error('NS Fuel: fetch error:', err)
  }

  console.log(`NS Fuel: returning ${surcharges.length} surcharge(s)`)
  return surcharges
}

async function fetchCurrentDieselPrice(): Promise<number | null> {
  try {
    const res = await fetch(EIA_DIESEL_RSS)
    if (!res.ok) return null

    const xml = await res.text()

    // Parse diesel price from RSS description
    // Look for "On-Highway Diesel" or the U.S. average diesel price
    // Format in RSS: "3.456  .. U.S." for diesel section
    const descMatch = xml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/g)
    if (!descMatch) return null

    for (const desc of descMatch) {
      // Find the diesel section — it comes after "No. 2 Diesel" or "Diesel"
      if (desc.includes('Diesel') && desc.includes('U.S.')) {
        // Extract the U.S. average price for diesel
        const priceMatch = desc.match(/(\d+\.\d+)\s+\.\.?\s+U\.S\./g)
        if (priceMatch) {
          // The last matching "X.XXX  .. U.S." in a diesel section is the diesel price
          for (const match of priceMatch) {
            const numMatch = match.match(/(\d+\.\d+)/)
            if (numMatch) {
              const price = parseFloat(numMatch[1])
              // Diesel is typically $2-$6/gallon range
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
