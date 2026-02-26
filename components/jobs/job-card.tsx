import Link from 'next/link'
import type { JobWithSource } from '@/lib/jobs/types'
import { formatSalary, formatPostedDate, formatJobType, formatWorkMode } from '@/lib/jobs/format'
import { getCategoryBadge } from '@/lib/jobs/categories'

interface JobCardProps {
  job: JobWithSource
}

const JOB_TYPE_BADGE: Record<string, { bg: string; border: string; text: string }> = {
  FULL_TIME:  { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  PART_TIME:  { bg: 'var(--badge-purple-bg)', border: 'var(--badge-purple-border)', text: 'var(--badge-purple-text)' },
  CONTRACT:   { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  INTERNSHIP: { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  TEMPORARY:  { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
}

const WORK_MODE_BADGE: Record<string, { bg: string; border: string; text: string }> = {
  REMOTE: { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
  HYBRID: { bg: 'var(--badge-cyan-bg)', border: 'var(--badge-cyan-border)', text: 'var(--badge-cyan-text)' },
  ONSITE: { bg: 'var(--badge-gray-bg)', border: 'var(--badge-gray-border)', text: 'var(--badge-gray-text)' },
}

export function JobCard({ job }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryPeriod)
  const posted = formatPostedDate(new Date(job.postedAt))
  const typeBadge = JOB_TYPE_BADGE[job.jobType] || JOB_TYPE_BADGE.FULL_TIME
  const modeBadge = WORK_MODE_BADGE[job.workMode] || WORK_MODE_BADGE.ONSITE
  const catBadge = job.category ? getCategoryBadge(job.category) : null

  return (
    <Link href={`/jobs/${job.slug}`} className="block">
      <article className="facility-card job-card">
        {/* Row 1: Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="badge" style={{ background: typeBadge.bg, borderColor: typeBadge.border, color: typeBadge.text }}>
              {formatJobType(job.jobType)}
            </span>
            <span className="badge" style={{ background: modeBadge.bg, borderColor: modeBadge.border, color: modeBadge.text }}>
              {formatWorkMode(job.workMode)}
            </span>
          </div>
          {salary && (
            <span className="text-sm font-semibold flex-shrink-0" style={{ color: 'var(--badge-green-text)' }}>
              {salary}
            </span>
          )}
        </div>

        {/* Row 2: Title + Company */}
        <h3 className="text-base font-semibold mt-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
          {job.title}
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          {job.company}
        </p>

        {/* Row 3: Location */}
        {(job.city || job.state) && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
            {[job.city, job.state].filter(Boolean).join(', ')}
          </p>
        )}

        <div className="card-divider" />

        {/* Row 4: Category + posted */}
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex items-center gap-2">
            {catBadge && job.category && (
              <span className="badge" style={{ background: catBadge.bg, borderColor: catBadge.border, color: catBadge.text }}>
                {job.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>{posted}</span>
            <span style={{ color: 'var(--accent-text)' }}>View &rarr;</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
