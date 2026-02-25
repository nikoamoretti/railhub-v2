import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import facilitiesData from '@/public/facilities.json'
import type { Facility } from '@/lib/types'
import { getTypeLabel, getBadgeStyle } from '@/lib/facility-types'
import { isValidRailroad } from '@/lib/railroads'
import { FacilityCard } from '@/components/facility-card'

const facilities = facilitiesData as Facility[]

export function generateStaticParams() {
  return facilities.map(f => ({ id: f.id }))
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

function isSafeEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const DAYS = [
  { key: 'hours_monday' as const, label: 'Monday' },
  { key: 'hours_tuesday' as const, label: 'Tuesday' },
  { key: 'hours_wednesday' as const, label: 'Wednesday' },
  { key: 'hours_thursday' as const, label: 'Thursday' },
  { key: 'hours_friday' as const, label: 'Friday' },
  { key: 'hours_saturday' as const, label: 'Saturday' },
  { key: 'hours_sunday' as const, label: 'Sunday' },
]

interface PageProps {
  params: Promise<{ id: string }>
}

const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const facility = facilities.find(f => f.id === id || f.external_id === id)

  if (!facility) return { title: 'Facility Not Found | Railhub' }

  const typeLabel = getTypeLabel(facility.type)
  const location = facility.location
    ? `${facility.location.city}, ${facility.location.state}`
    : ''
  const title = `${facility.name} - ${typeLabel} in ${location} | Railhub`
  const description = facility.description
    || `${facility.name} is a ${typeLabel.toLowerCase()} facility${location ? ` in ${location}` : ''}. Find railroad connections, capacity, and contact information on Railhub.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Railhub' },
  }
}

export default async function FacilityPage({ params }: PageProps) {
  const { id } = await params
  const facility = facilities.find(f => f.id === id || f.external_id === id)

  if (!facility) notFound()

  const typeLabel = getTypeLabel(facility.type)
  const badge = getBadgeStyle(facility.type)
  const validRailroads = (facility.railroads || [])
    .map(r => r.railroad?.name)
    .filter((name): name is string => !!name && isValidRailroad(name))

  const productTypes = facility.capabilities?.product_types || []
  const transferModes = facility.capabilities?.transfer_modes || []
  const equipmentList = facility.capabilities?.equipment_list || []
  const storageOptions = facility.capabilities?.storage_options || []
  const hasHours = DAYS.some(d => facility.capabilities?.[d.key])
  const aboutText = facility.about || facility.description

  const similarFacilities = facilities
    .filter(f =>
      f.id !== facility.id &&
      f.type === facility.type &&
      f.location?.state === facility.location?.state
    )
    .slice(0, 3)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: facility.name,
    ...(facility.description && { description: facility.description }),
    ...(facility.phone && { telephone: facility.phone }),
    ...(facility.website && isSafeUrl(facility.website) && { url: facility.website }),
    ...(facility.location && {
      address: {
        '@type': 'PostalAddress',
        ...(facility.location.street_address && { streetAddress: facility.location.street_address }),
        ...(facility.location.city && { addressLocality: facility.location.city }),
        ...(facility.location.state && { addressRegion: facility.location.state }),
        ...(facility.location.zip_code && { postalCode: facility.location.zip_code }),
        ...(facility.location.country && { addressCountry: facility.location.country }),
      },
    }),
    ...(facility.google_rating != null && facility.google_review_count != null && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: facility.google_rating,
        reviewCount: facility.google_review_count,
        bestRating: 5,
      },
    }),
    ...(facility.location?.latitude != null && facility.location?.longitude != null && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: facility.location.latitude,
        longitude: facility.location.longitude,
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <main>
        <header className="py-8 px-4 page-header-gradient">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-4 text-sm">
              <ol className="flex items-center gap-1.5">
                <li>
                  <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
                </li>
                <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
                {facility.location?.state && (
                  <>
                    <li>
                      <Link href={`/state/${facility.location.state}`} style={{ color: 'var(--accent-text)' }} className="hover:underline">
                        {facility.location.state}
                      </Link>
                    </li>
                    <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
                  </>
                )}
                <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{facility.name}</li>
              </ol>
            </nav>

            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="badge" style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}>
                {typeLabel}
              </span>
              {facility.capabilities?.hazmat_certified && (
                <span className="badge" style={{ background: 'var(--badge-red-bg)', borderColor: 'var(--badge-red-border)', color: 'var(--badge-red-text)' }}>Hazmat</span>
              )}
              {facility.capabilities?.food_grade && (
                <span className="badge" style={{ background: 'var(--badge-green-bg)', borderColor: 'var(--badge-green-border)', color: 'var(--badge-green-text)' }}>Food Grade</span>
              )}
              {facility.capabilities?.is_24_7 && (
                <span className="badge" style={{ background: 'var(--badge-yellow-bg)', borderColor: 'var(--badge-yellow-border)', color: 'var(--badge-yellow-text)' }}>24/7</span>
              )}
              {facility.capabilities?.kosher_certified && (
                <span className="badge" style={{ background: 'var(--badge-cyan-bg)', borderColor: 'var(--badge-cyan-border)', color: 'var(--badge-cyan-text)' }}>Kosher</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>{facility.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {facility.location && (
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  {facility.location.city}, {facility.location.state}
                  {facility.location.zip_code ? ` ${facility.location.zip_code}` : ''}
                </p>
              )}
              {facility.google_rating != null && (
                <span className="flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full border" style={{ background: 'var(--badge-yellow-bg)', borderColor: 'var(--badge-yellow-border)', color: 'var(--badge-yellow-text)' }}>
                  <span aria-hidden="true">&#9733;</span>
                  {facility.google_rating}
                  {facility.google_review_count != null && (
                    <span className="font-normal" style={{ color: 'var(--text-tertiary)' }}>({facility.google_review_count})</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <span aria-hidden="true">📍 </span>Location
              </h2>
              {facility.location ? (
                <div className="space-y-2">
                  {facility.location.street_address && (
                    <p style={{ color: 'var(--text-secondary)' }}>{facility.location.street_address}</p>
                  )}
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {facility.location.city}, {facility.location.state} {facility.location.zip_code}
                  </p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Location information not available</p>
              )}
            </div>

            {/* Contact */}
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <span aria-hidden="true">📞 </span>Contact
              </h2>
              <div className="space-y-2">
                {facility.phone ? (
                  <p>
                    <a href={`tel:${facility.phone.replace(/[^+\d]/g, '')}`} className="hover:underline" style={{ color: 'var(--accent-text)' }}>
                      {facility.phone}
                    </a>
                  </p>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No phone number</p>
                )}
                {facility.email && isSafeEmail(facility.email) && (
                  <p>
                    <a href={`mailto:${facility.email}`} className="hover:underline" style={{ color: 'var(--accent-text)' }}>
                      {facility.email}
                    </a>
                  </p>
                )}
                {facility.website && isSafeUrl(facility.website) && (
                  <p>
                    <a href={facility.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--accent-text)' }}>
                      Visit Website <span aria-hidden="true">&rarr;</span>
                    </a>
                  </p>
                )}
              </div>
            </div>

            {/* Capabilities */}
            {facility.capabilities && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">⚙️ </span>Capabilities
                </h2>
                <div className="space-y-3">
                  {facility.capabilities.track_capacity && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Track Capacity</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{facility.capabilities.track_capacity} cars</span>
                    </div>
                  )}
                  {facility.capabilities.railcar_spot_count && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Railcar Spots</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{facility.capabilities.railcar_spot_count}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {facility.capabilities.has_scale && (
                      <span className="badge" style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}>Has Scale</span>
                    )}
                    {facility.capabilities.has_railcar_storage && (
                      <span className="badge" style={{ background: 'var(--badge-purple-bg)', borderColor: 'var(--badge-purple-border)', color: 'var(--badge-purple-text)' }}>Railcar Storage</span>
                    )}
                    {facility.capabilities.heating_capabilities && (
                      <span className="badge" style={{ background: 'var(--badge-orange-bg)', borderColor: 'var(--badge-orange-border)', color: 'var(--badge-orange-text)' }}>Heating</span>
                    )}
                    {facility.capabilities.onsite_railcar_storage && (
                      <span className="badge" style={{ background: 'var(--badge-indigo-bg)', borderColor: 'var(--badge-indigo-border)', color: 'var(--badge-indigo-text)' }}>Onsite Storage</span>
                    )}
                    {facility.capabilities.onsite_scale && (
                      <span className="badge" style={{ background: 'var(--badge-pink-bg)', borderColor: 'var(--badge-pink-border)', color: 'var(--badge-pink-text)' }}>Onsite Scale</span>
                    )}
                    {facility.capabilities.weight_restricted_263k && (
                      <span className="badge" style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}>263k Limit</span>
                    )}
                    {facility.capabilities.weight_restricted_286k && (
                      <span className="badge" style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}>286k Limit</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Railroads */}
            <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                <span aria-hidden="true">🚃 </span>Railroads
              </h2>
              {validRailroads.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {validRailroads.map((rr, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm font-medium border" style={{ background: 'var(--badge-blue-bg)', color: 'var(--badge-blue-text)', borderColor: 'var(--badge-blue-border)' }}>
                      {rr}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No railroad information available</p>
              )}
            </div>

            {/* Hours of Operation */}
            {hasHours && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🕐 </span>Hours
                </h2>
                <div className="space-y-2">
                  {DAYS.map(({ key, label }) => {
                    const value = facility.capabilities?.[key]
                    if (!value) return null
                    const isClosed = value.toLowerCase() === 'closed'
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ color: isClosed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Storage Options */}
            {storageOptions.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🏗️ </span>Storage Options
                </h2>
                <div className="flex flex-wrap gap-2">
                  {storageOptions.map((opt, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm border" style={{ background: 'var(--badge-purple-bg)', borderColor: 'var(--badge-purple-border)', color: 'var(--badge-purple-text)' }}>
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Types */}
            {productTypes.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">📦 </span>Product Types
                </h2>
                <div className="flex flex-wrap gap-2">
                  {productTypes.map((type, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm border" style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transfer Modes */}
            {transferModes.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🔄 </span>Transfer Modes
                </h2>
                <div className="flex flex-wrap gap-2">
                  {transferModes.map((mode, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm border" style={{ background: 'var(--badge-green-bg)', borderColor: 'var(--badge-green-border)', color: 'var(--badge-green-text)' }}>
                      {mode}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {equipmentList.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🛠️ </span>Equipment
                </h2>
                <ul className="space-y-1">
                  {equipmentList.map((eq, idx) => (
                    <li key={idx} style={{ color: 'var(--text-secondary)' }}>&bull; {eq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Security Features */}
            {facility.capabilities?.security_features && facility.capabilities.security_features.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🔒 </span>Security
                </h2>
                <div className="flex flex-wrap gap-2">
                  {facility.capabilities.security_features.map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full text-sm border" style={{ background: 'var(--badge-red-bg)', borderColor: 'var(--badge-red-border)', color: 'var(--badge-red-text)' }}>
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cities Served */}
            {facility.capabilities?.cities_served && facility.capabilities.cities_served.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">🏙️ </span>Cities Served
                </h2>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {facility.capabilities.cities_served.map((city, idx) => (
                    <span key={idx} className="px-2 py-1 rounded text-sm border" style={{ background: 'var(--badge-gray-bg)', borderColor: 'var(--badge-gray-border)', color: 'var(--badge-gray-text)' }}>
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Google Reviews */}
            {facility.google_reviews && facility.google_reviews.length > 0 && (
              <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <span aria-hidden="true">&#9733; </span>Google Reviews
                  </h2>
                  {facility.google_rating != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{facility.google_rating}</span>
                      <div className="text-right">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span key={star} style={{ color: star <= Math.round(facility.google_rating ?? 0) ? 'var(--badge-yellow-text)' : 'var(--border-default)' }}>&#9733;</span>
                          ))}
                        </div>
                        {facility.google_review_count != null && (
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{facility.google_review_count} reviews</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {facility.google_reviews.map((review, idx) => (
                    <div key={idx} className="border-t pt-4 first:border-t-0 first:pt-0" style={{ borderColor: 'var(--border-default)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{review.author}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{review.relative_time}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span key={star} className="text-xs" style={{ color: star <= (review.rating ?? 0) ? 'var(--badge-yellow-text)' : 'var(--border-default)' }}>&#9733;</span>
                        ))}
                      </div>
                      {review.text && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{review.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {aboutText && (
              <div className="rounded-xl shadow-sm border p-6 md:col-span-2" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  <span aria-hidden="true">ℹ️ </span>About
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{aboutText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Similar Facilities */}
        {similarFacilities.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 pb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Similar Facilities in {facility.location?.state}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similarFacilities.map(f => (
                <FacilityCard key={f.id} facility={f} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
