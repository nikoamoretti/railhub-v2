import { notFound } from 'next/navigation'
import Link from 'next/link'
import facilitiesData from '@/public/facilities.json'
import { isValidRailroad } from '@/lib/railroads'

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

const TYPE_LABELS: { [key: string]: string } = {
  TRANSLOAD: 'Transload', STORAGE: 'Storage', TEAM_TRACK: 'Team Track',
  BULK_TRANSFER: 'Bulk Transfer', REPAIR_SHOP: 'Repair Shop', INTERMODAL: 'Intermodal',
  TANK_WASH: 'Tank Wash', MANUFACTURING: 'Manufacturing', SHORTLINE: 'Shortline Railroad',
  PRIVATESIDING: 'Private Siding', WAREHOUSING: 'Warehousing', LINING: 'Lining/Coating',
  CUSTOMS: 'Customs Broker', SCALE: 'Scale Station', TRANSLOADING: 'Transloading Operator',
  INSPECTION: 'Inspection Service', MOBILEREPAIR: 'Mobile Repair', DRAYAGE: 'Drayage',
  LEASING: 'Leasing Company', CARBUILDER: 'Car Builder', PARTS: 'Parts Supplier',
  SIGNAL: 'Signal Contractor', MANAGEMENT: 'Management Company', BROKER: 'Broker',
  FREIGHTFORWARDER: 'Freight Forwarder', ENGINEERING: 'Engineering', CHASSIS: 'Chassis Provider',
  LOCOMOTIVESHOP: 'Locomotive Shop', LOCOMOTIVELEASING: 'Locomotive Leasing',
  SWITCHING: 'Switching Railroad', TMS: 'TMS Platform', FUMIGATION: 'Fumigation',
  DEMURRAGE: 'Demurrage Consulting', TRACKING: 'Tracking Platform', EDI: 'EDI Provider',
  FLEETMGMT: 'Fleet Management', LOADPLAN: 'Load Planning', YARDMGMT: 'Yard Management',
  DEMURRAGESOFT: 'Demurrage Software',
}

const TYPE_COLORS: { [key: string]: string } = {
  TRANSLOAD: 'bg-blue-200 text-blue-900',
  STORAGE: 'bg-green-200 text-green-900',
  REPAIR_SHOP: 'bg-orange-200 text-orange-900',
  TEAM_TRACK: 'bg-purple-200 text-purple-900',
  TANK_WASH: 'bg-cyan-200 text-cyan-900',
  INTERMODAL: 'bg-indigo-200 text-indigo-900',
  BULK_TRANSFER: 'bg-yellow-200 text-yellow-900',
  MANUFACTURING: 'bg-pink-200 text-pink-900',
}

const cardStyle = { backgroundColor: '#2d2d2d', borderColor: '#3d3d3d' }

export default async function FacilityPage({ params }: PageProps) {
  const { id } = await params
  const facility = (facilitiesData as any[]).find(f => f.id === id || f.external_id === id)

  if (!facility) {
    notFound()
  }

  const typeLabel = TYPE_LABELS[facility.type] || facility.type
  const typeColorClass = TYPE_COLORS[facility.type] || 'bg-gray-200 text-gray-900'
  const validRailroads = facility.railroads
    ?.map((r: any) => r.railroad?.name)
    ?.filter((name: string) => isValidRailroad(name)) || []

  const productTypes = facility.capabilities?.product_types || []
  const transferModes = facility.capabilities?.transfer_modes || []
  const equipmentList = facility.capabilities?.equipment_list || []

  return (
    <main className="min-h-screen">
      <header className="py-8 px-4" style={{ background: 'linear-gradient(135deg, rgba(230,81,0,0.1) 0%, transparent 50%, rgba(230,81,0,0.05) 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="mb-4 inline-block hover:opacity-80 transition text-sm" style={{ color: '#e65100' }}>
            <span aria-hidden="true">&larr; </span>Back to Directory
          </Link>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${typeColorClass}`}>
              {typeLabel}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: '#ffffff' }}>{facility.name}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              <span aria-hidden="true">📍 </span>Location
            </h2>
            {facility.location ? (
              <div className="space-y-2">
                {facility.location.street_address && (
                  <p style={{ color: '#e0e0e0' }}>{facility.location.street_address}</p>
                )}
                <p className="font-medium" style={{ color: '#e0e0e0' }}>
                  {facility.location.city}, {facility.location.state} {facility.location.zip_code}
                </p>
                {facility.location.latitude && facility.location.longitude && (
                  <p className="text-sm" style={{ color: '#808080' }}>
                    {facility.location.latitude}, {facility.location.longitude}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#808080' }}>Location information not available</p>
            )}
          </div>

          {/* Contact */}
          <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              <span aria-hidden="true">📞 </span>Contact
            </h2>
            <div className="space-y-2">
              {facility.phone ? (
                <p>
                  <a href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`} className="hover:underline" style={{ color: '#ff7043' }}>
                    {facility.phone}
                  </a>
                </p>
              ) : (
                <p style={{ color: '#808080' }}>No phone number</p>
              )}
              {facility.email && (
                <p>
                  <a href={`mailto:${facility.email}`} className="hover:underline" style={{ color: '#ff7043' }}>
                    {facility.email}
                  </a>
                </p>
              )}
              {facility.website && isSafeUrl(facility.website) && (
                <p>
                  <a href={facility.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: '#ff7043' }}>
                    Visit Website <span aria-hidden="true">&rarr;</span>
                  </a>
                </p>
              )}
            </div>
          </div>

          {/* Capabilities */}
          {facility.capabilities && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">⚙️ </span>Capabilities
              </h2>
              <div className="space-y-3">
                {facility.capabilities.track_capacity && (
                  <div className="flex justify-between">
                    <span style={{ color: '#a0a0a0' }}>Track Capacity</span>
                    <span className="font-medium" style={{ color: '#e0e0e0' }}>{facility.capabilities.track_capacity} spots</span>
                  </div>
                )}
                {facility.capabilities.railcar_spot_count && (
                  <div className="flex justify-between">
                    <span style={{ color: '#a0a0a0' }}>Railcar Spots</span>
                    <span className="font-medium" style={{ color: '#e0e0e0' }}>{facility.capabilities.railcar_spot_count}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {facility.capabilities.hazmat_certified && (
                    <span className="text-xs bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-800/50">Hazmat Certified</span>
                  )}
                  {facility.capabilities.food_grade && (
                    <span className="text-xs bg-green-900/40 text-green-300 px-2 py-1 rounded border border-green-800/50">Food Grade</span>
                  )}
                  {facility.capabilities.kosher_certified && (
                    <span className="text-xs bg-blue-900/40 text-blue-300 px-2 py-1 rounded border border-blue-800/50">Kosher</span>
                  )}
                  {facility.capabilities.has_scale && (
                    <span className="text-xs bg-gray-700/40 text-gray-300 px-2 py-1 rounded border border-gray-600/50">Has Scale</span>
                  )}
                  {facility.capabilities.has_railcar_storage && (
                    <span className="text-xs bg-purple-900/40 text-purple-300 px-2 py-1 rounded border border-purple-800/50">Railcar Storage</span>
                  )}
                  {facility.capabilities.is_24_7 && (
                    <span className="text-xs bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded border border-yellow-800/50">24/7</span>
                  )}
                  {facility.capabilities.heating_capabilities && (
                    <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-1 rounded border border-orange-800/50">Heating</span>
                  )}
                  {facility.capabilities.onsite_railcar_storage && (
                    <span className="text-xs bg-indigo-900/40 text-indigo-300 px-2 py-1 rounded border border-indigo-800/50">Onsite Storage</span>
                  )}
                  {facility.capabilities.onsite_scale && (
                    <span className="text-xs bg-pink-900/40 text-pink-300 px-2 py-1 rounded border border-pink-800/50">Onsite Scale</span>
                  )}
                  {facility.capabilities.weight_restricted_263k && (
                    <span className="text-xs bg-gray-700/40 text-gray-300 px-2 py-1 rounded border border-gray-600/50">263k Limit</span>
                  )}
                  {facility.capabilities.weight_restricted_286k && (
                    <span className="text-xs bg-gray-700/40 text-gray-300 px-2 py-1 rounded border border-gray-600/50">286k Limit</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Railroads */}
          <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
              <span aria-hidden="true">🚃 </span>Railroads
            </h2>
            {validRailroads.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validRailroads.map((rr: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-blue-900/40 text-blue-300 rounded-full text-sm font-medium border border-blue-800/50">
                    {rr}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#808080' }}>No railroad information available</p>
            )}
          </div>

          {/* Product Types */}
          {productTypes.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">📦 </span>Product Types
              </h2>
              <div className="flex flex-wrap gap-2">
                {productTypes.map((type: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-gray-700/40 text-gray-300 rounded-full text-sm border border-gray-600/50">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Transfer Modes */}
          {transferModes.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">🔄 </span>Transfer Modes
              </h2>
              <div className="flex flex-wrap gap-2">
                {transferModes.map((mode: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-green-900/40 text-green-300 rounded-full text-sm border border-green-800/50">
                    {mode}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {equipmentList.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">🛠️ </span>Equipment
              </h2>
              <ul className="space-y-1">
                {equipmentList.map((eq: string, idx: number) => (
                  <li key={idx} style={{ color: '#c0c0c0' }}>• {eq}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Security Features */}
          {facility.capabilities?.security_features?.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">🔒 </span>Security Features
              </h2>
              <div className="flex flex-wrap gap-2">
                {facility.capabilities.security_features.map((feature: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-red-900/40 text-red-300 rounded-full text-sm border border-red-800/50">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cities Served */}
          {facility.capabilities?.cities_served?.length > 0 && (
            <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">🏙️ </span>Cities Served
              </h2>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {facility.capabilities.cities_served.map((city: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-700/40 text-gray-300 rounded text-sm border border-gray-600/50">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {facility.description && (
            <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#ffffff' }}>
                <span aria-hidden="true">ℹ️ </span>About
              </h2>
              <p className="leading-relaxed" style={{ color: '#c0c0c0' }}>{facility.description}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
