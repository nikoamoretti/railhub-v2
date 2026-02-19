'use client'

import Link from 'next/link'
import { isValidRailroad } from '@/lib/railroads'

interface FacilityCardProps {
  facility: any
}

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

export function FacilityCard({ facility }: FacilityCardProps) {
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
          <span aria-hidden="true">📞 </span>
          <a
            href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`}
            className="hover:underline"
            style={{ color: '#a0a0a0' }}
            onClick={(e) => e.stopPropagation()}
          >
            {facility.phone}
          </a>
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
          {productTypes.slice(0, 5).map((type: string) => (
            <span
              key={type}
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