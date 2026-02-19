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
