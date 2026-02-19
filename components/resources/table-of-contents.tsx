'use client'

import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  title: string
}

interface TableOfContentsProps {
  items: TocItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [items])

  return (
    <nav
      aria-label="Table of contents"
      className="sticky top-20 rounded-xl border p-4"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
        On This Page
      </h2>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block text-sm py-1 transition hover:opacity-80"
              style={{
                color: activeId === item.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                borderLeft: activeId === item.id ? '2px solid var(--accent)' : '2px solid transparent',
                paddingLeft: '12px',
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
