import Link from 'next/link'

interface ResourceCardProps {
  href: string
  title: string
  description: string
  count: string
  icon: string
}

export function ResourceCard({ href, title, description, count, icon }: ResourceCardProps) {
  return (
    <Link href={href} className="block">
      <article
        className="rounded-xl border p-6 transition hover:border-[var(--accent)] hover:shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
      >
        <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h2>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
        <span className="text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
          {count} &rarr;
        </span>
      </article>
    </Link>
  )
}
