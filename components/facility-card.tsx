'use client'

import { Facility, Location, Capability, Category, Railroad } from '@prisma/client'

interface FacilityWithRelations extends Facility {
  location: Location | null
  capabilities: Capability | null
  categories: { category: Category }[]
  railroads: { railroad: Railroad; daysOfWeek: any; notes: string | null }[]
}

interface FacilityCardProps {
  facility: FacilityWithRelations
}

export function FacilityCard({ facility }: FacilityCardProps) {
  const typeLabel = facility.type === 'TRANSLOAD' ? 'Transload' : 'Storage'
  const typeColor = facility.type === 'TRANSLOAD' 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-green-100 text-green-800'
  
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6">
      {/* Type Badge */}
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${typeColor}`}>
        {typeLabel}
      </span>
      
      {/* Name */}
      <h3 className="text-lg font-semibold mt-3 text-gray-900">
        {facility.name}
      </h3>
      
      {/* Location */}
      {facility.location && (
        <div className="mt-2 text-gray-600">
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>
              {facility.location.city}, {facility.location.state} {facility.location.zipCode}
            </span>
          </div>
          {facility.location.streetAddress && (
            <div className="text-sm text-gray-500 mt-1">
              {facility.location.streetAddress}
            </div>
          )}
        </div>
      )}
      
      {/* Phone */}
      {facility.phone && (
        <div className="mt-2 text-sm text-gray-600">
          <span>📞 {facility.phone}</span>
        </div>
      )}
      
      {/* Capabilities */}
      {facility.capabilities && (
        <div className="mt-3 flex flex-wrap gap-2">
          {facility.capabilities.hazmatCertified && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
              Hazmat
            </span>
          )}
          {facility.capabilities.foodGrade && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Food Grade
            </span>
          )}
          {facility.capabilities.hasRailcarStorage && (
            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              Railcar Storage
            </span>
          )}
          {facility.capabilities.is247 && (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              24/7
            </span>
          )}
        </div>
      )}
      
      {/* Railroads */}
      {facility.railroads.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          <span className="font-medium">🚃 Railroads:</span>{' '}
          {facility.railroads.slice(0, 3).map(r => r.railroad.name).join(', ')}
          {facility.railroads.length > 3 && ` +${facility.railroads.length - 3} more`}
        </div>
      )}
      
      {/* Categories */}
      {facility.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {facility.categories.slice(0, 5).map(({ category }) => (
            <span 
              key={category.id}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded border"
            >
              {category.name}
            </span>
          ))}
          {facility.categories.length > 5 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{facility.categories.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}