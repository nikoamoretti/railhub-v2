const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function exportAllFacilities() {
  console.log('Exporting all facilities from Supabase...')
  
  // Get all facilities with pagination
  let allFacilities = []
  let page = 0
  const pageSize = 1000
  
  while (true) {
    const { data: facilities, error: facError } = await supabase
      .from('facilities')
      .select('*')
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
    
    if (facError) {
      console.error('Error fetching facilities:', facError)
      process.exit(1)
    }
    
    if (!facilities || facilities.length === 0) break
    
    allFacilities = allFacilities.concat(facilities)
    console.log(`Fetched page ${page + 1}: ${facilities.length} facilities`)
    
    if (facilities.length < pageSize) break
    page++
  }
  
  const facilities = allFacilities
  console.log(`Found ${facilities.length} total facilities`)
  
  // Get all locations
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
  
  if (locError) {
    console.error('Error fetching locations:', locError)
  }
  
  // Get all capabilities
  const { data: capabilities, error: capError } = await supabase
    .from('capabilities')
    .select('*')
  
  if (capError) {
    console.error('Error fetching capabilities:', capError)
  }
  
  // Get all facility_categories with category names
  const { data: facCats, error: fcError } = await supabase
    .from('facility_categories')
    .select('facility_id, category:categories(*)')
  
  if (fcError) {
    console.error('Error fetching categories:', fcError)
  }
  
  // Get all facility_railroads with railroad names
  const { data: facRails, error: frError } = await supabase
    .from('facility_railroads')
    .select('facility_id, railroad:railroads(*), days_of_week, notes')
  
  if (frError) {
    console.error('Error fetching railroads:', frError)
  }
  
  // Create lookup maps
  const locationMap = new Map(locations?.map(l => [l.facility_id, l]) || [])
  const capMap = new Map(capabilities?.map(c => [c.facility_id, c]) || [])
  
  // Group categories and railroads by facility
  const catsByFac = {}
  facCats?.forEach(fc => {
    if (!catsByFac[fc.facility_id]) catsByFac[fc.facility_id] = []
    catsByFac[fc.facility_id].push({ category: fc.category })
  })
  
  const railsByFac = {}
  facRails?.forEach(fr => {
    if (!railsByFac[fr.facility_id]) railsByFac[fr.facility_id] = []
    railsByFac[fr.facility_id].push({ 
      railroad: fr.railroad,
      daysOfWeek: fr.days_of_week,
      notes: fr.notes
    })
  })
  
  // Combine everything
  const fullFacilities = facilities.map(f => ({
    ...f,
    location: locationMap.get(f.id) || null,
    capabilities: capMap.get(f.id) || null,
    categories: catsByFac[f.id] || [],
    railroads: railsByFac[f.id] || []
  }))
  
  console.log(`Exported ${fullFacilities.length} complete facilities`)
  
  // Write to file in chunks to avoid memory issues
  const output = `const facilitiesData = ${JSON.stringify(fullFacilities, null, 2)} as any[]\n\nexport default facilitiesData`
  fs.writeFileSync('app/data.ts', output)
  
  console.log('Saved to app/data.ts')
  console.log(`File size: ${(fs.statSync('app/data.ts').size / 1024 / 1024).toFixed(2)} MB`)
}

exportAllFacilities()