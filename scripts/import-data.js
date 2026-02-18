const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const { parse } = require('csv-parse/sync')

const prisma = new PrismaClient()

async function importFacilities() {
  console.log('Starting import...')
  
  // Read CSV
  const csvPath = process.argv[2] || '/tmp/railhub-deploy/commtrex_facilities.csv'
  const content = fs.readFileSync(csvPath, 'utf-8')
  const records = parse(content, { columns: true, skip_empty_lines: true })
  
  console.log(`Found ${records.length} records to import`)
  
  // Get or create data source
  let dataSource = await prisma.dataSource.findUnique({
    where: { name: 'commtrex' }
  })
  
  if (!dataSource) {
    dataSource = await prisma.dataSource.create({
      data: { name: 'commtrex', description: 'Commtrex transload facilities' }
    })
  }
  
  let imported = 0
  let errors = []
  
  for (const record of records) {
    try {
      // Skip if no name
      if (!record.name) continue
      
      // Create facility
      const facility = await prisma.facility.upsert({
        where: { externalId: record.id },
        update: {
          name: record.name,
          description: record.description || null,
          phone: record.phone || null,
          website: record.url || null,
          about: record.about || null,
          type: 'TRANSLOAD',
          status: 'ACTIVE',
        },
        create: {
          externalId: record.id,
          name: record.name,
          description: record.description || null,
          phone: record.phone || null,
          website: record.url || null,
          about: record.about || null,
          type: 'TRANSLOAD',
          status: 'ACTIVE',
          dataSourceId: dataSource.id,
        },
      })
      
      // Create location
      if (record.city && record.state) {
        await prisma.location.upsert({
          where: { facilityId: facility.id },
          update: {
            streetAddress: record.street_address || null,
            city: record.city,
            state: record.state,
            zipCode: record.zip_code || null,
            country: record.country || 'US',
          },
          create: {
            facilityId: facility.id,
            streetAddress: record.street_address || null,
            city: record.city,
            state: record.state,
            zipCode: record.zip_code || null,
            country: record.country || 'US',
          },
        })
      }
      
      // Create capabilities
      await prisma.capability.upsert({
        where: { facilityId: facility.id },
        update: {
          trackCapacity: record.track_capacity ? parseInt(record.track_capacity) : null,
          hazmatCertified: record.hazmat_handling === 'Yes',
          foodGrade: record.product_types?.includes('Food Grade'),
          hasScale: record.onsite_scale === 'Yes',
          hasRailcarStorage: record.onsite_railcar_storage === 'Yes',
          is247: record.hours_mon?.includes('24') || false,
          productTypes: record.product_types ? record.product_types.split(';').map(p => p.trim()) : [],
          transferModes: record.transfer_modes ? record.transfer_modes.split(';').map(p => p.trim()) : [],
          equipmentList: record.equipment ? record.equipment.split(';').map(p => p.trim()) : [],
        },
        create: {
          facilityId: facility.id,
          trackCapacity: record.track_capacity ? parseInt(record.track_capacity) : null,
          hazmatCertified: record.hazmat_handling === 'Yes',
          foodGrade: record.product_types?.includes('Food Grade'),
          hasScale: record.onsite_scale === 'Yes',
          hasRailcarStorage: record.onsite_railcar_storage === 'Yes',
          is247: record.hours_mon?.includes('24') || false,
          productTypes: record.product_types ? record.product_types.split(';').map(p => p.trim()) : [],
          transferModes: record.transfer_modes ? record.transfer_modes.split(';').map(p => p.trim()) : [],
          equipmentList: record.equipment ? record.equipment.split(';').map(p => p.trim()) : [],
        },
      })
      
      // Create railroads
      if (record.railroads) {
        const railroadNames = record.railroads.split(/[,;]/).map(r => r.trim().split('-')[0].trim()).filter(Boolean)
        for (const railroadName of railroadNames.slice(0, 5)) {
          const railroad = await prisma.railroad.upsert({
            where: { name: railroadName },
            update: {},
            create: { name: railroadName },
          })
          
          await prisma.facilityRailroad.upsert({
            where: { facilityId_railroadId: { facilityId: facility.id, railroadId: railroad.id } },
            update: {},
            create: { facilityId: facility.id, railroadId: railroad.id },
          })
        }
      }
      
      // Create categories (product types)
      if (record.product_types) {
        const categoryNames = record.product_types.split(';').map(c => c.trim()).filter(Boolean)
        for (const categoryName of categoryNames.slice(0, 5)) {
          const category = await prisma.category.upsert({
            where: { name: categoryName },
            update: {},
            create: { name: categoryName, type: 'PRODUCT' },
          })
          
          await prisma.facilityCategory.upsert({
            where: { facilityId_categoryId: { facilityId: facility.id, categoryId: category.id } },
            update: {},
            create: { facilityId: facility.id, categoryId: category.id },
          })
        }
      }
      
      imported++
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} facilities...`)
      }
    } catch (error) {
      errors.push({ id: record.id, error: error.message })
    }
  }
  
  console.log(`\n✅ Import complete!`)
  console.log(`Imported: ${imported}`)
  console.log(`Errors: ${errors.length}`)
  
  if (errors.length > 0) {
    console.log('\nFirst 5 errors:')
    errors.slice(0, 5).forEach(e => console.log(`  - ${e.id}: ${e.error}`))
  }
  
  // Update data source
  await prisma.dataSource.update({
    where: { id: dataSource.id },
    data: {
      lastImportAt: new Date(),
      recordCount: await prisma.facility.count({ where: { dataSourceId: dataSource.id } }),
    },
  })
  
  await prisma.$disconnect()
}

importFacilities().catch(console.error)