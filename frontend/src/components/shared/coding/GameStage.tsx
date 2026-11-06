import { ArrowLeft, Lightbulb, Star, Volume2, VolumeX } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { sfx, startMusic, stopMusic, toggleSound, useMuted } from '@/core/game/sound'
import { cn } from '@/core/lib/utils'
import { BitouSays } from './bitou'
import { Stars } from './Stars'
import type { CodeLevelKind } from './types'

/** Les deux jeux : URL, type de niveau, decor et musique. */
export const GAMES = {
  mouse: { kind: 'GRID', theme: 'garden' },
  doors: { kind: 'PYTHON', theme: 'temple' },
  bac: { kind: 'STORY', theme: 'quest' },
} as const satisfies Record<string, { kind: CodeLevelKind; theme: 'garden' | 'temple' | 'quest' }>

export type GameId = keyof typeof GAMES

// Lucioles / poussieres d'or : positions fixes, le mouvement vient du CSS
const SPARKS = [
  [6, 72, 3, 8, 0],
  [14, 30, 2, 11, 2],
  [24, 84, 4, 9, 4],
  [37, 18, 2, 12, 1],
  [48, 64, 3, 10, 3],
  [61, 26, 4, 8, 5],
  [72, 78, 2, 13, 2],
  [83, 40, 3, 9, 0],
  [92, 68, 4, 11, 4],
  [55, 90, 2, 10, 6],
]

/** Scene plein ecran d'un jeu : decor anime, musique, et le contenu par-dessus. */
export function GameStage({ game, children }: { game: GameId; children: ReactNode }) {
  const { theme } = GAMES[game]

  useEffect(() => {
    startMusic(theme)
    return stopMusic
  }, [theme])

  return (
    <div className="game-stage fixed inset-0 z-50 overflow-y-auto" data-theme={theme}>
      <div className="game-sky" aria-hidden>
        {SPARKS.map(([left, top, size, time, delay]) => (
          <span
            key={left}
            className="game-spark"
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                '--spark-time': `${time}s`,
                '--spark-delay': `-${delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative flex min-h-full flex-col">{children}</div>
    </div>
  )
}

export function SoundButton() {
  const { t } = useTranslation()
  const muted = useMuted()
  const Icon = muted ? VolumeX : Volume2
  return (
    <button
      type="button"
      onClick={toggleSound}
      className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
      aria-label={muted ? t('coding.soundOn') : t('coding.soundOff')}
      title={muted ? t('coding.soundOn') : t('coding.soundOff')}
    >
      <Icon className="size-5" />
    </button>
  )
}

/** Barre du haut d'un jeu. */
export function GameHud({
  backTo,
  backLabel,
  title,
  subtitle,
  children,
}: {
  backTo: string
  backLabel: string
  title: string
  subtitle?: string
  children?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-[color-mix(in_srgb,var(--background)_82%,transparent)] px-3 py-2.5 backdrop-blur sm:px-5">
      <Link
        to={backTo}
        onClick={() => sfx('click')}
        aria-label={backLabel}
        title={backLabel}
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card hover:border-primary"
      >
        <ArrowLeft className="size-5 rtl:rotate-180" />
      </Link>
      <div className="min-w-0 flex-1">
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        <h1 className="game-title truncate text-lg leading-tight sm:text-xl">{title}</h1>
      </div>
      {children}
      <SoundButton />
    </header>
  )
}

/** Texte qui s'ecrit tout seul ; un clic l'affiche en entier. */
function useTypewriter(text: string) {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    if (shown >= text.length) return
    const timer = window.setTimeout(() => setShown((n) => n + 2), 22)
    return () => window.clearTimeout(timer)
  }, [shown, text.length])
  return { typed: text.slice(0, shown), skip: () => setShown(text.length) }
}

/** Ecran de mission : Bitou presente, puis l'eleve lance la partie. */
export function MissionBriefing({
  label,
  title,
  statement,
  bitou,
  onStart,
}: {
  label: string
  title: string
  statement: string
  bitou: string
  onStart: () => void
}) {
  const { t } = useTranslation()
  const { typed, skip } = useTypewriter(bitou)
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--background)_78%,transparent)] p-4 backdrop-blur-sm">
      <div className="game-panel game-rise flex w-full max-w-xl flex-col gap-4 p-5 sm:p-7">
        <div>
          <p className="text-sm font-semibold text-primary">{label}</p>
          <h2 className="game-title text-3xl">{title}</h2>
        </div>
        <button type="button" onClick={skip} className="text-start" dir="ltr">
          <BitouSays>
            <span className="block min-h-16">{typed}</span>
          </BitouSays>
        </button>
        <div className="rounded-xl bg-muted p-4" dir="ltr">
          <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">{t('coding.statement')}</p>
          <p className="text-sm leading-relaxed whitespace-pre-line">{statement}</p>
        </div>
        <Button
          size="lg"
          className="game-cta self-center px-10 text-base"
          onClick={() => {
            sfx('click')
            onStart()
          }}
        >
          {t('coding.start')}
        </Button>
      </div>
    </div>
  )
}

/** Indices : un par un, Bitou les donne a la demande. */
export function HintsButton({ hints }: { hints: string[] }) {
  const { t } = useTranslation()
  const [shown, setShown] = useState(0)
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => {
          sfx('hint')
          setShown((n) => Math.max(n, 1))
          setOpen((v) => !v)
        }}
      >
        <Lightbulb className="text-warning" />
        <span className="hidden sm:inline">{t('coding.showHint')}</span>
      </Button>
      {open && (
        <div className="game-panel game-rise absolute end-0 top-12 z-30 flex w-80 max-w-[85vw] flex-col gap-2 p-3 shadow-2xl">
          {hints.slice(0, shown).map((hint, i) => (
            <BitouSays key={i}>{hint}</BitouSays>
          ))}
          {shown < hints.length && (
            <Button
              variant="ghost"
              size="sm"
              className="self-end"
              onClick={() => {
                sfx('hint')
                setShown((n) => n + 1)
              }}
            >
              {t('coding.nextHint')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

const CONFETTI_COLORS = ['#ffc857', '#57e0a6', '#ff7bac', '#7fd4ff', '#c9a7ff']

/** Ecran de victoire : confettis et etoiles une par une. */
export function VictoryOverlay({
  stars,
  title,
  message,
  nextLabel,
  onNext,
  onStay,
}: {
  stars: number
  title: string
  message: string
  nextLabel: string
  onNext: () => void
  onStay: () => void
}) {
  const { t } = useTranslation()
  const [lit, setLit] = useState(0)

  useEffect(() => {
    sfx('win')
    const timers = [1, 2, 3]
      .filter((n) => n <= stars)
      .map((n) =>
        window.setTimeout(() => {
          setLit(n)
          sfx('star')
        }, 500 + n * 380),
      )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [stars])

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center overflow-hidden bg-[color-mix(in_srgb,var(--background)_72%,transparent)] p-4 backdrop-blur-sm">
      <div aria-hidden>
        {Array.from({ length: 42 }, (_, i) => (
          <span
            key={i}
            className="game-confetti"
            style={
              {
                left: `${(i * 37) % 100}%`,
                background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                '--delay': `${(i % 9) * 0.13}s`,
                '--fall': `${2.2 + (i % 5) * 0.35}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="game-panel game-pop relative flex w-full max-w-md flex-col items-center gap-4 p-7 text-center">
        <h2 className="game-title text-3xl">{title}</h2>
        <div className="flex gap-2" aria-label={`${stars} / 3`}>
          {[1, 2, 3].map((n) => (
            <Star
              key={n}
              className={cn(
                'size-14',
                n <= lit ? 'game-pop fill-warning text-warning' : 'text-muted-foreground/40',
                n === 2 && '-translate-y-2',
              )}
            />
          ))}
        </div>
        <BitouSays tone="success" className="w-full text-start">
          {message}
        </BitouSays>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" size="lg" onClick={onStay}>
            {t('coding.improve')}
          </Button>
          <Button size="lg" className="game-cta" onClick={onNext}>
            {nextLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export { Stars }
