import type { CSSProperties } from 'react'
import { cn } from '@/core/lib/utils'
import type { TraceEvent } from '@/core/python/engine'
import { type Bag, foldShop } from './trace'

const WIDTH = 640
const HEIGHT = 330
const TABLE_MAX = 7
const STALL: [number, number] = [150, 196]

const PRODUCTS: Record<string, string> = {
  pomme: '🍎',
  lait: '🥛',
  pain: '🍞',
  fromage: '🧀',
  thon: '🐟',
  harissa: '🌶️',
  tomate: '🍅',
  banane: '🍌',
  oeufs: '🥚',
}

const isSpoiled = (item: string) => item.startsWith('*')
const emoji = (item: string) => PRODUCTS[item.replace(/^\*/, '').trim().toLowerCase()] ?? '📦'
const spoiledStyle = (item: string): CSSProperties | undefined =>
  isSpoiled(item) ? { filter: 'grayscale(1) brightness(.7)' } : undefined

/** Position du sac n, et hauteur selon ce qu'il contient. */
const bagX = (index: number, count: number) => (count > 1 ? 470 + index * 104 : 510)
const bagHeight = (bag: Bag) => 74 + Math.min(bag.items.length - bag.pointer, 6) * 9

function BagView({ bag, x }: { bag: Bag; x: number }) {
  const left = bag.items.slice(bag.pointer)
  const h = bagHeight(bag)
  const open = bag.mode !== null
  const top = 262 - h
  return (
    <g style={{ transition: 'all .25s' }}>
      <ellipse cx={x} cy={264} rx={50} ry={7} fill="#000" opacity={0.25} />
      <path
        d={`M${x - 42} ${top + 10} Q${x - 50} 200 ${x - 44} 250 Q${x} 272 ${x + 44} 250 Q${x + 50} 200 ${x + 42} ${top + 10} Z`}
        fill="#c98f52"
        stroke="#8f5d2e"
        strokeWidth={2}
      />
      {left.slice(-4).map((item, i) => (
        <text key={`${item}-${i}`} x={x - 26 + (i % 2) * 28} y={top + 44 + Math.floor(i / 2) * 28} fontSize={23} style={spoiledStyle(item)}>
          {emoji(item)}
        </text>
      ))}
      {open ? (
        <ellipse cx={x} cy={top + 10} rx={42} ry={11} fill="#3b2412" stroke="#8f5d2e" strokeWidth={2} />
      ) : (
        <>
          <path d={`M${x - 42} ${top + 10} Q${x} ${top - 12} ${x + 42} ${top + 10} Q${x} ${top + 22} ${x - 42} ${top + 10} Z`} fill="#b47b43" />
          <rect x={x - 22} y={top + 3} width={44} height={8} rx={4} fill="#ff7b7b" />
        </>
      )}
      <rect x={x - 42} y={272} width={84} height={22} rx={8} fill="#1b1405" opacity={0.75} />
      <text x={x} y={287} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#ffe9c7">
        {bag.name}
      </text>
      <g transform={`translate(${x + 40} ${top + 2})`}>
        <circle r={13} fill="#ffc857" stroke="#1b1405" strokeWidth={1.5} />
        <text textAnchor="middle" y={5} fontSize={13} fontWeight={800} fill="#1b1405">
          {left.length}
        </text>
      </g>
      {open && (
        <g transform={`translate(${x - 40} ${top + 2})`}>
          <circle r={13} fill="#57e0a6" stroke="#1b1405" strokeWidth={1.5} />
          <text textAnchor="middle" y={5} fontSize={13} fontWeight={800} fill="#1b1405">
            {bag.mode}
          </text>
        </g>
      )}
    </g>
  )
}

interface Props {
  bags: Record<string, string[]>
  events: TraceEvent[]
  last: TraceEvent[]
  ms: number
  outcome: 'win' | 'lose' | null
}

/** Le marche : le sac est le fichier, chaque produit est une ligne. */
export function ShopScene({ bags, events, last, ms, outcome }: Props) {
  const state = foldShop(bags, events)
  const event = last.at(-1)
  const index = (name: string) => state.bags.findIndex((b) => b.name === name)
  const shown = state.table.slice(-TABLE_MAX)
  const tableX = (i: number) => 214 + i * 30
  const pulling = event?.t === 'read'

  // Le produit en vol : du marchand au sac, ou du sac a la table
  let flying: { item: string; from: [number, number]; to: [number, number] } | null = null
  if (event?.t === 'write' || event?.t === 'read') {
    const i = index(event.file)
    const bag = state.bags[i]
    const mouth: [number, number] = [bagX(i, state.bags.length), 262 - bagHeight(bag)]
    const item = event.text.split('\n').filter(Boolean).at(-1) ?? ''
    flying =
      event.t === 'write'
        ? { item, from: STALL, to: mouth }
        : { item, from: mouth, to: [tableX(Math.max(shown.length - 1, 0)), 286] }
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block w-full" role="img" aria-label="Marché" style={{ direction: 'ltr' }}>
      <defs>
        <linearGradient id="shop-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b1b4d" />
          <stop offset="0.65" stopColor="#c0564f" />
          <stop offset="1" stopColor="#f6b26b" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#shop-sky)" />
      <circle cx={420} cy={70} r={30} fill="#ffe2a8" opacity={0.9} />
      <path d="M0 180 V120 H60 V96 H120 V130 H210 V104 H290 V140 H380 V112 H470 V136 H560 V100 H640 V180 Z" fill="#40254f" opacity={0.75} />
      <path d="M0 40 Q160 76 320 40 T640 40" fill="none" stroke="#ffe9c7" strokeWidth={1.5} opacity={0.7} />
      {[60, 150, 240, 330, 420, 510, 600].map((cx, i) => (
        <path key={cx} d={`M${cx - 9} 50 L${cx + 9} 50 L${cx} 66 Z`} fill={['#ff7bac', '#ffc857', '#57e0a6', '#7fd4ff'][i % 4]} />
      ))}
      <rect y={262} width={WIDTH} height={68} fill="#6b4226" />
      <rect y={262} width={WIDTH} height={5} fill="#8f5d2e" />

      {/* Etal du marchand */}
      <g>
        <rect x={26} y={120} width={8} height={142} fill="#5b3a1e" />
        <rect x={172} y={120} width={8} height={142} fill="#5b3a1e" />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path
            key={i}
            d={`M${16 + i * 29} 92 h29 v30 q-14.5 14 -29 0 Z`}
            fill={i % 2 ? '#fff4e2' : '#e5484d'}
          />
        ))}
        <g transform="translate(103 182)">
          <circle cy={-44} r={17} fill="#e9b98b" />
          <path d="M-17 -48 Q0 -74 17 -48 Z" fill="#fff4e2" />
          <circle cx={-6} cy={-44} r={2} fill="#2b1b1b" />
          <circle cx={6} cy={-44} r={2} fill="#2b1b1b" />
          <path d="M-7 -36 Q0 -31 7 -36" fill="none" stroke="#2b1b1b" strokeWidth={2} strokeLinecap="round" />
          <path d="M-22 -24 Q0 -34 22 -24 V12 H-22 Z" fill="#3f7fa6" />
          <rect x={-13} y={-20} width={26} height={32} rx={3} fill="#fff4e2" />
        </g>
        <rect x={20} y={194} width={166} height={68} rx={4} fill="#8f5d2e" />
        <rect x={20} y={194} width={166} height={7} fill="#a8703a" />
        <text x={34} y={236} fontSize={23}>🍎</text>
        <text x={66} y={236} fontSize={23}>🥛</text>
        <text x={98} y={236} fontSize={23}>🍞</text>
        <text x={130} y={236} fontSize={23}>🧀</text>
      </g>

      {/* Le rajel */}
      <g transform="translate(330 256)">
       <g className={cn(outcome === 'win' && 'game-hop')}>
        <ellipse cy={6} rx={34} ry={7} fill="#000" opacity={0.25} />
        <rect x={-18} y={-44} width={14} height={46} rx={6} fill="#2d3a5c" />
        <rect x={4} y={-44} width={14} height={46} rx={6} fill="#2d3a5c" />
        <path d="M-24 -100 Q0 -112 24 -100 V-40 H-24 Z" fill="#2fa58f" />
        <rect
          x={18}
          y={-98}
          width={12}
          height={46}
          rx={6}
          fill="#2fa58f"
          style={{
            transformBox: 'fill-box',
            transformOrigin: 'top',
            transform: `rotate(${pulling ? -62 : -14}deg)`,
            transition: `transform ${Math.round(ms * 0.5)}ms`,
          }}
        />
        <rect x={-30} y={-98} width={12} height={46} rx={6} fill="#2fa58f" style={{ transformBox: 'fill-box', transformOrigin: 'top', transform: 'rotate(10deg)' }} />
        <circle cy={-124} r={21} fill="#e9b98b" />
        <path d="M-21 -128 Q-16 -150 4 -148 Q22 -146 21 -126 Q6 -136 -21 -128 Z" fill="#2b1b1b" />
        <circle cx={-7} cy={-124} r={2.4} fill="#2b1b1b" />
        <circle cx={8} cy={-124} r={2.4} fill="#2b1b1b" />
        <path d={state.alert ? 'M-5 -112 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0' : 'M-7 -114 Q0 -108 7 -114'} fill={state.alert ? '#2b1b1b' : 'none'} stroke="#2b1b1b" strokeWidth={2} strokeLinecap="round" />
        {state.alert && (
          <g transform="translate(0 -176)">
            <g className="game-pop">
              <circle r={21} fill="#ffc857" stroke="#1b1405" strokeWidth={2.5} />
              <text textAnchor="middle" y={11} fontSize={32} fontWeight={900} fill="#1b1405">
                !
              </text>
            </g>
          </g>
        )}
       </g>
      </g>

      {/* Table des produits sortis */}
      {state.table.length > 0 && (
        <g>
          <rect x={198} y={296} width={222} height={12} rx={4} fill="#a8703a" />
          {shown.map((item, i) => (
            <text key={`${state.table.length}-${i}`} x={tableX(i) - 11} y={294} fontSize={22} style={spoiledStyle(item)}>
              {emoji(item)}
            </text>
          ))}
        </g>
      )}

      {state.bags.map((bag, i) => (
        <BagView key={bag.name} bag={bag} x={bagX(i, state.bags.length)} />
      ))}

      {flying && (
        <text
          key={events.length}
          className="shop-fly"
          fontSize={28}
          textAnchor="middle"
          style={
            {
              '--fly-from': `translate(${flying.from[0]}px, ${flying.from[1]}px)`,
              '--fly-to': `translate(${flying.to[0]}px, ${flying.to[1]}px)`,
              '--fly-time': `${Math.round(ms * 0.9)}ms`,
              ...spoiledStyle(flying.item),
            } as CSSProperties
          }
        >
          {emoji(flying.item)}
        </text>
      )}
    </svg>
  )
}
