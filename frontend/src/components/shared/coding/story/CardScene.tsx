import type { TraceEvent } from '@/core/python/engine'
import { foldCards } from './trace'

const WIDTH = 640
const HEIGHT = 330
const SHOWN = 4
const COLORS = ['#2fa58f', '#e5579a', '#3f7fa6', '#e8913a']

interface Props {
  title: string
  fields: string[]
  count: number
  events: TraceEvent[]
  last: TraceEvent[]
  outcome: 'win' | 'lose' | null
}

/** Le bureau : chaque enregistrement est une carte, chaque champ une ligne de la carte. */
export function CardScene({ title, fields, count, events, last, outcome }: Props) {
  const { cards } = foldCards(events)
  const total = Math.max(count, cards.length)
  // Les dernieres cartes restent visibles quand la classe est longue
  const first = Math.max(0, total - SHOWN)
  const shown = Array.from({ length: Math.min(total, SHOWN) }, (_, i) => first + i)
  const big = shown.length === 1
  const columns = shown.length <= 2 ? shown.length : 2
  const cardWidth = big ? 330 : 270
  const cardHeight = shown.length > 2 ? 118 : 56 + (fields.length + 0.4) * 34
  const rowHeight = (cardHeight - 40) / Math.max(fields.length, 1)
  const active = last.at(-1)
  const touched = active?.t === 'field' || active?.t === 'look' ? active : null

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="Bureau" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="desk-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#274a63" />
          <stop offset="1" stopColor="#3f7088" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#desk-wall)" />
      <rect y={286} width={WIDTH} height={44} fill="#7a4e2a" />
      <rect y={286} width={WIDTH} height={6} fill="#9a6838" />
      <g opacity={0.5}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <rect key={i} x={i * 96 + 6} y={8} width={86} height={10} rx={2} fill="#1d3a4e" />
        ))}
      </g>
      {/* Plante et pot a crayons sur le bureau */}
      <g transform="translate(58 286)">
        <path d="M0 -44 Q-30 -70 -34 -106 Q-6 -92 0 -52 Q6 -100 32 -116 Q34 -78 4 -44 Z" fill="#2fa58f" />
        <path d="M-20 -44 H20 L14 0 H-14 Z" fill="#e8913a" />
      </g>
      <g transform="translate(590 286)">
        <rect x={-8} y={-68} width={5} height={40} rx={2} fill="#ffc857" />
        <rect x={0} y={-76} width={5} height={48} rx={2} fill="#ff7bac" />
        <rect x={8} y={-62} width={5} height={34} rx={2} fill="#7fd4ff" />
        <rect x={-16} y={-36} width={36} height={36} rx={5} fill="#17335a" />
      </g>
      <text x={WIDTH / 2} y={40} textAnchor="middle" fontSize={15} fontWeight={700} fill="#e9f6ff">
        {total > SHOWN ? `${title} ${first + 1} → ${total}` : title}
      </text>

      {shown.map((number, index) => {
        const card = cards[number]
        const column = index % columns
        const row = Math.floor(index / columns)
        const x = (WIDTH - columns * cardWidth - (columns - 1) * 20) / 2 + column * (cardWidth + 20)
        const y = (shown.length > 2 ? 52 : 70) + row * (cardHeight + 10)
        const color = COLORS[number % COLORS.length]
        return (
          <g key={number} transform={`translate(${x} ${y})`}>
            <rect x={3} y={4} width={cardWidth} height={cardHeight} rx={12} fill="#000" opacity={0.25} />
            <rect width={cardWidth} height={cardHeight} rx={12} fill="#fdfaf1" />
            <path d={`M0 28 V12 a12 12 0 0 1 12 -12 H${cardWidth - 12} a12 12 0 0 1 12 12 V28 Z`} fill={color} />
            <text x={14} y={19} fontSize={13} fontWeight={800} fill="#fff">
              {title} {number + 1}
            </text>
            {fields.map((field, f) => {
              const value = card?.fields[field]
              const hit = touched?.r === number && touched.k === field
              const top = 34 + f * rowHeight
              return (
                <g key={field}>
                  {hit && (
                    <rect
                      x={8}
                      y={top}
                      width={cardWidth - 16}
                      height={rowHeight - 2}
                      rx={6}
                      fill={touched.t === 'field' ? '#ffe27a' : '#bfe6ff'}
                    />
                  )}
                  <text x={16} y={top + rowHeight / 2 + 5} fontSize={14} fontWeight={700} fill="#5b6b7a">
                    {field}
                  </text>
                  <text x={96} y={top + rowHeight / 2 + 5} fontSize={15} fontWeight={700} fill="#17233b">
                    {value === undefined ? '......' : String(value)}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {outcome === 'win' && (
        <g transform="translate(520 252) rotate(-12)">
          <g className="game-pop">
            <rect x={-52} y={-22} width={104} height={44} rx={8} fill="none" stroke="#57e0a6" strokeWidth={4} />
            <text textAnchor="middle" y={9} fontSize={25} fontWeight={900} fill="#57e0a6">
              VALIDE
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
