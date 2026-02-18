const fs = require('fs')
const xlsx = require('xlsx')

// Helper functions
function parseTrackCapacity(capString) {
  if (!capString || typeof capString !== 'string') return null
  const match = capString.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

function cleanPhone(phone) {
  if (!phone) return null
  const str = String(phone).trim()
  if (str === 'none provided' || str === '-') return null
  return str
}

function cleanDescription(desc) {
  if (!desc) return null
  return String(desc).replace(/This is a Commtrex Verified location\./gi, '').trim()
}

// Convert Team Tracks (most detailed)
function convertTeamTracks(worksheet) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} team tracks...`)
  
  return data.map((row, i) => ({
    id: `teamtrack-${i}`,
    external_id: `teamtrack-${i}`,
    name: row['Facility Name'] || 'Team Track',
    type: 'TEAM_TRACK',
    status: 'ACTIVE',
    phone: cleanPhone(row['Phone']),
    email: row['Email'] || null,
    website: row['Website'] || null,
    description: cleanDescription(row['Description']),
    about: cleanDescription(row['Notes']),
    location: {
      street_address: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip'] ? String(row['Zip']) : null,
      country: 'US',
      latitude: row['Latitude'] || null,
      longitude: row['Longitude'] || null
    },
    capabilities: {
      track_capacity: parseTrackCapacity(row['Capacity']),
      railcar_spot_count: null,
      hazmat_certified: false,
      food_grade: false,
      kosher_certified: false,
      has_scale: false,
      has_railcar_storage: false,
      is_24_7: row['Hours'] && String(row['Hours']).includes('24'),
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: row['Equipment'] ? String(row['Equipment']).split(',').map(s => s.trim()).filter(Boolean) : [],
      storage_options: null,
      transfer_modes: row['Services'] ? String(row['Services']).split(',').map(s => s.trim()).filter(Boolean) : [],
      product_types: [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: false,
      hours_monday: row['Hours'] || null
    },
    categories: [],
    railroads: row['Railroad'] ? [{ railroad: { name: String(row['Railroad']) } }] : []
  }))
}

// Convert Repair Shops
function convertRepairShops(worksheet) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} repair shops...`)
  
  return data.map((row, i) => ({
    id: `repair-${i}`,
    external_id: `repair-${i}`,
    name: row['Facility Name'] || 'Railcar Repair Shop',
    type: 'REPAIR_SHOP',
    status: 'ACTIVE',
    phone: cleanPhone(row['Phone']),
    email: null,
    website: null,
    description: row['Services Offered'] ? String(row['Services Offered']) : null,
    about: null,
    location: {
      street_address: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip Code'] ? String(row['Zip Code']) : null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: null,
      railcar_spot_count: null,
      hazmat_certified: false,
      food_grade: false,
      kosher_certified: false,
      has_scale: false,
      has_railcar_storage: false,
      is_24_7: false,
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: null,
      transfer_modes: [],
      product_types: [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: false
    },
    categories: [],
    railroads: row['Delivering Carrier'] ? 
      String(row['Delivering Carrier']).split('/').map(r => ({ railroad: { name: r.trim() } })) : []
  }))
}

// Convert Tank Wash Stations
function convertTankWash(worksheet) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} tank wash stations...`)
  
  return data.map((row, i) => ({
    id: `tankwash-${i}`,
    external_id: `tankwash-${i}`,
    name: row['Facility Name'] || 'Tank Wash Station',
    type: 'TANK_WASH',
    status: 'ACTIVE',
    phone: cleanPhone(row['Phone']),
    email: null,
    website: null,
    description: row['Services Offered'] ? String(row['Services Offered']) : null,
    about: null,
    location: {
      street_address: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip Code'] ? String(row['Zip Code']) : null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: null,
      railcar_spot_count: null,
      hazmat_certified: true,
      food_grade: String(row['Services Offered'] || '').includes('Food'),
      kosher_certified: String(row['Services Offered'] || '').includes('Kosher'),
      has_scale: false,
      has_railcar_storage: false,
      is_24_7: false,
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: null,
      transfer_modes: [],
      product_types: [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: false
    },
    categories: [],
    railroads: []
  }))
}

// Convert Intermodal Terminals
function convertIntermodal(worksheet) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} intermodal terminals...`)
  
  return data.map((row, i) => ({
    id: `intermodal-${i}`,
    external_id: `intermodal-${i}`,
    name: row['Facility Name'] || 'Intermodal Terminal',
    type: 'INTERMODAL',
    status: 'ACTIVE',
    phone: null,
    email: null,
    website: null,
    description: null,
    about: null,
    location: {
      street_address: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip'] ? String(row['Zip']) : null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: null,
      railcar_spot_count: null,
      hazmat_certified: false,
      food_grade: false,
      kosher_certified: false,
      has_scale: false,
      has_railcar_storage: false,
      is_24_7: row['Hours'] && String(row['Hours']).includes('24'),
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: null,
      transfer_modes: ['Container to Rail', 'Container to Truck', 'Rail to Container', 'Rail to Truck'],
      product_types: [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: false
    },
    categories: [],
    railroads: row['Railroad'] ? [{ railroad: { name: String(row['Railroad']) } }] : []
  }))
}

// Convert Bulk Transfer Terminals
function convertBulkTransfer(worksheet) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} bulk transfer terminals...`)
  
  return data.map((row, i) => ({
    id: `bulktransfer-${i}`,
    external_id: `bulktransfer-${i}`,
    name: row['Facility Name'] || 'Bulk Transfer Terminal',
    type: 'BULK_TRANSFER',
    status: 'ACTIVE',
    phone: null,
    email: null,
    website: null,
    description: row['Commodities'] ? `Handles: ${row['Commodities']}` : null,
    about: null,
    location: {
      street_address: row['Address'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip'] ? String(row['Zip']) : null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: null,
      railcar_spot_count: null,
      hazmat_certified: false,
      food_grade: false,
      kosher_certified: false,
      has_scale: true,
      has_railcar_storage: false,
      is_24_7: false,
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: null,
      transfer_modes: ['Rail to Truck', 'Truck to Rail'],
      product_types: row['Commodities'] ? String(row['Commodities']).split(',').map(s => s.trim()).filter(Boolean) : [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: true
    },
    categories: [],
    railroads: row['Railroad'] ? [{ railroad: { name: String(row['Railroad']) } }] : []
  }))
}

// Generic converter for simple databases
function convertGeneric(worksheet, type, typeLabel) {
  const data = xlsx.utils.sheet_to_json(worksheet)
  console.log(`Converting ${data.length} ${typeLabel}...`)
  
  return data.map((row, i) => ({
    id: `${type}-${i}`,
    external_id: `${type}-${i}`,
    name: row['Facility Name'] || row['Company Name'] || row['Operator'] || `${typeLabel} ${i}`,
    type: type.toUpperCase(),
    status: 'ACTIVE',
    phone: cleanPhone(row['Phone']),
    email: row['Email'] || null,
    website: row['Website'] || null,
    description: row['Services'] || row['Services Offered'] || row['Description'] || null,
    about: row['Notes'] || row['Description'] || null,
    location: {
      street_address: row['Address'] || row['Street'] || null,
      city: row['City'] || null,
      state: row['State'] || null,
      zip_code: row['Zip'] || row['Zip Code'] ? String(row['Zip'] || row['Zip Code']) : null,
      country: 'US',
      latitude: null,
      longitude: null
    },
    capabilities: {
      track_capacity: null,
      railcar_spot_count: null,
      hazmat_certified: false,
      food_grade: false,
      kosher_certified: false,
      has_scale: false,
      has_railcar_storage: false,
      is_24_7: false,
      weight_restricted_263k: false,
      weight_restricted_286k: false,
      equipment_list: [],
      storage_options: null,
      transfer_modes: [],
      product_types: [],
      security_features: [],
      cities_served: [],
      heating_capabilities: false,
      onsite_railcar_storage: false,
      onsite_scale: false
    },
    categories: [],
    railroads: []
  }))
}

console.log('Loading all rail databases...\n')

const allFacilities = []

// Load team tracks
const wb1 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/team_tracks_database.xlsx')
allFacilities.push(...convertTeamTracks(wb1.Sheets[wb1.SheetNames[0]]))

// Load repair shops
const wb2 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/US_Railcar_Repair_Shops_Database.xlsx')
allFacilities.push(...convertRepairShops(wb2.Sheets[wb2.SheetNames[0]]))

// Load tank wash
const wb3 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/US_Railcar_Tank_Wash_Cleaning_Stations_Database.xlsx')
allFacilities.push(...convertTankWash(wb3.Sheets[wb3.SheetNames[0]]))

// Load intermodal
const wb4 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/US_Intermodal_Ramps_Terminals_Database.xlsx')
allFacilities.push(...convertIntermodal(wb4.Sheets[wb4.SheetNames[0]]))

// Load bulk transfer
const wb5 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/US_Bulk_Transfer_Terminals_Database.xlsx')
allFacilities.push(...convertBulkTransfer(wb5.Sheets[wb5.SheetNames[0]]))

// Load railcar manufacturing
const wb6 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/US_Railcar_Manufacturing_Rebuilding_Database.xlsx')
allFacilities.push(...convertGeneric(wb6.Sheets[wb6.SheetNames[0]], 'manufacturing', 'railcar manufacturing facilities'))

// Load shortline railroads
const wb7 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/shortline_regional_railroads.xlsx')
allFacilities.push(...convertGeneric(wb7.Sheets[wb7.SheetNames[0]], 'shortline', 'shortline railroads'))

// Load rail-served warehousing
const wb8 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/rail_served_warehousing_EXPANDED.xlsx')
allFacilities.push(...convertGeneric(wb8.Sheets[wb8.SheetNames[0]], 'warehousing', 'rail-served warehouses'))

// Load transloading operators
const wb9 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/transloading_operators.xlsx')
allFacilities.push(...convertGeneric(wb9.Sheets[wb9.SheetNames[0]], 'transloading', 'transloading operators'))

// Load scale/weigh stations
const wb10 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/scale_weigh_stations_EXPANDED.xlsx')
allFacilities.push(...convertGeneric(wb10.Sheets[wb10.SheetNames[0]], 'scale', 'scale/weigh stations'))

// Load railcar leasing companies
const wb11 = xlsx.readFile('/Users/nico-yardlogix/Downloads/Kimi_Agent_Railcar Leasing Ads Sites/railcar_leasing_companies_EXPANDED.xlsx')
allFacilities.push(...convertGeneric(wb11.Sheets[wb11.SheetNames[0]], 'leasing', 'railcar leasing companies'))

console.log(`\nTotal new facilities: ${allFacilities.length}`)

// Save
fs.writeFileSync('/tmp/new_facilities.json', JSON.stringify(allFacilities, null, 2))
console.log('Saved to /tmp/new_facilities.json')