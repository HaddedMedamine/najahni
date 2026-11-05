import { useMemo, useState } from 'react'
import { cn } from '@/core/lib/utils'
import { type Direction, type GridFrame, type GridWorld, parseWorld } from '@/core/python/grid'

const CELL = 48
const ANGLE: Record<Direction, number> = { E: 0, S: 90, W: 180, N: 270 }

interface Props {
  world: GridWorld
  /** Etat a afficher (null = depart). */
  frame: GridFrame | null
  /** Numero de l'etape : relance les effets (+1, choc). */
  step?: number
  /** Duree d'une etape d'animation, en ms. */
  stepMs?: number
  moving?: boolean
  className?: string
}

/** Le jardin de la souris, dessine en SVG (la souris glisse d'une case a l'autre). */
export function GridBoard({ world, frame, step = 0, stepMs = 350, moving, className }: Props) {
  const parsed = useMemo(() => parseWorld(world), [world])
  const state = frame ?? { ...parsed.start, picked: [], line: null }

  // Rotation cumulee : la souris tourne toujours par le chemin le plus court
  const [angle, setAngle] = useState(ANGLE[state.dir])
  const [shownDir, setShownDir] = useState(state.dir)
  if (state.dir !== shownDir) {
    const delta = ((ANGLE[state.dir] - ANGLE[shownDir] + 540) % 360) - 180
    setShownDir(state.dir)
    setAngle((a) => a + delta)
  }

  const event = frame?.event
  const tiles = []
  for (let y = 0; y < parsed.height; y++) {
    for (let x = 0; x < parsed.width; x++) {
      tiles.push(
        parsed.walls.has(`${x},${y}`) ? (
          <Hedge key={`${x},${y}`} x={x * CELL} y={y * CELL} seed={x * 7 + y * 3} />
        ) : (
          <rect
            key={`${x},${y}`}
            x={x * CELL + 1}
            y={y * CELL + 1}
            width={CELL - 2}
            height={CELL - 2}
            rx={7}
            fill={(x + y) % 2 ? '#3a7d5c' : '#357352'}
          />
        ),
      )
    }
  }

  return (
    <svg
      viewBox={`0 0 ${parsed.width * CELL} ${parsed.height * CELL}`}
      className={cn('h-auto max-h-[56vh] w-full select-none', className)}
      role="img"
    >
      {tiles}

      <g transform={`translate(${parsed.house.x * CELL}, ${parsed.house.y * CELL})`}>
        <House glow={event === 'home'} />
      </g>

      {parsed.cheeses.map((c, i) => (
        <g key={i} transform={`translate(${c.x * CELL}, ${c.y * CELL})`}>
          <g className={cn('transition-opacity duration-300', state.picked.includes(i) && 'opacity-0')}>
            <g className="game-bob">
              <Cheese />
            </g>
          </g>
        </g>
      ))}

      {[...parsed.cats].map((k) => {
        const [x, y] = k.split(',').map(Number)
        return (
          <g key={k} transform={`translate(${x * CELL}, ${y * CELL})`}>
            <Cat angry={event === 'cat' && state.x === x && state.y === y} />
          </g>
        )
      })}

      <g
        style={{
          transform: `translate(${state.x * CELL}px, ${state.y * CELL}px)`,
          transition: `transform ${stepMs * 0.85}ms ease-in-out`,
        }}
      >
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CELL / 2}px ${CELL / 2}px`,
            transition: `transform ${stepMs * 0.6}ms ease-in-out`,
          }}
        >
          <g
            className={cn(
              moving && 'game-walk',
              (event === 'bump' || event === 'nothing') && 'animate-[coder-shake_0.35s_ease-in-out_2]',
            )}
          >
            <Mouse />
          </g>
        </g>
        {/* Petits effets au-dessus de la souris, relances a chaque etape */}
        {event && (
          <text
            key={step}
            x={CELL / 2}
            y={8}
            textAnchor="middle"
            className="game-floatup text-[17px] font-extrabold"
            fill={event === 'pick' || event === 'home' ? '#ffc857' : '#ff7b7b'}
          >
            {{ pick: '+1', home: '♥', bump: '!', cat: '!!', nothing: '?', limit: '…' }[event]}
          </text>
        )}
      </g>
    </svg>
  )
}

/** Haie : le mur du jardin. */
function Hedge({ x, y, seed }: { x: number; y: number; seed: number }) {
  const r = (n: number) => 7 + ((seed * n) % 4)
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={1} y={1} width={CELL - 2} height={CELL - 2} rx={9} fill="#123a33" />
      <circle cx={14} cy={15} r={r(3)} fill="#1b5045" />
      <circle cx={33} cy={13} r={r(5)} fill="#1f5c4e" />
      <circle cx={24} cy={30} r={r(7) + 2} fill="#1b5045" />
      <circle cx={38} cy={35} r={r(2)} fill="#1f5c4e" />
      <circle cx={11} cy={36} r={r(4)} fill="#17463c" />
    </g>
  )
}

/** Souris vue de dessus, tournee vers la droite (Est). */
function Mouse() {
  return (
    <g>
      <path d="M10 24 C 4 24, 4 34, 9 36" fill="none" stroke="#e9a9b8" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={24} cy={24} rx={13} ry={9.5} fill="#d5dce6" />
      <circle cx={30} cy={15.5} r={5} fill="#d5dce6" />
      <circle cx={30} cy={32.5} r={5} fill="#d5dce6" />
      <circle cx={30} cy={15.5} r={2.8} fill="#f2b8c6" />
      <circle cx={30} cy={32.5} r={2.8} fill="#f2b8c6" />
      <path d="M34 18 L 42 24 L 34 30 Z" fill="#d5dce6" />
      <circle cx={42} cy={24} r={2} fill="#e5579a" />
      <circle cx={34.5} cy={21} r={1.6} fill="#1e2230" />
      <circle cx={34.5} cy={27} r={1.6} fill="#1e2230" />
    </g>
  )
}

function House({ glow }: { glow: boolean }) {
  return (
    <g>
      <circle cx={24} cy={26} r={22} fill="#ffc857" opacity={glow ? 0.45 : 0.14} />
      <path d="M9 23 L 24 10 L 39 23 Z" fill="#e5579a" />
      <rect x={13} y={22} width={22} height={17} rx={2} fill="#f6d7a7" />
      <rect x={21} y={29} width={6} height={10} rx={3} fill="#9b6a3c" />
      <rect x={15.5} y={25} width={4} height={4} rx={1} fill="#ffc857" />
      <rect x={28.5} y={25} width={4} height={4} rx={1} fill="#ffc857" />
    </g>
  )
}

function Cheese() {
  return (
    <g>
      <ellipse cx={24} cy={35} rx={13} ry={3} fill="#000" opacity={0.2} />
      <path d="M11 32 L 37 32 L 37 22 L 15 16 Z" fill="#ffd25e" stroke="#e0a800" strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={22} cy={26} r={2.2} fill="#e0a800" />
      <circle cx={31} cy={28} r={1.6} fill="#e0a800" />
      <circle cx={30} cy={23.5} r={1.2} fill="#e0a800" />
    </g>
  )
}

function Cat({ angry }: { angry: boolean }) {
  return (
    <g className="game-sway">
      {angry && <circle cx={24} cy={24} r={23} fill="#ff7b7b" opacity={0.4} />}
      <path d="M12 20 L 14 8 L 21 15 Z" fill="#f0845a" />
      <path d="M36 20 L 34 8 L 27 15 Z" fill="#f0845a" />
      <circle cx={24} cy={25} r={13} fill="#f0845a" />
      <ellipse cx={19} cy={23} rx={2.2} ry={3} fill="#1e2230" />
      <ellipse cx={29} cy={23} rx={2.2} ry={3} fill="#1e2230" />
      <path d="M22 29 L 24 31 L 26 29" fill="none" stroke="#1e2230" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M8 27 L 16 28 M8 31 L 16 30 M40 27 L 32 28 M40 31 L 32 30" stroke="#7a2e1d" strokeWidth={1.2} strokeLinecap="round" />
    </g>
  )
}
