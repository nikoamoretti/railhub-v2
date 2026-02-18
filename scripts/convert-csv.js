const fs = require('fs')
const { parse } = require('csv-parse/sync')

function parseRailroads(railroadString) {
  if (!railroadString || railroadString === 'none provided') return []
  
  // Split by semicolon to get different railroad entries
  const entries = railroadString.split(';').map(e => e.trim()).filter(Boolean)
  
  return entries.map(entry => {
    // Extract railroad name before the dash (e.g., "BNSF - Mon, Tue, Wed")
    const match = entry.match(/^([A-Z&]+)\s*-/)
    if (match) {
      return {
        railroad: { name: match[1] },
        daysOfWeek: null,
        notes: null
      }
    }
    // If no dash, just use the whole string
    return {
      railroad: { name: entry },
      daysOfWeek: null,
      notes: null
    }
  }).filter(r => r.railroad.name && r.railroad.name.length > 1)
}

function parseProductTypes(typesString) {
  if (!typesString) return []
  return typesString.split(';').map(t => t.trim()).filter(Boolean)
}

function parseTransferModes(modesString) {
  if (!modesString) return []
  return modesString.split(';').map(m => m.trim()).filter(Boolean)
}

function parseEquipment(equipString) {
  if (!equipString || equipString === 'none provided') return []
  
  // First, normalize semicolons
  let normalized = equipString
  
  // Fix concatenated patterns - insert semicolon before Title-Case patterns
  // Pattern: lowercase or space followed by capital letter that starts an equipment name
  // e.g., "TruckCross-Dock" → "Truck; Cross-Dock"
  // e.g., "EndRamp" → "End; Ramp"
  // e.g., "RailDock" → "Rail; Dock"
  
  // Common equipment patterns that start with capital letters
  const equipmentPatterns = [
    'Conveyor', 'Crane', 'Cross-Dock', 'Dock', 'Forklift', 'Loader', 'Pump',
    'Scale', 'Silo', 'Tanks', 'Telehandler', 'Locomotive', 'Railcar', 'Mobile',
    'Gantry', 'Magnet', 'Pipe', 'Switch', 'Vacu-Lift', 'Walinga', 'Ramp'
  ]
  
  // Create a regex that matches any of these patterns preceded by lowercase or end of word
  const pattern = new RegExp('(?<=[a-z0-9])(' + equipmentPatterns.join('|') + ')', 'g')
  normalized = normalized.replace(pattern, '; $1')
  
  // Also fix cases like "Truck to RailDock" → "Truck to Rail; Dock"
  const pattern2 = /(?<=[a-z0-9])(Cross-Dock|Dock|Forklift|Loader|Pump|Silo|Tanks|Telehandler|Locomotive|Railcar|Mobile|Gantry|Magnet|Pipe|Switch|Ramp)/g
  normalized = normalized.replace(pattern2, '; $1')
  
  // Clean up double semicolons and split
  return normalized
    .split(';')
    .map(e => e.trim())
    .filter(Boolean)
}

function parseTrackCapacity(capString) {
  if (!capString || capString === 'none provided') return null
  const match = capString.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

function parseHazmat(hazString) {
  return hazString === 'Yes'
}

function cleanDescription(desc) {
  if (!desc) return null
  // Remove "This is a Commtrex Verified location." and variants
  return desc
    .replace(/This is a Commtrex Verified location\./gi, '')
    .replace(/This is a Commtrex Verified location/gi, '')
    .trim()
}

function parse24_7(hours) {
  // Check if any day has "Open 24 hours"
  return [hours.hours_mon, hours.hours_tue, hours.hours_wed, 
          hours.hours_thu, hours.hours_fri, hours.hours_sat, hours.hours_sun]
    .some(h => h && h.includes('24 hours'))
}

function convertTransloadRow(row, index) {
  const id = `transload-${row.id || index}`
  
  return {
    id,
    external_id: row.id,
    name: row.name,
    type: 'TRANSLOAD',
    status: 'ACTIVE',
    phone: row.phone && row.phone !== 'none provided' ? row.phone : null,
    email: null,
    website: row.url,
    description: cleanDescription(row.description),
    about: cleanDescription(row.about),
    location: {
      street_address: row.street_address && row.street_address !== 'none provided' ? row.street_address : null,
      city: row.city,
      state: row.state,
      zip_code: row.zip_code,
      country: row.country || 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: parseTrackCapacity(row.track_capacity),
      railcar_spot_count: null,
      hazmat_certified: parseHazmat(row.hazmat_handling),
      food_grade: row.product_types && row.product_types.includes('Food Grade'),
      kosher_certified: false,
      has_scale: row.equipment && row.equipment.includes('Scale'),
      has_railcar_storage: row.storage_options && row.storage_options.includes('Railcar'),
      is_24_7: parse24_7(row),
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: parseEquipment(row.equipment),
      storage_options: row.storage_options && row.storage_options !== '--' ? row.storage_options.split(',').map(s => s.trim()) : null,
      transfer_modes: parseTransferModes(row.transfer_modes),
      product_types: parseProductTypes(row.product_types),
      hours_monday: row.hours_mon,
      hours_tuesday: row.hours_tue,
      hours_wednesday: row.hours_wed,
      hours_thursday: row.hours_thu,
      hours_friday: row.hours_fri,
      hours_saturday: row.hours_sat,
      hours_sunday: row.hours_sun
    },
    categories: parseProductTypes(row.product_types).map(name => ({
      category: { name, type: 'PRODUCT' }
    })),
    railroads: parseRailroads(row.railroads)
  }
}

function convertStorageRow(row, index) {
  const id = `storage-${row.id || index}`
  
  return {
    id,
    external_id: row.id,
    name: row.name,
    type: 'STORAGE',
    status: 'ACTIVE',
    phone: row.phone || null,
    email: null,
    website: row.url,
    description: cleanDescription(row.about),
    about: cleanDescription(row.about),
    location: {
      street_address: null,
      city: row.city,
      state: row.state,
      zip_code: null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: parseTrackCapacity(row.capacity),
      railcar_spot_count: null,
      hazmat_certified: row.hazmat_suited === 'Yes',
      food_grade: row.facility_types && row.facility_types.includes('Food Grade'),
      kosher_certified: false,
      has_scale: row.rail_services && row.rail_services.includes('Scale'),
      has_railcar_storage: true,
      is_24_7: false,
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: row.facility_types ? row.facility_types.split(',').map(s => s.trim()) : null,
      transfer_modes: [],
      product_types: [],
      hours_monday: null,
      hours_tuesday: null,
      hours_wednesday: null,
      hours_thursday: null,
      hours_friday: null,
      hours_saturday: null,
      hours_sunday: null
    },
    categories: [],
    railroads: parseRailroads(row.interchange_railroads)
  }
}

console.log('Reading transload CSV...')
const transloadCsv = fs.readFileSync('/tmp/railhub-deploy/commtrex_facilities.csv', 'utf8')
const transloadRecords = parse(transloadCsv, {
  columns: true,
  skip_empty_lines: true
})
console.log(`Found ${transloadRecords.length} transload records`)

console.log('Reading storage CSV...')
const storageCsv = fs.readFileSync('/tmp/railhub-deploy/commtrex_railcar_storage.csv', 'utf8')
const storageRecords = parse(storageCsv, {
  columns: true,
  skip_empty_lines: true
})
console.log(`Found ${storageRecords.length} storage records`)

console.log('Converting transload facilities...')
const transloadFacilities = transloadRecords.map((row, i) => convertTransloadRow(row, i))

console.log('Converting storage facilities...')
const storageFacilities = storageRecords.map((row, i) => convertStorageRow(row, i))

const allFacilities = [...transloadFacilities, ...storageFacilities]
console.log(`Total: ${allFacilities.length} facilities`)

// Write JSON file
fs.writeFileSync('public/facilities.json', JSON.stringify(allFacilities, null, 2))
console.log('Saved to public/facilities.json')
console.log(`File size: ${(fs.statSync('public/facilities.json').size / 1024 / 1024).toFixed(2)} MB`)