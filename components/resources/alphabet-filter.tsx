'use client'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

interface AlphabetFilterProps {
  activeLetter: string | null
  availableLetters: Set<string>
  onSelect: (letter: string | null) => void
}

export function AlphabetFilter({ activeLetter, availableLetters, onSelect }: AlphabetFilterProps) {
  return (
    <nav aria-label="Filter by letter" className="flex flex-wrap gap-1">
      <button
        onClick={() => onSelect(null)}
        className="px-2 py-1 rounded text-xs font-medium transition"
        style={{
          backgroundColor: activeLetter === null ? 'var(--accent)' : 'transparent',
          color: activeLetter === null ? 'var(--text-on-accent)' : 'var(--text-secondary)',
        }}
      >
        All
      </button>
      {LETTERS.map(letter => {
        const available = availableLetters.has(letter)
        const active = activeLetter === letter
        return (
          <button
            key={letter}
            onClick={() => available && onSelect(active ? null : letter)}
            disabled={!available}
            className="px-2 py-1 rounded text-xs font-medium transition"
            style={{
              backgroundColor: active ? 'var(--accent)' : 'transparent',
              color: active
                ? 'var(--text-on-accent)'
                : available
                  ? 'var(--text-secondary)'
                  : 'var(--text-muted)',
              cursor: available ? 'pointer' : 'default',
              opacity: available ? 1 : 0.4,
            }}
          >
            {letter}
          </button>
        )
      })}
    </nav>
  )
}
