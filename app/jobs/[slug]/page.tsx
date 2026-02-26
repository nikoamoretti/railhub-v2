import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getJobBySlug } from '@/lib/jobs/queries'
import { formatSalary, formatPostedDate, formatJobType, formatWorkMode, formatExperienceLevel, isSafeUrl } from '@/lib/jobs/format'
import { getCategoryBadge } from '@/lib/jobs/categories'
import { SalaryDisplay } from '@/components/jobs/salary-display'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) return { title: 'Job Not Found | Railhub' }

  const location = [job.city, job.state].filter(Boolean).join(', ')
  const title = `${job.title} at ${job.company}${location ? ` in ${location}` : ''} | Railhub Jobs`
  const description = `${formatJobType(job.jobType)} ${job.title} position at ${job.company}${location ? ` in ${location}` : ''}. Apply now on Railhub.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website', siteName: 'Railhub' },
  }
}

const cardStyle = { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }

export default async function JobDetailPage({ params }: PageProps) {
  const { slug } = await params
  const job = await getJobBySlug(slug)

  if (!job) notFound()

  const location = [job.city, job.state].filter(Boolean).join(', ')
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)
  const posted = formatPostedDate(new Date(job.postedAt))
  const catBadge = job.category ? getCategoryBadge(job.category) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: new Date(job.postedAt).toISOString(),
    ...(('expiresAt' in job && job.expiresAt) ? { validThrough: new Date(String(job.expiresAt)).toISOString() } : {}),
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        ...(job.city && { addressLocality: job.city }),
        ...(job.state && { addressRegion: job.state }),
        addressCountry: job.country || 'US',
      },
    },
    employmentType: job.jobType.replace('_', ' '),
    ...(job.salaryMin && job.salaryMax && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salaryMin,
          maxValue: job.salaryMax,
          unitText: job.salaryPeriod === 'HOURLY' ? 'HOUR' : 'YEAR',
        },
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
                <li>
                  <Link href="/jobs" style={{ color: 'var(--accent-text)' }} className="hover:underline">Jobs</Link>
                </li>
                <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
                <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{job.title}</li>
              </ol>
            </nav>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="badge" style={{
                background: 'var(--badge-blue-bg)',
                borderColor: 'var(--badge-blue-border)',
                color: 'var(--badge-blue-text)',
              }}>
                {formatJobType(job.jobType)}
              </span>
              <span className="badge" style={{
                background: job.workMode === 'REMOTE'
                  ? 'var(--badge-green-bg)'
                  : job.workMode === 'HYBRID' ? 'var(--badge-cyan-bg)' : 'var(--badge-gray-bg)',
                borderColor: job.workMode === 'REMOTE'
                  ? 'var(--badge-green-border)'
                  : job.workMode === 'HYBRID' ? 'var(--badge-cyan-border)' : 'var(--badge-gray-border)',
                color: job.workMode === 'REMOTE'
                  ? 'var(--badge-green-text)'
                  : job.workMode === 'HYBRID' ? 'var(--badge-cyan-text)' : 'var(--badge-gray-text)',
              }}>
                {formatWorkMode(job.workMode)}
              </span>
              {catBadge && job.category && (
                <span className="badge" style={{ background: catBadge.bg, borderColor: catBadge.border, color: catBadge.text }}>
                  {job.category}
                </span>
              )}
              {job.experienceLevel && (
                <span className="badge" style={{
                  background: 'var(--badge-purple-bg)',
                  borderColor: 'var(--badge-purple-border)',
                  color: 'var(--badge-purple-text)',
                }}>
                  {formatExperienceLevel(job.experienceLevel)}
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3" style={{ color: 'var(--text-primary)' }}>
              {job.title}
            </h1>
            <p className="text-lg mt-1" style={{ color: 'var(--text-secondary)' }}>
              {job.company}
            </p>
            {location && (
              <p className="text-base mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {location}
              </p>
            )}
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Job Description
                </h2>
                <div
                  className="prose prose-sm max-w-none leading-relaxed whitespace-pre-wrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {job.description}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply CTA */}
              {isSafeUrl(job.applyUrl) && (
                <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                  <a
                    href={job.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-6 py-3 rounded-lg font-semibold text-base transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
                  >
                    Apply Now
                  </a>
                  <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
                    Opens external application page
                  </p>
                </div>
              )}

              {/* Job details */}
              <div className="rounded-xl shadow-sm border p-6" style={cardStyle}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Job Details
                </h2>
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt style={{ color: 'var(--text-tertiary)' }}>Company</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{job.company}</dd>
                  </div>
                  {location && (
                    <div className="flex justify-between text-sm">
                      <dt style={{ color: 'var(--text-tertiary)' }}>Location</dt>
                      <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{location}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt style={{ color: 'var(--text-tertiary)' }}>Type</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatJobType(job.jobType)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt style={{ color: 'var(--text-tertiary)' }}>Work Mode</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatWorkMode(job.workMode)}</dd>
                  </div>
                  {salary && (
                    <div className="flex justify-between text-sm">
                      <dt style={{ color: 'var(--text-tertiary)' }}>Salary</dt>
                      <dd><SalaryDisplay min={job.salaryMin} max={job.salaryMax} period={job.salaryPeriod} /></dd>
                    </div>
                  )}
                  {job.experienceLevel && (
                    <div className="flex justify-between text-sm">
                      <dt style={{ color: 'var(--text-tertiary)' }}>Experience</dt>
                      <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatExperienceLevel(job.experienceLevel)}</dd>
                    </div>
                  )}
                  {job.category && (
                    <div className="flex justify-between text-sm">
                      <dt style={{ color: 'var(--text-tertiary)' }}>Category</dt>
                      <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{job.category}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt style={{ color: 'var(--text-tertiary)' }}>Posted</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{posted}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt style={{ color: 'var(--text-tertiary)' }}>Source</dt>
                    <dd className="font-medium" style={{ color: 'var(--text-primary)' }}>{job.source}</dd>
                  </div>
                </dl>
              </div>

              {/* Second apply button */}
              {isSafeUrl(job.applyUrl) && (
              <a
                href={job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-6 py-3 rounded-lg font-medium text-sm border transition hover:opacity-80"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  borderColor: 'var(--accent-border)',
                  color: 'var(--accent-text)',
                }}
              >
                Apply on {job.source}
              </a>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
