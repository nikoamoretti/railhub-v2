#!/usr/bin/env node
/**
 * P0 Data Cleanup Script
 * 1. Remove exact duplicate entries (CSV data loaded twice)
 * 2. Split unsplit railroad names ("BNSF, KCS, UP" → 3 entries)
 * 3. Remove "not served by rail" railroad entries
 */

const fs = require('fs')
const path = require('path')

const INPUT = path.join(__dirname, '..', 'public', 'facilities.json')
const OUTPUT = INPUT // overwrite in place
const BACKUP = INPUT + '.backup'

console.log('Loading facilities.json...')
const data = JSON.parse(fs.readFileSync(INPUT, 'utf8'))
console.log(`Loaded: ${data.length} entries`)

// ─── 1. Deduplicate ───────────────────────────────────────────

// Build a fingerprint from core fields to detect exact dupes
function fingerprint(f) {
  return [
    f.name || '',
    f.type || '',
    f.location?.city || '',
    f.location?.state || '',
    f.location?.street_address || '',
    f.location?.zip_code || '',
    f.phone || '',
  ].join('|').toLowerCase()
}

const seen = new Map()
const unique = []
let dupeCount = 0

for (const facility of data) {
  const fp = fingerprint(facility)
  if (seen.has(fp)) {
    dupeCount++
  } else {
    seen.set(fp, true)
    unique.push(facility)
  }
}

console.log(`\n--- Deduplication ---`)
console.log(`Removed: ${dupeCount} exact duplicates`)
console.log(`Remaining: ${unique.length} unique facilities`)

// ─── 2. Split unsplit railroad names ──────────────────────────

let splitCount = 0
let notServedCount = 0

for (const facility of unique) {
  if (!facility.railroads || facility.railroads.length === 0) continue

  // Filter out "not served by rail"
  const before = facility.railroads.length
  facility.railroads = facility.railroads.filter(r => {
    const name = (r.railroad?.name || '').toLowerCase().trim()
    if (name.includes('not served') || name === 'none' || name === 'n/a' || name === '') {
      return false
    }
    return true
  })
  notServedCount += before - facility.railroads.length

  // Split comma-separated railroad names
  const expanded = []
  for (const r of facility.railroads) {
    const name = r.railroad?.name || ''
    // Check if it contains commas (indicating multiple railroads in one string)
    if (name.includes(',')) {
      const parts = name.split(/,\s*/).map(s => s.trim()).filter(Boolean)
      if (parts.length > 1) {
        splitCount++
        for (const part of parts) {
          expanded.push({
            railroad: { name: part },
            daysOfWeek: r.daysOfWeek,
            notes: r.notes,
          })
        }
        continue
      }
    }
    // Check for slash-separated (e.g. "BNSF/UP")
    if (name.includes('/') && name.length < 20) {
      const parts = name.split('/').map(s => s.trim()).filter(Boolean)
      if (parts.length > 1 && parts.every(p => p.length <= 6)) {
        splitCount++
        for (const part of parts) {
          expanded.push({
            railroad: { name: part },
            daysOfWeek: r.daysOfWeek,
            notes: r.notes,
          })
        }
        continue
      }
    }
    expanded.push(r)
  }
  facility.railroads = expanded
}

console.log(`\n--- Railroad Cleanup ---`)
console.log(`Split ${splitCount} unsplit railroad entries into individual records`)
console.log(`Removed ${notServedCount} "not served by rail" entries`)

// ─── 3. Summary stats ─────────────────────────────────────────

const typeCounts = {}
unique.forEach(f => {
  typeCounts[f.type] = (typeCounts[f.type] || 0) + 1
})

const withPhone = unique.filter(f => f.phone).length
const withRailroads = unique.filter(f => f.railroads?.length > 0).length
const withLatLon = unique.filter(f => f.location?.latitude != null).length

console.log(`\n--- Final Stats ---`)
console.log(`Total unique facilities: ${unique.length}`)
console.log(`With phone: ${withPhone} (${(withPhone/unique.length*100).toFixed(1)}%)`)
console.log(`With railroads: ${withRailroads} (${(withRailroads/unique.length*100).toFixed(1)}%)`)
console.log(`With lat/lon: ${withLatLon} (${(withLatLon/unique.length*100).toFixed(1)}%)`)
console.log(`\nType distribution:`)
Object.entries(typeCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })

// ─── 4. Write output ──────────────────────────────────────────

// Backup original
console.log(`\nBacking up to ${BACKUP}...`)
fs.copyFileSync(INPUT, BACKUP)

console.log(`Writing cleaned data to ${OUTPUT}...`)
fs.writeFileSync(OUTPUT, JSON.stringify(unique, null, 2))

const oldSize = fs.statSync(BACKUP).size
const newSize = fs.statSync(OUTPUT).size
console.log(`\nFile size: ${(oldSize / 1e6).toFixed(1)}MB → ${(newSize / 1e6).toFixed(1)}MB`)
console.log(`\nDone! ✓`)
