import { cn } from '@/core/lib/utils'

export type SceneState = 'idle' | 'locked' | 'open'

interface Props {
  scene: 'door' | 'chest'
  state: SceneState
  className?: string
}

// Pierres du mur du temple : colonne, ligne, largeur
const STONES = Array.from({ length: 40 }, (_, i) => {
  const row = Math.floor(i / 8)
  return { x: (i % 8) * 46 - (row % 2) * 23, y: row * 26 }
})

/**
 * La salle du temple : la souris devant une porte (ou un coffre) fermee a code.
 * open : la lumiere passe, la souris entre / le coffre montre la cle.
 * locked : le cadenas tremble (programme faux).
 */
export function DoorScene({ scene, state, className }: Props) {
  const open = state === 'open'
  const locked = state === 'locked'
  return (
    <svg viewBox="0 0 360 150" className={cn('h-auto w-full select-none', className)} role="img" aria-hidden>
      <defs>
        <radialGradient id="torch-light">
          <stop offset="0" stopColor="#ffb347" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffb347" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="door-ray" x1="0" x2="1">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffe9a8" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* mur de pierres et sol */}
      <rect width={360} height={150} rx={14} fill="#1c1533" />
      {STONES.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={44} height={24} rx={3} fill={i % 3 ? '#2a2049' : '#30254f'} />
      ))}
      <rect y={124} width={360} height={26} fill="#3a2e5e" />
      <rect y={124} width={360} height={3} fill="#51427c" />

      <Torch x={66} />
      <Torch x={294} />

      {scene === 'door' ? <Door open={open} locked={locked} /> : <Chest open={open} locked={locked} />}

      {/* la souris entre quand la porte s'ouvre */}
      <g
        style={{
          transform: `translate(${open ? (scene === 'door' ? 196 : 120) : 34}px, 84px)`,
          transition: open ? 'transform 1.3s ease-in-out 0.55s' : 'transform 0.3s',
        }}
      >
        <g className={cn(open && 'game-walk')}>
          <Mouse />
        </g>
      </g>
    </svg>
  )
}

function Torch({ x }: { x: number }) {
  return (
    <g transform={`translate(${x}, 42)`}>
      <circle cx={0} cy={2} r={46} fill="url(#torch-light)" />
      <rect x={-3} y={10} width={6} height={22} rx={2} fill="#6d4a2a" />
      <path className="game-flame" d="M0 -12 C 9 0, 8 11, 0 13 C -8 11, -9 0, 0 -12 Z" fill="#ffb347" />
      <path className="game-flame" d="M0 -3 C 4 3, 4 9, 0 11 C -4 9, -4 3, 0 -3 Z" fill="#ffe9a8" />
    </g>
  )
}

/** Souris de profil, tournee vers la droite. */
function Mouse() {
  return (
    <g>
      <path d="M6 30 C -4 30, -4 20, 2 16" fill="none" stroke="#e9a9b8" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={22} cy={28} rx={16} ry={11} fill="#d5dce6" />
      <circle cx={30} cy={15} r={7} fill="#d5dce6" />
      <circle cx={30} cy={15} r={4} fill="#f2b8c6" />
      <path d="M34 20 Q 46 24 44 30 L 34 34 Z" fill="#d5dce6" />
      <circle cx={45} cy={29} r={2.2} fill="#e5579a" />
      <circle cx={38} cy={24} r={1.8} fill="#1e2230" />
      <path d="M14 38 v 4 M28 38 v 4" stroke="#aeb7c4" strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

function Lock({ open, locked, x, y }: { open: boolean; locked: boolean; x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`} className={cn('transition-opacity duration-300', open && 'opacity-0')}>
      <g className={cn(locked && 'animate-[coder-shake_0.35s_ease-in-out_2]')}>
        <path d="M5 10 V 6 a 6 6 0 0 1 12 0 V 10" fill="none" stroke="#e8c15a" strokeWidth={2.5} />
        <rect x={2} y={10} width={18} height={14} rx={3} fill={locked ? '#ff7b7b' : '#ffc857'} />
        <circle cx={11} cy={17} r={2} fill="#1e2230" />
      </g>
    </g>
  )
}

function Door({ open, locked }: { open: boolean; locked: boolean }) {
  return (
    <g>
      {/* arche */}
      <path d="M150 124 V 54 a 30 30 0 0 1 60 0 V 124 Z" fill="#514275" />
      <path d="M158 124 V 56 a 22 22 0 0 1 44 0 V 124 Z" fill={open ? '#ffe9a8' : '#0e0a1c'} className="transition-colors duration-500" />
      {open && <path d="M202 58 L 330 40 V 140 L 202 124 Z" fill="url(#door-ray)" className="game-rise" />}
      {/* battant : se replie vers la gauche en s'ouvrant */}
      <g
        style={{
          transform: open ? 'scaleX(0.1)' : 'scaleX(1)',
          transformOrigin: '158px 90px',
          transition: 'transform 0.6s ease-in-out',
        }}
      >
        <path d="M158 124 V 56 a 22 22 0 0 1 44 0 V 124 Z" fill="#8a5a33" />
        <path d="M172 124 V 36 M188 124 V 36" stroke="#6d4526" strokeWidth={2} />
        <path d="M158 70 H 202 M158 106 H 202" stroke="#b98a4a" strokeWidth={3} />
      </g>
      <Lock open={open} locked={locked} x={169} y={78} />
    </g>
  )
}

function Chest({ open, locked }: { open: boolean; locked: boolean }) {
  return (
    <g>
      {/* lumiere et cle qui sortent du coffre */}
      {open && <circle cx={248} cy={80} r={46} fill="url(#torch-light)" className="game-rise" />}
      <g
        style={{
          transform: open ? 'translate(0, -40px)' : 'translate(0, 0)',
          transition: 'transform 0.8s ease-out 0.4s',
        }}
        className={cn(!open && 'opacity-0')}
      >
        <circle cx={234} cy={92} r={7} fill="none" stroke="#ffc857" strokeWidth={3.5} />
        <path d="M241 92 H 262 M255 92 v 6 M262 92 v 5" stroke="#ffc857" strokeWidth={3.5} strokeLinecap="round" />
      </g>
      <rect x={210} y={92} width={76} height={32} rx={4} fill="#8a5a33" />
      <rect x={210} y={104} width={76} height={5} fill="#b98a4a" />
      <g
        style={{
          transform: open ? 'rotate(-32deg)' : 'rotate(0deg)',
          transformOrigin: '210px 92px',
          transition: 'transform 0.6s ease-in-out',
        }}
      >
        <path d="M210 92 V 82 a 10 10 0 0 1 10 -10 H 276 a 10 10 0 0 1 10 10 V 92 Z" fill="#a4703f" />
        <path d="M210 92 H 286" stroke="#ffc857" strokeWidth={2} />
      </g>
      <Lock open={open} locked={locked} x={237} y={94} />
    </g>
  )
}
