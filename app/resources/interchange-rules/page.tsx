import type { Metadata } from 'next'
import Link from 'next/link'
import rulesData from '@/public/data/interchange-rules.json'
import type { InterchangeRule } from '@/lib/resource-types'

export const metadata: Metadata = {
  title: 'AAR Interchange Rules — Summaries & Explanations | Railhub',
  description: 'Plain-language summaries of AAR interchange rules covering car hire, maintenance, liability, safety, and operations between railroads.',
}

const rules = rulesData as InterchangeRule[]

const topicBadges: Record<string, { bg: string; border: string; text: string }> = {
  'Car Hire': { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  'Maintenance': { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  'Liability': { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  'Safety': { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
  'Operations': { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
}

const topics = [...new Set(rules.map(r => r.topic))].sort()

export default function InterchangeRulesPage() {
  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Breadcrumb" className="mb-4 text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" style={{ color: 'var(--accent-text)' }} className="hover:underline">Home</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li>
                <Link href="/resources" style={{ color: 'var(--accent-text)' }} className="hover:underline">Resources</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">Interchange Rules</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            AAR Interchange Rules
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Plain-language summaries of {rules.length} interchange rules governing railroad operations.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {topics.map(topic => {
          const badge = topicBadges[topic] || topicBadges.Operations
          const topicRules = rules.filter(r => r.topic === topic)

          return (
            <section key={topic}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <span className="badge" style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}>
                  {topic}
                </span>
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  {topicRules.length} rule{topicRules.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topicRules.map(rule => (
                  <Link
                    key={rule.slug}
                    href={`/resources/interchange-rules/${rule.slug}`}
                    className="block"
                  >
                    <article
                      className="rounded-xl border p-5 h-full transition hover:border-[var(--accent)]"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                    >
                      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {rule.title}
                      </h3>
                      <p className="text-sm line-clamp-3 leading-relaxed mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {rule.summary}
                      </p>
                      {rule.aarRuleRef && (
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {rule.aarRuleRef}
                        </span>
                      )}
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
