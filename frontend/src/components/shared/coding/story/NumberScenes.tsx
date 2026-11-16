import type { CSSProperties } from 'react'
import { cn } from '@/core/lib/utils'
import type { TraceEvent } from '@/core/python/engine'
import { foldCalls, foldStairs, foldVars } from './trace'

const WIDTH = 640
const HEIGHT = 330

interface Play {
  events: TraceEvent[]
  last: TraceEvent[]
  ms: number
  outcome: 'win' | 'lose' | null
}

const Frame = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label={label} style={{ direction: 'ltr' }}>
    {children}
  </svg>
)

const COLORS = ['#e5484d', '#e8913a', '#d9b43a', '#2fa58f', '#3f7fa6', '#8b5fbf', '#e5579a']

/** Recursivite : chaque appel ouvre une poupee, plus petite ; le retour la referme. */
export function DollScene({ events }: Play) {
  const { dolls, depth } = foldCalls(events)
  const shown = dolls.slice(-7)
  const offset = dolls.length - shown.length
  const slot = 590 / Math.max(shown.length, 4)
  return (
    <Frame label="Poupées">
      <rect width={WIDTH} height={HEIGHT} fill="#3a2140" />
      <rect y={262} width={WIDTH} height={68} fill="#5b3a2e" />
      <rect y={262} width={WIDTH} height={6} fill="#7a4e38" />
      <text x={320} y={34} textAnchor="middle" fontSize={15} fontWeight={700} fill="#f5e6ff">
        Appels : {dolls.length} · en cours : {depth}
      </text>
      {shown.map((doll, i) => {
        const level = offset + i
        const size = Math.max(0.5, 1 - level * 0.07)
        const x = 25 + slot * (i + 0.5)
        const closed = doll.value !== undefined
        const color = COLORS[level % COLORS.length]
        return (
          <g key={`${level}-${doll.label}`} transform={`translate(${x} 262) scale(${size})`}>
           <g className="game-rise">
            <path d="M-46 0 Q-58 -66 -32 -96 H32 Q58 -66 46 0 Z" fill={color} />
            <g style={{ transform: closed ? 'none' : 'translateY(-24px)', transition: 'transform .3s' }}>
              <path d="M-32 -96 Q-34 -158 0 -160 Q34 -158 32 -96 Z" fill={color} />
              <circle cy={-124} r={21} fill="#f6d9b8" />
              <circle cx={-8} cy={-127} r={2.6} fill="#2b1b1b" />
              <circle cx={8} cy={-127} r={2.6} fill="#2b1b1b" />
              <path d={closed ? 'M-7 -116 Q0 -110 7 -116' : 'M-4 -116 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'} fill={closed ? 'none' : '#2b1b1b'} stroke="#2b1b1b" strokeWidth={2} />
            </g>
            {closed && (
              <g transform="translate(0 -46)">
                <circle r={25} fill="#fff6d8" />
                <text textAnchor="middle" y={7} fontSize={String(doll.value).length > 4 ? 13 : 19} fontWeight={900} fill="#3a2140">
                  {String(doll.value)}
                </text>
              </g>
            )}
           </g>
          </g>
        )
      })}
      {shown.map((doll, i) => (
        <text key={`${i}-label`} x={25 + slot * (i + 0.5)} y={292} textAnchor="middle" fontSize={shown.length > 5 ? 10.5 : 13} fontWeight={700} fill="#ffe9c7">
          {doll.label.length > 14 ? `${doll.label.slice(0, 13)}…` : doll.label}
        </text>
      ))}
    </Frame>
  )
}

/** Recurrence : chaque terme de la suite est une marche, calculee sur les precedentes. */
export function StairsScene({ length, events, outcome }: Play & { length: number }) {
  const { steps, current } = foldStairs(length, events)
  const known = steps.filter((s): s is number => s !== null)
  const [min, max] = [Math.min(0, ...known), Math.max(1, ...known)]
  const slot = 580 / length
  const height = (v: number) => 34 + ((v - min) / (max - min || 1)) * 190
  return (
    <Frame label="Marches">
      <rect width={WIDTH} height={HEIGHT} fill="#123a4a" />
      <circle cx={570} cy={52} r={24} fill="#ffe2a8" opacity={0.9} />
      <rect y={286} width={WIDTH} height={44} fill="#0d2a35" />
      {steps.map((value, i) => {
        const x = 30 + i * slot
        const h = value === null ? 8 : height(value)
        return (
          <g key={i}>
            <rect
              x={x + 2}
              y={286 - h}
              width={slot - 4}
              height={h}
              rx={4}
              fill={i === current ? '#ffc857' : value === null ? '#1d5163' : '#2fa58f'}
              style={{ transition: 'all .25s' }}
            />
            {value !== null && (
              <text x={x + slot / 2} y={278 - h} textAnchor="middle" fontSize={slot < 50 ? 11 : 14} fontWeight={800} fill="#fff">
                {value}
              </text>
            )}
            <text x={x + slot / 2} y={308} textAnchor="middle" fontSize={11} fontWeight={700} fill="#8fc7d6">
              U{i}
            </text>
          </g>
        )
      })}
      {current >= 0 && (
        <g style={{ transform: `translate(${30 + (current + 0.5) * slot}px, ${286 - height(steps[current] ?? 0) - 26}px)`, transition: 'transform .25s' }}>
          <g className={cn(outcome === 'win' && 'game-hop')}>
            <circle r={9} fill="#ff7bac" />
            <circle cx={-3} cy={-2} r={1.5} fill="#2b1b1b" />
            <circle cx={3} cy={-2} r={1.5} fill="#2b1b1b" />
          </g>
        </g>
      )}
    </Frame>
  )
}

/** Arithmetique : la machine affiche les variables du programme a chaque calcul. */
export function MachineScene({ vars, events, last }: Play & { vars: string[] }) {
  const values = foldVars(events)
  const active = last.at(-1)
  const changed = active?.t === 'var' ? active.k : null
  const width = Math.min(170, 560 / vars.length - 14)
  return (
    <Frame label="Machine">
      <rect width={WIDTH} height={HEIGHT} fill="#2a2f3a" />
      <rect x={30} y={36} width={580} height={250} rx={18} fill="#4a5568" />
      <rect x={46} y={52} width={548} height={218} rx={12} fill="#2f3a4a" />
      {[120, 320, 520].map((x, i) => (
        <g key={x} transform={`translate(${x} 36)`}>
          <circle r={18} fill="#8a96a8" />
          <g className="game-sway" style={{ '--sway-delay': `${i}s` } as CSSProperties}>
            <rect x={-3} y={-14} width={6} height={28} fill="#2a2f3a" />
            <rect x={-14} y={-3} width={28} height={6} fill="#2a2f3a" />
          </g>
        </g>
      ))}
      {vars.map((name, i) => {
        const x = (WIDTH - vars.length * (width + 14)) / 2 + i * (width + 14) + 7
        const history = values[name] ?? []
        const value = history.at(-1)
        const text = value === undefined ? '...' : String(value)
        return (
          <g key={name}>
            <rect x={x} y={78} width={width} height={92} rx={10} fill={changed === name ? '#ffc857' : '#101826'} style={{ transition: 'fill .15s' }} />
            <text x={x + width / 2} y={102} textAnchor="middle" fontSize={15} fontWeight={800} fill={changed === name ? '#1b1405' : '#7fd4ff'}>
              {name}
            </text>
            <text x={x + width / 2} y={146} textAnchor="middle" fontSize={text.length > 8 ? 17 : 30} fontWeight={900} fill={changed === name ? '#1b1405' : '#57e0a6'}>
              {text}
            </text>
            <text x={x + width / 2} y={200} textAnchor="middle" fontSize={12} fontWeight={700} fill="#aab6d6">
              {history.slice(-5, -1).join(' → ')}
            </text>
          </g>
        )
      })}
      <text x={320} y={250} textAnchor="middle" fontSize={13} fontWeight={700} fill="#aab6d6">
        Calculs : {events.filter((e) => e.t === 'var').length}
      </text>
    </Frame>
  )
}

/** Approximation : la fleche se rapproche de la valeur exacte, jusqu'a epsilon. */
export function TargetScene({
  variable,
  exact,
  min,
  max,
  events,
  outcome,
}: Play & { variable: string; exact: number; min: number; max: number }) {
  const history = (foldVars(events)[variable] ?? []).filter((v): v is number => typeof v === 'number')
  const scale = (v: number) => 50 + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 540
  const value = history.at(-1)
  return (
    <Frame label="Cible">
      <rect width={WIDTH} height={HEIGHT} fill="#1c3b2e" />
      <rect y={230} width={WIDTH} height={100} fill="#2f5a3f" />
      <line x1={50} y1={200} x2={590} y2={200} stroke="#e9f6ff" strokeWidth={3} />
      {[min, max].map((v) => (
        <text key={v} x={scale(v)} y={224} textAnchor="middle" fontSize={13} fontWeight={700} fill="#e9f6ff">
          {v}
        </text>
      ))}
      <g transform={`translate(${scale(exact)} 200)`}>
        <circle r={32} fill="#e5484d" opacity={0.25} />
        <circle r={20} fill="#fff" opacity={0.3} />
        <circle r={8} fill="#e5484d" />
      </g>
      {history.slice(-12, -1).map((v, i) => (
        <circle key={i} cx={scale(v)} cy={200} r={4} fill="#ffc857" opacity={0.2 + i * 0.06} />
      ))}
      {value !== undefined && (
        <g style={{ transform: `translate(${scale(value)}px, 200px)`, transition: 'transform .25s' }}>
          <g className={cn(outcome === 'win' && 'game-pop')}>
            <path d="M0 -6 L-10 -30 H-3 V-62 H3 V-30 H10 Z" fill="#ffc857" />
          </g>
        </g>
      )}
      <text x={320} y={40} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">
        {variable} = {value === undefined ? '...' : value.toFixed(6)}
      </text>
      <text x={320} y={66} textAnchor="middle" fontSize={13} fontWeight={700} fill="#cfe8d8">
        Essais : {history.length}
        {value !== undefined && ` · écart : ${Math.abs(value - exact).toExponential(1)}`}
      </text>
    </Frame>
  )
}
