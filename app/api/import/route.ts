import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parse } from 'csv-parse/sync'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sourceName = formData.get('source') as string || 'manual-import'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    const content = await file.text()
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    }) as Record<string, string>[]
    
    // Get or create data source
    let dataSource = await prisma.dataSource.findUnique({
      where: { name: sourceName },
    })
    
    if (!dataSource) {
      dataSource = await prisma.dataSource.create({
        data: { name: sourceName },
      })
    }
    
    // Create import log
    const importLog = await prisma.importLog.create({
      data: {
        dataSourceId: dataSource.id,
        recordsImported: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })
    
    let imported = 0
    let updated = 0
    let failed = 0
    const errors: string[] = []
    
    for (const record of records) {
      try {
        // Determine facility type from data
        const facilityType = record.type?.toUpperCase() === 'STORAGE' 
          ? 'STORAGE' 
          : 'TRANSLOAD'
        
        // Upsert facility
        const facility = await prisma.facility.upsert({
          where: { 
            externalId: record.id || record.external_id 
          },
          update: {
            name: record.name,
            description: record.description,
            phone: record.phone,
            website: record.url,
            about: record.about,
            type: facilityType,
          },
          create: {
            externalId: record.id || record.external_id,
            name: record.name,
            description: record.description,
            phone: record.phone,
            website: record.url,
            about: record.about,
            type: facilityType,
            status: 'ACTIVE',
            dataSourceId: dataSource.id,
          },
        })
        
        // Upsert location
        await prisma.location.upsert({
          where: { facilityId: facility.id },
          update: {
            streetAddress: record.street_address,
            city: record.city,
            state: record.state,
            zipCode: record.zip_code,
            country: record.country || 'US',
          },
          create: {
            facilityId: facility.id,
            streetAddress: record.street_address,
            city: record.city,
            state: record.state,
            zipCode: record.zip_code,
            country: record.country || 'US',
          },
        })
        
        // Upsert capabilities
        const capabilities = {
          trackCapacity: record.track_capacity ? parseInt(record.track_capacity) : null,
          railcarSpotCount: record.railcar_spot_count ? parseInt(record.railcar_spot_count) : null,
          hazmatCertified: record.hazmat_handling === 'Yes' || record.hazmat_certified === 'true',
          foodGrade: record.food_grade === 'Yes' || record.food_grade === 'true',
          kosherCertified: record.kosher_certification === 'Yes' || record.kosher_certified === 'true',
          hasScale: record.onsite_scale === 'Yes' || record.has_scale === 'true',
          hasRailcarStorage: record.onsite_railcar_storage === 'Yes' || record.has_railcar_storage === 'true',
          is247: record.hours_mon?.includes('24') || record.is_24_7 === 'true',
          weightRestricted263k: record.weight_restricted_263k === 'Yes' || record.weight_restricted_263k === 'true',
          weightRestricted286k: record.weight_restricted_286k === 'Yes' || record.weight_restricted_286k === 'true',
          equipmentList: record.equipment ? record.equipment.split(';').map((e: string) => e.trim()) : [],
          storageOptions: record.storage_options ? record.storage_options.split(';').map((e: string) => e.trim()) : [],
          transferModes: record.transfer_modes ? record.transfer_modes.split(';').map((e: string) => e.trim()) : [],
          productTypes: record.product_types ? record.product_types.split(';').map((e: string) => e.trim()) : [],
          hoursMonday: record.hours_mon,
          hoursTuesday: record.hours_tue,
          hoursWednesday: record.hours_wed,
          hoursThursday: record.hours_thu,
          hoursFriday: record.hours_fri,
          hoursSaturday: record.hours_sat,
          hoursSunday: record.hours_sun,
        }
        
        await prisma.capability.upsert({
          where: { facilityId: facility.id },
          update: capabilities,
          create: {
            facilityId: facility.id,
            ...capabilities,
          },
        })
        
        // Process railroads
        if (record.railroads) {
          const railroadNames = record.railroads.split(/[,;]/).map((r: string) => r.trim()).filter(Boolean)
          
          for (const railroadName of railroadNames) {
            const cleanName = railroadName.split('-')[0].trim()
            if (!cleanName) continue
            
            const railroad = await prisma.railroad.upsert({
              where: { name: cleanName },
              update: {},
              create: { name: cleanName },
            })
            
            await prisma.facilityRailroad.upsert({
              where: {
                facilityId_railroadId: {
                  facilityId: facility.id,
                  railroadId: railroad.id,
                },
              },
              update: {},
              create: {
                facilityId: facility.id,
                railroadId: railroad.id,
              },
            })
          }
        }
        
        // Process categories (product types)
        if (record.product_types) {
          const categoryNames = record.product_types.split(';').map((c: string) => c.trim()).filter(Boolean)
          
          for (const categoryName of categoryNames) {
            if (!categoryName) continue
            
            const category = await prisma.category.upsert({
              where: { name: categoryName },
              update: {},
              create: { 
                name: categoryName,
                type: 'PRODUCT',
              },
            })
            
            await prisma.facilityCategory.upsert({
              where: {
                facilityId_categoryId: {
                  facilityId: facility.id,
                  categoryId: category.id,
                },
              },
              update: {},
              create: {
                facilityId: facility.id,
                categoryId: category.id,
              },
            })
          }
        }
        
        // Check if this was an update or insert
        const existing = await prisma.facility.findFirst({
          where: {
            externalId: record.id || record.external_id,
            updatedAt: { gt: new Date(Date.now() - 5000) },
          },
        })
        
        if (existing && existing.createdAt < existing.updatedAt) {
          updated++
        } else {
          imported++
        }
        
      } catch (error) {
        failed++
        errors.push(`Row ${imported + updated + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Update import log
    await prisma.importLog.update({
      where: { id: importLog.id },
      data: {
        recordsImported: imported,
        recordsUpdated: updated,
        recordsFailed: failed,
        status: failed === records.length ? 'FAILED' : 'COMPLETED',
        errorMessage: errors.length > 0 ? errors.slice(0, 10).join('\n') : null,
        completedAt: new Date(),
      },
    })
    
    // Update data source
    await prisma.dataSource.update({
      where: { id: dataSource.id },
      data: {
        lastImportAt: new Date(),
        recordCount: await prisma.facility.count({ where: { dataSourceId: dataSource.id } }),
      },
    })
    
    return NextResponse.json({
      success: true,
      imported,
      updated,
      failed,
      total: records.length,
      errors: errors.slice(0, 10),
    })
    
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Import failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}