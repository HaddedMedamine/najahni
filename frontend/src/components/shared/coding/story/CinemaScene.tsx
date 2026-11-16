import { cn } from '@/core/lib/utils'
import type { TraceEvent } from '@/core/python/engine'
import { foldCinema } from './trace'

const WIDTH = 640
const HEIGHT = 330
const TOP = 84

interface Props {
  rows: number[][]
  mode: 'seats' | 'numbers'
  events: TraceEvent[]
  last: TraceEvent[]
  outcome: 'win' | 'lose' | null
}

/** La salle de cinema : la matrice, un siege par case, le projecteur sur la case lue. */
export function CinemaScene({ rows, mode, events, last, outcome }: Props) {
  const seats = foldCinema(rows, events)
  const [nl, nc] = [rows.length, rows[0].length]
  const size = Math.min(62, 520 / nc, 222 / nl)
  const left = (WIDTH - nc * size) / 2
  const active = last.at(-1)
  const cell = active?.t === 'mget' || active?.t === 'mset' ? active : null
  const lit = outcome === 'win'

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="Cinéma" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="cine-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dff3ff" />
          <stop offset="1" stopColor="#7fd4ff" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill={lit ? '#3b2152' : '#160f24'} style={{ transition: 'fill .5s' }} />
      <rect x={0} width={46} height={HEIGHT} fill="#7a1f2e" />
      <rect x={WIDTH - 46} width={46} height={HEIGHT} fill="#7a1f2e" />
      {[10, 26, WIDTH - 36, WIDTH - 20].map((x) => (
        <rect key={x} x={x} width={4} height={HEIGHT} fill="#5a1522" />
      ))}
      <rect x={120} y={14} width={400} height={42} rx={6} fill="url(#cine-screen)" opacity={0.92} />
      <text x={WIDTH / 2} y={41} textAnchor="middle" fontSize={15} fontWeight={800} fill="#17335a">
        Écran
      </text>

      {seats[0].map((_, j) => (
        <text key={j} x={left + (j + 0.5) * size} y={TOP - 7} textAnchor="middle" fontSize={12} fontWeight={700} fill="#aab6d6">
          {j}
        </text>
      ))}

      {seats.map((row, i) => (
        <g key={i}>
          <text x={left - 14} y={TOP + (i + 0.55) * size} textAnchor="middle" fontSize={12} fontWeight={700} fill="#aab6d6">
            {i}
          </text>
          {row.map((value, j) => {
            const x = left + j * size
            const y = TOP + i * size
            const hit = cell?.i === i && cell.j === j
            const pad = size * 0.09
            return (
              <g key={j}>
                {hit && <rect x={x} y={y} width={size} height={size} rx={size * 0.2} fill="#ffe27a" opacity={0.9} />}
                <rect
                  x={x + pad}
                  y={y + pad}
                  width={size - pad * 2}
                  height={size - pad * 2}
                  rx={size * 0.16}
                  fill={mode === 'seats' && value === 0 ? '#54344d' : '#c23a4f'}
                />
                <rect x={x + pad} y={y + size * 0.68} width={size - pad * 2} height={size * 0.2} rx={size * 0.08} fill="#8f2436" />
                {mode === 'seats' && value !== 0 && (
                  <g className={cn(hit && cell?.t === 'mset' && 'game-pop')}>
                    <circle cx={x + size / 2} cy={y + size * 0.36} r={size * 0.17} fill="#e9b98b" />
                    <path
                      d={`M${x + size * 0.26} ${y + size * 0.72} Q${x + size / 2} ${y + size * 0.42} ${x + size * 0.74} ${y + size * 0.72} Z`}
                      fill="#2fa58f"
                    />
                  </g>
                )}
                {mode === 'numbers' && (
                  <text x={x + size / 2} y={y + size * 0.58} textAnchor="middle" fontSize={size * 0.32} fontWeight={800} fill="#fff">
                    {value}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      ))}
    </svg>
  )
}
