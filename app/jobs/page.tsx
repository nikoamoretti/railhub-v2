import type { Metadata } from 'next'
import { getJobs, getJobFilterOptions, getJobStats, ITEMS_PER_PAGE } from '@/lib/jobs/queries'
import type { JobFilters } from '@/lib/jobs/types'
import { JobCard } from '@/components/jobs/job-card'
import { JobSearchFilters } from '@/components/jobs/job-search-filters'
import { JobStatsBar } from '@/components/jobs/job-stats'
import { Pagination } from '@/components/pagination'

export const metadata: Metadata = {
  title: 'Rail Industry Jobs | Railhub',
  description: 'Find railroad and rail freight jobs across the United States. Browse conductor, engineer, maintenance, operations, and management positions.',
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = await searchParams

  const filters: JobFilters = {
    q: params.q,
    state: params.state,
    company: params.company,
    category: params.category,
    jobType: params.jobType,
    workMode: params.workMode,
    experienceLevel: params.experienceLevel,
    sort: params.sort,
    page: params.page,
  }

  const [{ jobs, total }, filterOptions, stats] = await Promise.all([
    getJobs(filters),
    getJobFilterOptions(),
    getJobStats(),
  ])

  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const hasFilters = !!(params.q || params.state || params.company || params.category || params.jobType || params.workMode)

  return (
    <main>
      <a href="#job-results" className="skip-link">
        Skip to results
      </a>

      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Rail Industry Jobs
          </h1>
          <p className="text-lg mb-1" style={{ color: 'var(--text-secondary)' }}>
            Find your next career in rail freight
          </p>
          <p className="text-sm mb-5 max-w-xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Browse {stats.totalActive.toLocaleString()} active positions across railroads, transload facilities, and freight companies.
          </p>
          <JobStatsBar stats={stats} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <JobSearchFilters
          filterOptions={filterOptions}
          totalResults={stats.totalActive}
          filteredResults={total}
        />

        <div id="job-results" className="mt-6" role="region" aria-label="Job results">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No jobs found</p>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Try removing some filters or searching a different term.
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>Popular:</span>
                {['Conductor', 'Engineer', 'Maintenance', 'Operations', 'Safety'].map((term) => (
                  <a
                    key={term}
                    href={`/jobs?q=${encodeURIComponent(term)}`}
                    className="px-3 py-1 rounded-full transition hover:opacity-80"
                    style={{ background: 'var(--accent-muted)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)' }}
                  >
                    {term}
                  </a>
                ))}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              searchParams={params as { [key: string]: string | undefined }}
              basePath="/jobs"
            />
          )}
        </div>

        {/* Top categories — unfiltered only */}
        {!hasFilters && currentPage === 1 && stats.byCategory.length > 0 && (
          <section className="mt-12 mb-4">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Top Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {stats.byCategory.map((c) => (
                <a
                  key={c.category}
                  href={`/jobs?category=${encodeURIComponent(c.category)}`}
                  className="rounded-xl border p-4 text-center transition hover:border-[var(--accent)] hover:shadow-md"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                >
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.category}</div>
                  <div className="text-lg font-bold mt-1" style={{ color: 'var(--accent-text)' }}>
                    {c.count.toLocaleString()}
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
