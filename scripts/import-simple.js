const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const { parse } = require('csv-parse/sync')

const prisma = new PrismaClient()

async function importBatch(records, startIdx, batchSize) {
  const batch = records.slice(startIdx, startIdx + batchSize)
  
  for (const record of batch) {
    try {
      if (!record.name || !record.id) continue
      
      await prisma.facility.create({
        data: {
          externalId: record.id,
          name: record.name,
          description: record.description || null,
          phone: record.phone || null,
          website: record.url || null,
          type: 'TRANSLOAD',
          status: 'ACTIVE',
          dataSource: {
            connectOrCreate: {
              where: { name: 'commtrex' },
              create: { name: 'commtrex' }
            }
          },
          location: {
            create: {
              streetAddress: record.street_address || null,
              city: record.city,
              state: record.state,
              zipCode: record.zip_code || null,
              country: record.country || 'US',
            }
          },
          capabilities: {
            create: {
              trackCapacity: record.track_capacity ? parseInt(record.track_capacity) : null,
              hazmatCertified: record.hazmat_handling === 'Yes',
              foodGrade: record.product_types?.includes('Food Grade'),
              hasScale: record.onsite_scale === 'Yes',
              hasRailcarStorage: record.onsite_railcar_storage === 'Yes',
              is247: record.hours_mon?.includes('24') || false,
              productTypes: record.product_types ? record.product_types.split(';').map(p => p.trim()) : [],
            }
          }
        }
      })
    } catch (e) {
      // Skip duplicates
    }
  }
}

async function main() {
  console.log('Reading CSV...')
  const content = fs.readFileSync('/tmp/railhub-deploy/commtrex_facilities.csv', 'utf-8')
  const records = parse(content, { columns: true, skip_empty_lines: true })
  console.log(`Found ${records.length} records`)
  
  const batchSize = 50
  for (let i = 0; i < Math.min(records.length, 500); i += batchSize) {
    console.log(`Importing batch ${i}-${i + batchSize}...`)
    await importBatch(records, i, batchSize)
  }
  
  const count = await prisma.facility.count()
  console.log(`\n✅ Imported ${count} facilities`)
  await prisma.$disconnect()
}

main().catch(console.error)