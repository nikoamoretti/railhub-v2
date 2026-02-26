import type { Metadata } from 'next'
import facilitiesData from '../../public/facilities.json'
import type { Facility } from '@/lib/types'
import { MapClient } from './map-client'

export const metadata: Metadata = {
  title: 'Facility Map | Railhub',
  description: 'Interactive map of rail-served facilities across North America. Find transload, team track, storage, and intermodal locations near you.',
}

const facilities = facilitiesData as Facility[]

function getStates(): string[] {
  const states = [...new Set(facilities.map(f => f.location?.state).filter(Boolean))] as string[]
  return states.sort()
}

export default function MapPage() {
  const withCoords = facilities.filter(f => f.location?.latitude && f.location?.longitude)
  const states = getStates()

  return <MapClient facilities={withCoords} allCount={facilities.length} states={states} />
}
