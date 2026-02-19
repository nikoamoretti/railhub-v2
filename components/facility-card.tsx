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

const TYPE_BADGE_STYLES: { [key: string]: { bg: string, border: string, text: string } } = {
  TRANSLOAD:     { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  STORAGE:       { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  TEAM_TRACK:    { bg: 'var(--badge-purple-bg)', border: 'var(--badge-purple-border)', text: 'var(--badge-purple-text)' },
  REPAIR_SHOP:   { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  INTERMODAL:    { bg: 'var(--badge-indigo-bg)', border: 'var(--badge-indigo-border)', text: 'var(--badge-indigo-text)' },
  BULK_TRANSFER: { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
  TANK_WASH:     { bg: 'var(--badge-cyan-bg)', border: 'var(--badge-cyan-border)', text: 'var(--badge-cyan-text)' },
  MANUFACTURING: { bg: 'var(--badge-pink-bg)', border: 'var(--badge-pink-border)', text: 'var(--badge-pink-text)' },
}

const DEFAULT_BADGE = { bg: 'var(--badge-gray-bg)', border: 'var(--badge-gray-border)', text: 'var(--badge-gray-text)' }

export function FacilityCard({ facility }: FacilityCardProps) {
  const typeLabel = TYPE_LABELS[facility.type] || facility.type?.replace(/_/g, ' ')
  const badge = TYPE_BADGE_STYLES[facility.type] || DEFAULT_BADGE

  const validRailroads = facility.railroads
    ?.map((r: any) => r.railroad?.name)
    ?.filter((name: string) => isValidRailroad(name))
    ?.slice(0, 4) || []

  const capacity = facility.capabilities?.track_capacity
  const productCount = facility.capabilities?.product_types?.length || 0

  return (
    <Link href={`/facility/${facility.id}`} className="block">
      <article className="facility-card">
        {/* ── Tier 1: Identity ── */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="badge"
            style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
          >
            {typeLabel}
          </span>
          <div className="flex gap-1.5 flex-shrink-0">
            {facility.capabilities?.hazmat_certified && (
              <span
                className="badge"
                style={{ background: 'var(--badge-red-bg)', borderColor: 'var(--badge-red-border)', color: 'var(--badge-red-text)' }}
              >
                Hazmat
              </span>
            )}
            {facility.capabilities?.food_grade && (
              <span
                className="badge"
                style={{ background: 'var(--badge-green-bg)', borderColor: 'var(--badge-green-border)', color: 'var(--badge-green-text)' }}
              >
                Food Grade
              </span>
            )}
          </div>
        </div>

        <h3 className="text-base font-semibold mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {facility.name}
        </h3>

        {facility.location && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {facility.location.city}, {facility.location.state}
            {facility.location.zip_code ? ` ${facility.location.zip_code}` : ''}
          </p>
        )}

        {/* ── Tier 2: Key details ── */}
        <div className="card-divider" />

        <div className="flex items-center justify-between gap-3 text-sm">
          <div className="flex-1 min-w-0">
            {validRailroads.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {validRailroads.map((rr: string) => (
                  <span
                    key={rr}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', border: '1px solid var(--badge-blue-border)' }}
                  >
                    {rr}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No railroad info</span>
            )}
          </div>
          {capacity && (
            <span className="text-xs font-medium flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
              {capacity} cars
            </span>
          )}
        </div>

        {/* ── Tier 3: Meta row ── */}
        <div className="card-divider" />

        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex items-center gap-3">
            {facility.phone && (
              <a
                href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`}
                className="hover:underline"
                style={{ color: 'var(--text-secondary)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {facility.phone}
              </a>
            )}
            {!facility.phone && facility.capabilities?.is_24_7 && (
              <span style={{ color: 'var(--badge-green-text)' }}>24/7</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {productCount > 0 && (
              <span>{productCount} product{productCount !== 1 ? 's' : ''}</span>
            )}
            <span style={{ color: 'var(--accent-text)' }}>View &rarr;</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
