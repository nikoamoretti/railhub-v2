interface RailroadMarkProps {
  shortName: string
  accentColor: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-11 h-11 text-xs',
  lg: 'w-14 h-14 text-sm',
}

export function RailroadMark({ shortName, accentColor, size = 'md' }: RailroadMarkProps) {
  return (
    <div
      className={`${sizeMap[size]} rounded-lg flex items-center justify-center font-bold tracking-tight border flex-shrink-0`}
      style={{
        backgroundColor: `${accentColor}1A`,
        borderColor: `${accentColor}40`,
        color: accentColor,
      }}
    >
      {shortName}
    </div>
  )
}
