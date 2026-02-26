// ─── Railroad registry with metadata for carrier pages ─────────────────────

export interface RailroadMeta {
  slug: string
  name: string
  shortName: string
  tier: 'class1' | 'regional'
  hq: string
  founded?: number
  description: string
  facilityNames: string[]   // matches against facility.railroads[].railroad.name
  jobSlugs: string[]        // matches against job.companySlug
  accentColor: string
}

export const RAILROAD_REGISTRY: RailroadMeta[] = [
  {
    slug: 'bnsf',
    name: 'BNSF Railway',
    shortName: 'BNSF',
    tier: 'class1',
    hq: 'Fort Worth, TX',
    founded: 1995,
    description: 'One of the largest freight railroad networks in North America, spanning 32,500 miles across 28 states and three Canadian provinces.',
    facilityNames: ['BNSF'],
    jobSlugs: ['bnsf-railway'],
    accentColor: '#f97316',
  },
  {
    slug: 'union-pacific',
    name: 'Union Pacific Railroad',
    shortName: 'UP',
    tier: 'class1',
    hq: 'Omaha, NE',
    founded: 1862,
    description: 'America\'s premier railroad franchise, linking 23 states in the western two-thirds of the country with 32,000 route miles.',
    facilityNames: ['UP'],
    jobSlugs: ['union-pacific'],
    accentColor: '#eab308',
  },
  {
    slug: 'csx',
    name: 'CSX Transportation',
    shortName: 'CSX',
    tier: 'class1',
    hq: 'Jacksonville, FL',
    founded: 1980,
    description: 'Rail freight transportation across a 20,000-mile network serving the eastern United States and parts of Canada.',
    facilityNames: ['CSX'],
    jobSlugs: ['csx-transportation'],
    accentColor: '#3b82f6',
  },
  {
    slug: 'norfolk-southern',
    name: 'Norfolk Southern Railway',
    shortName: 'NS',
    tier: 'class1',
    hq: 'Atlanta, GA',
    founded: 1982,
    description: 'Operates approximately 19,300 route miles in 22 eastern states, serving major ports and intermodal terminals.',
    facilityNames: ['NS'],
    jobSlugs: ['norfolk-southern'],
    accentColor: '#8b5cf6',
  },
  {
    slug: 'canadian-national',
    name: 'Canadian National Railway',
    shortName: 'CN',
    tier: 'class1',
    hq: 'Montreal, QC',
    founded: 1919,
    description: 'Spans Canada and mid-America with 19,500 miles of track across eight Canadian provinces and 16 US states.',
    facilityNames: ['CN'],
    jobSlugs: ['canadian-national'],
    accentColor: '#ef4444',
  },
  {
    slug: 'cpkc',
    name: 'Canadian Pacific Kansas City',
    shortName: 'CPKC',
    tier: 'class1',
    hq: 'Calgary, AB',
    founded: 2023,
    description: 'The first single-line railroad linking Canada, the United States, and Mexico with a 20,000-mile network.',
    facilityNames: ['CPKC', 'CP', 'KCS'],
    jobSlugs: ['cpkc'],
    accentColor: '#dc2626',
  },
  {
    slug: 'amtrak',
    name: 'Amtrak',
    shortName: 'AMTK',
    tier: 'class1',
    hq: 'Washington, DC',
    founded: 1971,
    description: 'National passenger railroad serving over 500 destinations across 46 states on a 21,000-mile route network.',
    facilityNames: ['AMTK'],
    jobSlugs: ['amtrak'],
    accentColor: '#0ea5e9',
  },
  {
    slug: 'florida-east-coast',
    name: 'Florida East Coast Railway',
    shortName: 'FEC',
    tier: 'regional',
    hq: 'Coral Gables, FL',
    description: 'Operates 351 miles of mainline track along Florida\'s east coast from Jacksonville to Miami.',
    facilityNames: ['FEC'],
    jobSlugs: [],
    accentColor: '#14b8a6',
  },
  {
    slug: 'watco',
    name: 'Watco Companies',
    shortName: 'Watco',
    tier: 'regional',
    hq: 'Pittsburg, KS',
    founded: 1983,
    description: 'Operates 42 short line and regional railroads, plus terminal and port services across the US and Australia.',
    facilityNames: ['Watco'],
    jobSlugs: ['watco'],
    accentColor: '#6366f1',
  },
]

export function getRailroadBySlug(slug: string): RailroadMeta | undefined {
  return RAILROAD_REGISTRY.find(r => r.slug === slug)
}

export function getAllRailroadSlugs(): string[] {
  return RAILROAD_REGISTRY.map(r => r.slug)
}

// ─── Validation ────────────────────────────────────────────────────────────

export const VALID_RAILROADS = [
  'BNSF', 'UP', 'CSX', 'NS', 'CN', 'CP', 'KCS', 'FEC', 'AMTK',
  'Union Pacific', 'Burlington Northern', 'Norfolk Southern',
  'Canadian National', 'Canadian Pacific', 'Kansas City Southern',
  'Florida East Coast', 'Metra', 'NJ Transit', 'VTA', 'Caltrain',
  'Portland & Western', 'Utah Railway', 'Iowa Interstate', 'Indiana Railroad',
  'Texas Pacifico', 'Arizona Eastern', 'San Pedro & Southwestern',
  'Missouri & Northern Arkansas', 'Warren & Saline River',
  'Louisiana & North West', 'Arkansas Midland', 'Delta Southern',
  'Red River Valley & Western', 'Columbia Basin', 'Palouse River & Coulee City',
  'Blue Mountain', 'Great Northwest', 'Eastern Washington Gateway',
  'Livonia', 'Delaware & Hudson', 'Toledo', 'Chesapeake & Albemarle',
  'North Carolina & Virginia', 'South Carolina Central', 'Georgia & Florida',
  'Golden Isles', 'Georgia Central', 'Georgia Southwestern', 'Hartwell',
  'Florida Midland', 'Florida Central', 'Florida Northern', 'Bay Line',
  'Alabama & Gulf Coast', 'Alabama Southern', 'Terminal Railway',
  'Birmingham Southern', 'Luxapalila Valley', 'Mississippi Export',
  'Mississippi Delta', 'Meridian & Bigbee', 'Three Notch', 'Wiregrass Central',
  'Chattooga & Chickamauga', 'Sandersville', 'Georgia Northeastern',
  'St. Marys', 'First Coast', 'Jacksonville Port Terminal',
  'New England Central', 'Vermont Railway', 'Maine Central', 'Pan Am',
  'Providence & Worcester', 'Massachusetts Coastal', 'Bay Colony',
  'Housatonic', 'Connecticut Southern', 'Naugatuck', 'Branford Steam',
  'New York & Atlantic', 'New York Susquehanna & Western',
  'Buffalo & Pittsburgh', 'Rochester & Southern', 'Finger Lakes',
  'Ontario Central', 'Oswego', 'Depew', 'Lancaster & Chester',
  'Delmarva Central', 'East Penn', 'North Shore', 'Luzerne & Susquehanna',
  'Reading Blue Mountain', 'Lehigh Gorge Scenic', 'Stourbridge',
  'West Chester', 'East Troy', 'Wisconsin & Southern', 'Wisconsin Northern',
  'Escanaba & Lake Superior', 'Great Lakes Central', 'Lake State',
  'Michigan Shore', 'Indiana Northeastern', 'Chicago South Shore',
  'Chicago Fort Wayne & Eastern', 'Toledo Peoria & Western',
  'Decatur & Eastern Illinois', 'Vandalia', 'Indiana Rail Road',
  'Evansville Western', 'Louisville & Indiana', 'Paducah & Louisville',
  'Knoxville & Holston River', 'Nashville & Eastern', 'Tennessee Southern',
  'Caney Fork & Western', 'Rock Island', 'Stillwater Central',
  'Kiamichi', 'Farmrail', 'Grainbelt', 'South Kansas & Oklahoma',
  'Cimarron Valley', 'Northwestern Oklahoma', 'Arkansas-Oklahoma',
  'Texas Northwestern', 'South Plains', 'Fort Worth & Western',
  'Dallas Garland & Northeastern', 'Blacklands', 'Texas Northeastern',
  'New Orleans & Gulf Coast', 'Louisiana Delta', 'Pointe Coupee',
  'Baton Rouge Southern', 'Acadiana', 'Alaska', 'Alberta Prairie',
  'Battle River', 'Great Sandhills', 'Southern Manitoba', 'Central Manitoba',
  'Hudson Bay', 'Okanagan Valley', 'Southern Railway', 'Sartigan',
  'St. Lawrence & Atlantic', 'Saguenay', 'Charlevoix', 'Cape Breton',
  'Sydney Coal', 'Nova Scotia', 'New Brunswick Southern', 'Eastern Maine',
  'Maine Northern', 'Montreal Maine & Atlantic',
]

const INVALID_PATTERNS = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  'January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
]

export function isValidRailroad(name: string): boolean {
  if (!name || name.length < 2) return false
  if (INVALID_PATTERNS.some(p => name.includes(p))) return false

  return VALID_RAILROADS.some(rr =>
    name.toLowerCase().includes(rr.toLowerCase()) ||
    rr.toLowerCase().includes(name.toLowerCase())
  )
}
