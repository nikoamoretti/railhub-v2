import { notFound } from 'next/navigation'
import Link from 'next/link'
import facilitiesData from '@/public/facilities.json'

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
  const invalidPatterns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December']
  if (invalidPatterns.some(p => name.includes(p))) return false
  
  return VALID_RAILROADS.some(rr => 
    name.toLowerCase().includes(rr.toLowerCase()) ||
    rr.toLowerCase().includes(name.toLowerCase())
  )
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function FacilityPage({ params }: PageProps) {
  const { id } = await params
  const facility = (facilitiesData as any[]).find(f => f.id === id || f.external_id === id)
  
  if (!facility) {
    notFound()
  }
  
  const TYPE_LABELS: { [key: string]: string } = {
  TRANSLOAD: 'Transload',
  STORAGE: 'Storage',
  TEAM_TRACK: 'Team Track',
  BULK_TRANSFER: 'Bulk Transfer',
  REPAIR_SHOP: 'Repair Shop',
  INTERMODAL: 'Intermodal',
  TANK_WASH: 'Tank Wash',
  MANUFACTURING: 'Manufacturing',
  SHORTLINE: 'Shortline Railroad',
  PRIVATESIDING: 'Private Siding',
  WAREHOUSING: 'Warehousing',
  LINING: 'Lining/Coating',
  CUSTOMS: 'Customs Broker',
  SCALE: 'Scale Station',
  TRANSLOADING: 'Transloading Operator',
  INSPECTION: 'Inspection Service',
  MOBILEREPAIR: 'Mobile Repair',
  DRAYAGE: 'Drayage',
  LEASING: 'Leasing Company',
  CARBUILDER: 'Car Builder',
  PARTS: 'Parts Supplier',
  SIGNAL: 'Signal Contractor',
  MANAGEMENT: 'Management Company',
  BROKER: 'Broker',
  FREIGHTFORWARDER: 'Freight Forwarder',
  ENGINEERING: 'Engineering',
  CHASSIS: 'Chassis Provider',
  LOCOMOTIVESHOP: 'Locomotive Shop',
  LOCOMOTIVELEASING: 'Locomotive Leasing',
  SWITCHING: 'Switching Railroad',
  TMS: 'TMS Platform',
  FUMIGATION: 'Fumigation',
  DEMURRAGE: 'Demurrage Consulting',
  TRACKING: 'Tracking Platform',
  EDI: 'EDI Provider',
  FLEETMGMT: 'Fleet Management',
  LOADPLAN: 'Load Planning',
  YARDMGMT: 'Yard Management',
  DEMURRAGESOFT: 'Demurrage Software',
}

const typeLabel = TYPE_LABELS[facility.type] || facility.type
const typeColorClass = facility.type === 'TRANSLOAD' 
  ? 'bg-blue-200 text-blue-900'
  : facility.type === 'STORAGE'
  ? 'bg-green-200 text-green-900'
  : facility.type === 'REPAIR_SHOP'
  ? 'bg-orange-200 text-orange-900'
  : facility.type === 'TEAM_TRACK'
  ? 'bg-purple-200 text-purple-900'
  : facility.type === 'TANK_WASH'
  ? 'bg-cyan-200 text-cyan-900'
  : facility.type === 'INTERMODAL'
  ? 'bg-indigo-200 text-indigo-900'
  : 'bg-gray-200 text-gray-900'
  const validRailroads = facility.railroads
    ?.map((r: any) => r.railroad?.name)
    ?.filter((name: string) => isValidRailroad(name)) || []
  
  const productTypes = facility.capabilities?.product_types || []
  const transferModes = facility.capabilities?.transfer_modes || []
  const equipmentList = facility.capabilities?.equipment_list || []

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <header className="py-8 px-4" style={{ background: 'linear-gradient(135deg, rgba(230,81,0,0.1) 0%, transparent 50%, rgba(230,81,0,0.05) 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="mb-4 inline-block hover:opacity-80 transition" style={{ color: '#e65100' }}>
            ← Back to Directory
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${typeColorClass}`}>
              {typeLabel}
            </span>
          </div>
          <h1 className="text-4xl font-bold mt-2" style={{ color: '#ffffff' }}>{facility.name}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: '#2d2d2d', borderColor: '#3d3d3d' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>📍 Location</h2>
            {facility.location ? (
              <div className="space-y-2" style={{ color: '#a0a0a0' }}>
                {facility.location.street_address && (
                  <p style={{ color: '#ffffff' }}>{facility.location.street_address}</p>
                )}
                <p className="font-medium" style={{ color: '#ffffff' }}>
                  {facility.location.city}, {facility.location.state} {facility.location.zip_code}
                </p>
                {facility.location.latitude && facility.location.longitude && (
                  <p className="text-sm" style={{ color: '#808080' }}>
                    {facility.location.latitude}, {facility.location.longitude}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Location information not available</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">📞 Contact</h2>
            <div className="space-y-2">
              {facility.phone ? (
                <p>
                  <a href={`tel:${facility.phone}`} className="text-blue-600 hover:underline">
                    {facility.phone}
                  </a>
                </p>
              ) : (
                <p className="text-gray-500">No phone number</p>
              )}
              {facility.email && (
                <p>
                  <a href={`mailto:${facility.email}`} className="text-blue-600 hover:underline">
                    {facility.email}
                  </a>
                </p>
              )}
              {facility.website && (
                <p>
                  <a href={facility.website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                    Visit Website →
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Capabilities */}
          {facility.capabilities && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">⚙️ Capabilities</h2>
              <div className="space-y-3">
                {facility.capabilities.track_capacity && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Track Capacity</span>
                    <span className="font-medium">{facility.capabilities.track_capacity} spots</span>
                  </div>
                )}
                {facility.capabilities.railcar_spot_count && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Railcar Spots</span>
                    <span className="font-medium">{facility.capabilities.railcar_spot_count}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {facility.capabilities.hazmat_certified && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Hazmat Certified</span>
                  )}
                  {facility.capabilities.food_grade && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Food Grade</span>
                  )}
                  {facility.capabilities.kosher_certified && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Kosher</span>
                  )}
                  {facility.capabilities.has_scale && (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Has Scale</span>
                  )}
                  {facility.capabilities.has_railcar_storage && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Railcar Storage</span>
                  )}
                  {facility.capabilities.is_24_7 && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">24/7</span>
                  )}
                  {facility.capabilities.heating_capabilities && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Heating</span>
                  )}
                  {facility.capabilities.onsite_railcar_storage && (
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">Onsite Storage</span>
                  )}
                  {facility.capabilities.onsite_scale && (
                    <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">Onsite Scale</span>
                  )}
                  {facility.capabilities.weight_restricted_263k && (
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">263k Limit</span>
                  )}
                  {facility.capabilities.weight_restricted_286k && (
                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded">286k Limit</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Railroads */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4">🚃 Railroads</h2>
            {validRailroads.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validRailroads.map((rr: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
                    {rr}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No railroad information available</p>
            )}
          </div>

          {/* Product Types */}
          {productTypes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">📦 Product Types</h2>
              <div className="flex flex-wrap gap-2">
                {productTypes.map((type: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transfer Modes */}
          {transferModes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">🔄 Transfer Modes</h2>
              <div className="flex flex-wrap gap-2">
                {transferModes.map((mode: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-green-50 text-green-800 rounded-full text-sm">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {equipmentList.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">🛠️ Equipment</h2>
              <ul className="space-y-1">
                {equipmentList.map((eq: string, idx: number) => (
                  <li key={idx} className="text-gray-700">• {eq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Features */}
          {facility.capabilities?.security_features?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">🔒 Security Features</h2>
              <div className="flex flex-wrap gap-2">
                {facility.capabilities.security_features.map((feature: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-red-50 text-red-800 rounded-full text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cities Served */}
          {facility.capabilities?.cities_served?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">🏙️ Cities Served</h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {facility.capabilities.cities_served.map((city: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 rounded text-sm">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {facility.description && (
            <div className="bg-white rounded-xl shadow-sm border p-6 md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">ℹ️ About</h2>
              <p className="text-gray-700 leading-relaxed">{facility.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}