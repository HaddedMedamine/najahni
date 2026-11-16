import type { TraceEvent } from '@/core/python/engine'
import { foldShop } from './trace'

const WIDTH = 640
const HEIGHT = 330
const SHOWN = 5

interface Props {
  drawers: Record<string, string[]>
  events: TraceEvent[]
  last: TraceEvent[]
  ms: number
  outcome: 'win' | 'lose' | null
}

/** Les archives : chaque fichier de donnees est un tiroir, chaque objet une fiche. */
export function ArchiveScene({ drawers, events, last }: Props) {
  const state = foldShop(drawers, events)
  const event = last.at(-1)
  const moving = event?.t === 'write' || event?.t === 'read' ? event : null
  const width = Math.min(250, 560 / Math.max(state.bags.length, 1) - 16)
  const left = (i: number) => (WIDTH - state.bags.length * (width + 16)) / 2 + i * (width + 16) + 8

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="Archives" style={{ direction: 'ltr' }}>
      <rect width={WIDTH} height={HEIGHT} fill="#23304a" />
      <rect y={290} width={WIDTH} height={40} fill="#3a2a22" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={i * 170 - 20} y={14} width={150} height={24} rx={3} fill="#2e3f60" />
      ))}
      <circle cx={320} cy={22} r={9} fill="#ffe2a8" />
      <path d="M320 30 L240 290 H400 Z" fill="#ffe2a8" opacity={0.06} />

      {state.bags.map((drawer, i) => {
        const x = left(i)
        const open = drawer.mode !== null
        const stored = drawer.items.slice(drawer.pointer)
        const active = moving?.file === drawer.name
        return (
          <g key={drawer.name}>
            <rect x={x} y={56} width={width} height={234} rx={8} fill="#5b6b85" />
            <rect x={x + 8} y={64} width={width - 16} height={218} rx={5} fill="#44536c" />
            <g style={{ transform: open ? 'translateY(10px)' : 'none', transition: 'transform .25s' }}>
              <rect x={x + 14} y={74} width={width - 28} height={198} rx={6} fill={active ? '#2fa58f' : '#7a8ba8'} />
              <rect x={x + width / 2 - 34} y={84} width={68} height={22} rx={4} fill="#fdfaf1" />
              <text x={x + width / 2} y={99} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="#17233b">
                {drawer.name}
              </text>
              <text x={x + 26} y={127} fontSize={12} fontWeight={700} fill="#e9f6ff">
                {stored.length} fiche(s) {open ? `· ${drawer.mode}` : ''}
              </text>
              {stored.slice(-SHOWN).map((item, n) => (
                <g key={`${item}-${n}`} transform={`translate(${x + 26} ${136 + n * 26})`}>
                  <rect width={width - 52} height={22} rx={4} fill="#fdfaf1" />
                  <text x={8} y={16} fontSize={12.5} fontWeight={700} fill="#17233b">
                    {item}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )
      })}

      {state.table.length > 0 && (
        <g>
          <rect x={120} y={296} width={400} height={26} rx={6} fill="#6b4226" />
          <text x={320} y={314} textAnchor="middle" fontSize={13} fontWeight={700} fill="#ffe9c7">
            {state.table.slice(-6).join('  |  ')}
          </text>
        </g>
      )}
      {state.alert && (
        <g transform="translate(590 60)">
          <g className="game-pop">
            <circle r={22} fill="#ffc857" stroke="#1b1405" strokeWidth={2.5} />
            <text textAnchor="middle" y={12} fontSize={32} fontWeight={900} fill="#1b1405">
              !
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
