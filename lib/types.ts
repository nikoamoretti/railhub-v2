export interface FacilityLocation {
  street_address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
}

export interface FacilityCapabilities {
  track_capacity: number | null
  railcar_spot_count: number | null
  hazmat_certified: boolean
  food_grade: boolean
  kosher_certified: boolean
  has_scale: boolean
  has_railcar_storage: boolean
  is_24_7: boolean
  weight_restricted_263k: boolean
  weight_restricted_286k: boolean
  equipment_list: string[]
  storage_options: string[]
  transfer_modes: string[]
  security_features: string[]
  cities_served: string[]
  heating_capabilities: boolean
  onsite_railcar_storage: boolean
  onsite_scale: boolean
  product_types: string[]
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null
}

export interface FacilityRailroad {
  railroad: { name: string }
  daysOfWeek: string | null
  notes: string | null
}

export interface FacilityCategory {
  category: { name: string; type: string }
}

export interface Facility {
  id: string
  external_id: string
  name: string
  type: string
  status: string
  phone: string | null
  email: string | null
  website: string | null
  description: string | null
  about: string | null
  location: FacilityLocation | null
  capabilities: FacilityCapabilities | null
  categories: FacilityCategory[]
  railroads: FacilityRailroad[]
}
