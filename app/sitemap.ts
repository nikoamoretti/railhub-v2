import type { MetadataRoute } from 'next'
import facilitiesData from '@/public/facilities.json'
import type { Facility } from '@/lib/types'

const BASE_URL = 'https://railhub-v2.vercel.app'
const facilities = facilitiesData as Facility[]

export default function sitemap(): MetadataRoute.Sitemap {
  const states = [...new Set(
    facilities.map(f => f.location?.state).filter(Boolean)
  )] as string[]

  const stateEntries: MetadataRoute.Sitemap = states.map(state => ({
    url: `${BASE_URL}/state/${state}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const facilityEntries: MetadataRoute.Sitemap = facilities.map(f => ({
    url: `${BASE_URL}/facility/${f.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/states`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...stateEntries,
    ...facilityEntries,
  ]
}
