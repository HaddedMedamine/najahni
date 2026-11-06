import type { CSSProperties } from 'react'
import { cn } from '@/core/lib/utils'
import type { TraceEvent } from '@/core/python/engine'
import { foldPenguins, isSorted } from './trace'

const WIDTH = 640
const HEIGHT = 330
const ROW = 262
const OUT_ROW = 312
const SCARVES = ['#ff7bac', '#ffc857', '#57e0a6', '#7fd4ff', '#c9a7ff', '#ff9f68', '#9be15d']

function Penguin({ size, value, scarf, looking }: { size: number; value: number; scarf: string; looking: boolean }) {
  const scale = size / 100
  return (
    <>
      {looking && <ellipse cx={0} cy={2} rx={34} ry={9} fill="#ffe27a" opacity={0.85} />}
      <g transform={`scale(${scale})`}>
        <ellipse cx={-11} cy={-2} rx={10} ry={4} fill="#ff9f43" />
        <ellipse cx={11} cy={-2} rx={10} ry={4} fill="#ff9f43" />
        <path d="M-25 -58 Q-40 -38 -31 -22 Q-23 -30 -21 -46 Z" fill="#17233b" />
        <path d="M25 -58 Q40 -38 31 -22 Q23 -30 21 -46 Z" fill="#17233b" />
        <ellipse cx={0} cy={-46} rx={26} ry={44} fill="#22314f" />
        <ellipse cx={0} cy={-38} rx={18} ry={33} fill="#f5f8ff" />
        <circle cx={0} cy={-82} r={18} fill="#22314f" />
        <ellipse cx={-7} cy={-82} rx={6.5} ry={7.5} fill="#f5f8ff" />
        <ellipse cx={7} cy={-82} rx={6.5} ry={7.5} fill="#f5f8ff" />
        <circle cx={-6} cy={-83} r={2.6} fill="#17233b" />
        <circle cx={6} cy={-83} r={2.6} fill="#17233b" />
        <path d="M-5 -77 L5 -77 L0 -70 Z" fill="#ff9f43" />
        <rect x={-19} y={-68} width={38} height={7} rx={3.5} fill={scarf} />
      </g>
      <text y={-size * 0.34} textAnchor="middle" fontSize={15} fontWeight={800} fill="#22314f">
        {value}
      </text>
    </>
  )
}

interface Props {
  values: number[]
  target: 'asc' | 'desc'
  events: TraceEvent[]
  /** Evenements de l'etape en cours : qui regarde-t-on ? */
  last: TraceEvent[]
  ms: number
  outcome: 'win' | 'lose' | null
}

/** La banquise : chaque pingouin est une case du tableau, sa taille est la valeur. */
export function PenguinScene({ values, target, events, last, ms, outcome }: Props) {
  const { array, place, home } = foldPenguins(values, events)
  const slot = (WIDTH - 60) / values.length
  const x = (i: number) => 30 + slot * (i + 0.5)
  const [min, max] = [Math.min(...values), Math.max(...values)]
  // Sur un long rang, les pingouins restent assez fins pour ne pas se chevaucher
  const tallest = Math.min(196, slot * 1.9)
  const size = (v: number) => tallest * 0.43 + ((v - min) / Math.max(max - min, 1)) * tallest * 0.57
  const looked = new Set(last.flatMap((e) => (e.t === 'get' ? [e.i] : [])))
  const done = outcome === 'win' || (events.length > 0 && !outcome && isSorted(array, target) && !place.includes(null))
  // Les pingouins sortis du rang passent devant
  const order = values.map((_, id) => id).sort((a, b) => Number(place[a] === null) - Number(place[b] === null))

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="Banquise" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="ice-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1d3f" />
          <stop offset="0.7" stopColor="#1c4e7c" />
          <stop offset="1" stopColor="#4d9cc4" />
        </linearGradient>
        <linearGradient id="ice-aurora" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#57e0a6" stopOpacity="0" />
          <stop offset="0.5" stopColor="#57e0a6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#b48cff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ice-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f6ff" />
          <stop offset="1" stopColor="#a9d8f2" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#ice-sky)" />
      <path className="game-sway" d="M0 60 Q160 10 320 56 T640 40 L640 96 Q470 62 320 104 T0 112 Z" fill="url(#ice-aurora)" />
      <circle cx={566} cy={48} r={20} fill="#fff6d8" opacity={0.92} />
      {[
        [60, 34],
        [150, 62],
        [250, 26],
        [410, 44],
        [495, 22],
        [610, 92],
      ].map(([cx, cy]) => (
        <circle key={cx} cx={cx} cy={cy} r={1.5} fill="#fff" opacity={0.8} />
      ))}
      <path d="M0 196 L70 150 L120 186 L190 138 L250 196 Z" fill="#cfeaf8" opacity={0.65} />
      <path d="M390 196 L470 146 L530 182 L585 152 L640 196 Z" fill="#cfeaf8" opacity={0.65} />
      <path d="M0 196 H640 V330 H0 Z" fill="url(#ice-floor)" />

      {values.map((_, i) => (
        <g key={i}>
          <ellipse cx={x(i)} cy={ROW + 2} rx={Math.min(40, slot * 0.42)} ry={8} fill="#7fbfe0" opacity={0.55} />
          <text x={x(i)} y={ROW + 22} textAnchor="middle" fontSize={12} fontWeight={700} fill="#3f7fa6">
            T[{i}]
          </text>
        </g>
      ))}

      {order.map((id) => {
        const inRow = place[id] !== null
        const at = place[id] ?? home[id]
        const style: CSSProperties = {
          transform: `translate(${x(at)}px, ${inRow ? ROW : OUT_ROW}px)`,
          transition: `transform ${Math.round(ms * 0.8)}ms cubic-bezier(.3,1.3,.5,1)`,
        }
        return (
          <g key={id} style={style}>
            <g
              className={cn(done && 'game-hop')}
              style={{ '--hop-delay': `${(place[id] ?? 0) * 90}ms` } as CSSProperties}
            >
              <Penguin
                size={size(values[id])}
                value={values[id]}
                scarf={SCARVES[id % SCARVES.length]}
                looking={inRow && looked.has(at)}
              />
            </g>
            {!inRow && (
              <text y={-size(values[id]) - 8} textAnchor="middle" fontSize={15} fontWeight={800} fill="#ffe27a" stroke="#17233b" strokeWidth={3} paintOrder="stroke">
                aux
              </text>
            )}
          </g>
        )
      })}

      <g transform="translate(320 24)">
        <rect x={-122} y={-15} width={244} height={28} rx={14} fill="#0b1d3f" opacity={0.72} />
        <text textAnchor="middle" y={5} fontSize={14} fontWeight={700} fill="#fff">
          {target === 'desc' ? 'Twil  →  Sghir' : 'Sghir  →  Twil'}
        </text>
      </g>
    </svg>
  )
}
