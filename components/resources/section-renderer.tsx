interface Section {
  id: string
  heading: string
  content: string
}

interface SectionRendererProps {
  sections: Section[]
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <div className="space-y-10">
      {sections.map(section => (
        <section key={section.id} id={section.id}>
          <h2
            className="text-2xl font-bold mb-4 scroll-mt-20"
            style={{ color: 'var(--text-primary)' }}
          >
            {section.heading}
          </h2>
          <div
            className="prose-custom space-y-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            {section.content.split('\n\n').map((paragraph, i) => (
              <p key={i} className="leading-relaxed">{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
