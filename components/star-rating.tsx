interface StarRatingProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }

export function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, rating))
  const pct = (clamped / 5) * 100

  return (
    <span
      className={`inline-flex relative ${sizes[size]}`}
      style={{ lineHeight: 1 }}
      aria-label={`${rating} out of 5 stars`}
    >
      {/* Empty stars (background) */}
      <span aria-hidden="true" style={{ color: 'var(--border-default)' }}>
        {'★★★★★'}
      </span>
      {/* Filled stars (foreground, clipped to rating width) */}
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%`, color: 'var(--badge-yellow-text)' }}
      >
        {'★★★★★'}
      </span>
    </span>
  )
}
