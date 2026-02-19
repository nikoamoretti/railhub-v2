export const FACILITY_TYPES = [
  { value: 'TRANSLOAD', label: 'Transload' },
  { value: 'STORAGE', label: 'Storage' },
  { value: 'TEAM_TRACK', label: 'Team Track' },
  { value: 'BULK_TRANSFER', label: 'Bulk Transfer' },
  { value: 'REPAIR_SHOP', label: 'Repair Shop' },
  { value: 'INTERMODAL', label: 'Intermodal' },
  { value: 'TANK_WASH', label: 'Tank Wash' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'SHORTLINE', label: 'Shortline Railroad' },
  { value: 'PRIVATESIDING', label: 'Private Siding' },
  { value: 'WAREHOUSING', label: 'Warehousing' },
  { value: 'LINING', label: 'Lining/Coating' },
  { value: 'CUSTOMS', label: 'Customs Broker' },
  { value: 'SCALE', label: 'Scale/Weigh Station' },
  { value: 'TRANSLOADING', label: 'Transloading Operator' },
  { value: 'INSPECTION', label: 'Inspection Service' },
  { value: 'MOBILEREPAIR', label: 'Mobile Repair' },
  { value: 'DRAYAGE', label: 'Drayage' },
  { value: 'LEASING', label: 'Leasing Company' },
  { value: 'CARBUILDER', label: 'Car Builder' },
  { value: 'PARTS', label: 'Parts Supplier' },
  { value: 'SIGNAL', label: 'Signal Contractor' },
  { value: 'MANAGEMENT', label: 'Management Company' },
  { value: 'BROKER', label: 'Broker' },
  { value: 'FREIGHTFORWARDER', label: 'Freight Forwarder' },
  { value: 'ENGINEERING', label: 'Engineering/Construction' },
  { value: 'CHASSIS', label: 'Chassis Provider' },
  { value: 'LOCOMOTIVESHOP', label: 'Locomotive Shop' },
  { value: 'LOCOMOTIVELEASING', label: 'Locomotive Leasing' },
  { value: 'SWITCHING', label: 'Switching Railroad' },
  { value: 'TMS', label: 'TMS Platform' },
  { value: 'FUMIGATION', label: 'Fumigation' },
  { value: 'DEMURRAGE', label: 'Demurrage Consulting' },
  { value: 'TRACKING', label: 'Tracking Platform' },
  { value: 'EDI', label: 'EDI Provider' },
  { value: 'FLEETMGMT', label: 'Fleet Management' },
  { value: 'LOADPLAN', label: 'Load Planning' },
  { value: 'YARDMGMT', label: 'Yard Management' },
  { value: 'DEMURRAGESOFT', label: 'Demurrage Software' },
] as const

export const TYPE_LABEL_MAP: Record<string, string> =
  Object.fromEntries(FACILITY_TYPES.map(t => [t.value, t.label]))

export const TYPE_LABEL_MAP_LOWER: Record<string, string> =
  Object.fromEntries(FACILITY_TYPES.map(t => [t.value.toLowerCase(), t.label]))

export const TYPE_BADGE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
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

export function getBadgeStyle(type: string) {
  return TYPE_BADGE_STYLES[type] || DEFAULT_BADGE
}

export function getTypeLabel(type: string): string {
  return TYPE_LABEL_MAP[type] || type.replace(/_/g, ' ')
}
