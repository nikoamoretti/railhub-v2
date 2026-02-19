'use client'

import Link from 'next/link'

interface FacilityCardProps {
  facility: any
}

// Known railroad codes/names to filter out garbage data
const VALID_RAILROADS = [
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
  'Birmingham Southern', 'Luxapalila Valley', ' Mississipi Export',
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
  'Maine Northern', 'Montreal Maine & Atlantic'
]

function isValidRailroad(name: string): boolean {
  if (!name || name.length < 2) return false
  // Filter out days of week and other garbage
  const invalidPatterns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December']
  if (invalidPatterns.some(p => name.includes(p))) return false
  
  // Check if it matches a known railroad (case insensitive partial match)
  return VALID_RAILROADS.some(rr => 
    name.toLowerCase().includes(rr.toLowerCase()) ||
    rr.toLowerCase().includes(name.toLowerCase())
  )
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const TYPE_LABELS: { [key: string]: string } = {
    TRANSLOAD: 'Transload', STORAGE: 'Storage', TEAM_TRACK: 'Team Track',
    BULK_TRANSFER: 'Bulk Transfer', REPAIR_SHOP: 'Repair Shop', INTERMODAL: 'Intermodal',
    TANK_WASH: 'Tank Wash', MANUFACTURING: 'Manufacturing', SHORTLINE: 'Shortline',
    PRIVATESIDING: 'Private Siding', WAREHOUSING: 'Warehousing', LINING: 'Lining',
    CUSTOMS: 'Customs', SCALE: 'Scale', TRANSLOADING: 'Transloading',
    INSPECTION: 'Inspection', MOBILEREPAIR: 'Mobile Repair', DRAYAGE: 'Drayage',
    LEASING: 'Leasing', CARBUILDER: 'Car Builder', PARTS: 'Parts',
    SIGNAL: 'Signal', MANAGEMENT: 'Management', BROKER: 'Broker',
    FREIGHTFORWARDER: 'Freight Forwarder', ENGINEERING: 'Engineering', CHASSIS: 'Chassis',
    LOCOMOTIVESHOP: 'Locomotive Shop', LOCOMOTIVELEASING: 'Locomotive Leasing',
    SWITCHING: 'Switching', TMS: 'TMS', FUMIGATION: 'Fumigation',
    DEMURRAGE: 'Demurrage', TRACKING: 'Tracking', EDI: 'EDI',
    FLEETMGMT: 'Fleet Mgmt', LOADPLAN: 'Load Planning', YARDMGMT: 'Yard Mgmt',
    DEMURRAGESOFT: 'Demurrage Soft',
  }
  
  const TYPE_COLORS: { [key: string]: string } = {
    TRANSLOAD: 'bg-blue-100 text-blue-800',
    STORAGE: 'bg-green-100 text-green-800',
    REPAIR_SHOP: 'bg-orange-100 text-orange-800',
    TEAM_TRACK: 'bg-purple-100 text-purple-800',
    TANK_WASH: 'bg-cyan-100 text-cyan-800',
    INTERMODAL: 'bg-indigo-100 text-indigo-800',
    BULK_TRANSFER: 'bg-yellow-100 text-yellow-800',
    MANUFACTURING: 'bg-pink-100 text-pink-800',
  }
  
  const typeLabel = TYPE_LABELS[facility.type] || facility.type
  const typeColor = TYPE_COLORS[facility.type] || 'bg-gray-100 text-gray-800'
  
  // Get valid railroads only
  const validRailroads = facility.railroads
    ?.map((r: any) => r.railroad?.name)
    ?.filter((name: string) => isValidRailroad(name))
    ?.slice(0, 5) || []
  
  // Get product types from capabilities
  const productTypes = facility.capabilities?.product_types || []
  
  return (
    <Link href={`/facility/${facility.id}`} className="block">
    <div className="rounded-xl shadow-sm border hover:shadow-md transition p-6 cursor-pointer" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d' }}>
      {/* Type Badge */}
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${typeColor}`}>
        {typeLabel}
      </span>
      
      {/* Name */}
      <h3 className="text-lg font-semibold mt-3" style={{ color: '#ffffff' }}>
        {facility.name}
      </h3>
      
      {/* Location */}
      {facility.location && (
        <div className="mt-2" style={{ color: '#a0a0a0' }}>
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>
              {facility.location.city}, {facility.location.state} {facility.location.zip_code}
            </span>
          </div>
          {facility.location.street_address && (
            <div className="text-sm mt-1" style={{ color: '#808080' }}>
              {facility.location.street_address}
            </div>
          )}
        </div>
      )}
      
      {/* Phone */}
      {facility.phone && (
        <div className="mt-2 text-sm" style={{ color: '#a0a0a0' }}>
          <span>📞 {facility.phone}</span>
        </div>
      )}
      
      {/* Capabilities */}
      {facility.capabilities && (
        <div className="mt-3 flex flex-wrap gap-2">
          {facility.capabilities.hazmat_certified && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              Hazmat
            </span>
          )}
          {facility.capabilities.food_grade && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Food Grade
            </span>
          )}
          {facility.capabilities.has_railcar_storage && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Railcar Storage
            </span>
          )}
          {facility.capabilities.is_24_7 && (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              24/7
            </span>
          )}
          {facility.capabilities.track_capacity && (
            <span className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded">
              {facility.capabilities.track_capacity} spots
            </span>
          )}
        </div>
      )}
      
      {/* Railroads */}
      {validRailroads.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">🚃 Railroads:</span>{' '}
          {validRailroads.join(', ')}
        </div>
      )}
      
      {/* Product Types */}
      {productTypes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {productTypes.slice(0, 5).map((type: string, idx: number) => (
            <span 
              key={idx}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border"
            >
              {type}
            </span>
          ))}
          {productTypes.length > 5 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{productTypes.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
    </Link>
  )
}