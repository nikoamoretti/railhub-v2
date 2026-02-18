const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const { parse } = require('csv-parse/sync')

const prisma = new PrismaClient()

async function main() {
  console.log('Reading CSV...')
  const content = fs.readFileSync('/tmp/railhub-deploy/commtrex_facilities.csv', 'utf-8')
  const records = parse(content, { columns: true, skip_empty_lines: true })
  console.log(`Found ${records.length} total records`)
  
  const existingCount = await prisma.facility.count()
  console.log(`Already imported: ${existingCount}`)
  
  // Skip already imported
  const startIdx = existingCount
  const endIdx = Math.min(startIdx + 1000, records.length)
  
  console.log(`Importing records ${startIdx} to ${endIdx}...`)
  
  for (let i = startIdx; i < endIdx; i++) {
    const record = records[i]
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
              hazmatCertified: record.hazmat_handling === 'Yes',
              foodGrade: record.product_types?.includes('Food Grade'),
              hasScale: record.onsite_scale === 'Yes',
              hasRailcarStorage: record.onsite_railcar_storage === 'Yes',
              productTypes: record.product_types ? record.product_types.split(';').map(p => p.trim()) : [],
            }
          }
        }
      })
      
      if ((i - startIdx) % 100 === 0) {
        console.log(`Progress: ${i - startIdx} / ${endIdx - startIdx}`)
      }
    } catch (e) {
      // Skip on error
    }
  }
  
  const finalCount = await prisma.facility.count()
  console.log(`\n✅ Total facilities now: ${finalCount}`)
  await prisma.$disconnect()
}

main().catch(console.error)