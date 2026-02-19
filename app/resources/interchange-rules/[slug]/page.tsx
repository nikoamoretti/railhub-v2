import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import rulesData from '@/public/data/interchange-rules.json'
import type { InterchangeRule } from '@/lib/resource-types'

const rules = rulesData as InterchangeRule[]

export function generateStaticParams() {
  return rules.map(r => ({ slug: r.slug }))
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rule = rules.find(r => r.slug === slug)
  if (!rule) return { title: 'Rule Not Found | Railhub' }

  return {
    title: `${rule.title} — AAR Interchange Rules | Railhub`,
    description: rule.summary,
  }
}

const topicBadges: Record<string, { bg: string; border: string; text: string }> = {
  'Car Hire': { bg: 'var(--badge-blue-bg)', border: 'var(--badge-blue-border)', text: 'var(--badge-blue-text)' },
  'Maintenance': { bg: 'var(--badge-orange-bg)', border: 'var(--badge-orange-border)', text: 'var(--badge-orange-text)' },
  'Liability': { bg: 'var(--badge-red-bg)', border: 'var(--badge-red-border)', text: 'var(--badge-red-text)' },
  'Safety': { bg: 'var(--badge-yellow-bg)', border: 'var(--badge-yellow-border)', text: 'var(--badge-yellow-text)' },
  'Operations': { bg: 'var(--badge-green-bg)', border: 'var(--badge-green-border)', text: 'var(--badge-green-text)' },
}

export default async function InterchangeRuleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const rule = rules.find(r => r.slug === slug)

  if (!rule) notFound()

  const badge = topicBadges[rule.topic] || topicBadges.Operations
  const relatedRules = rules.filter(r => r.topic === rule.topic && r.slug !== rule.slug)

  return (
    <main>
      <header className="py-10 px-4 page-header-gradient">
        <div className="max-w-3xl mx-auto">
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
              <li>
                <Link href="/resources/interchange-rules" style={{ color: 'var(--accent-text)' }} className="hover:underline">Interchange Rules</Link>
              </li>
              <li aria-hidden="true" style={{ color: 'var(--text-muted)' }}>/</li>
              <li style={{ color: 'var(--text-tertiary)' }} aria-current="page">{rule.title}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="badge" style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}>
              {rule.topic}
            </span>
            {rule.aarRuleRef && (
              <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
                {rule.aarRuleRef}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {rule.title}
          </h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Summary
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {rule.summary}
          </p>
        </div>

        {rule.sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              {section.heading}
            </h2>
            <div className="space-y-4">
              {section.content.split('\n\n').map((p, i) => (
                <p key={i} className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}

        {relatedRules.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Related Rules in {rule.topic}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedRules.map(r => (
                <Link
                  key={r.slug}
                  href={`/resources/interchange-rules/${r.slug}`}
                  className="rounded-xl border p-4 transition hover:border-[var(--accent)]"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
                >
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.title}</h3>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{r.summary}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
