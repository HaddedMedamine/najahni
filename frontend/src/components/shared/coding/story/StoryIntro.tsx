import { Clapperboard, Eye, EyeOff, FastForward, PencilLine, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { sfx } from '@/core/game/sound'
import { cn } from '@/core/lib/utils'
import { BitouSays } from '../bitou'
import { CodeEditor } from '../CodeEditor'
import { TdoEditor } from '../TdoEditor'
import type { CodeLanguage, StoryData } from '../types'
import { StoryScene } from './StoryScene'
import { useTracePlayer } from './useTracePlayer'

type Story = StoryData['story']

/** Le temps de lire la phrase, avant l'etape suivante. */
const readingTime = (text: string) => Math.max(1800, text.length * 45)

/** Petite video : Bitou parle pendant que la scene se joue, puis le principe et le depart. */
export function StoryIntro({
  label,
  title,
  statement,
  story,
  onStart,
}: {
  label: string
  title: string
  statement: string
  story: Story
  onStart: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const player = useTracePlayer()
  const { play, reset } = player
  const finished = step >= story.intro.length
  // Les etapes s'enchainent sur la meme scene
  const previous = useMemo(() => story.intro.slice(0, step).flatMap((s) => s.events), [story, step])

  useEffect(() => {
    if (finished) return
    const current = story.intro[step]
    let timer: number | undefined
    play(current.events, () => {
      timer = window.setTimeout(() => setStep((n) => n + 1), current.events.length ? 1100 : readingTime(current.say))
    })
    return () => window.clearTimeout(timer)
  }, [story, step, finished, play])

  const events = useMemo(
    () => (finished ? previous : [...previous, ...player.events]),
    [finished, previous, player.events],
  )

  const replay = () => {
    sfx('click')
    reset()
    setStep(0)
  }

  const skip = () => {
    sfx('click')
    reset()
    setStep(story.intro.length)
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[color-mix(in_srgb,var(--background)_80%,transparent)] p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="game-panel game-rise flex w-full max-w-3xl flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="text-sm font-semibold text-primary">{label}</p>
          <h2 className="game-title text-2xl sm:text-3xl">{title}</h2>
        </div>

        <div className={cn('overflow-hidden rounded-2xl border border-border', finished && 'mx-auto w-full sm:w-3/5')}>
          <StoryScene stage={story.stage} events={events} last={finished ? [] : player.last} ms={player.ms} outcome={null} />
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-sm font-medium" dir="ltr">
          <Target className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            <span className="font-bold text-primary">{t('coding.objective')} : </span>
            {story.objective}
          </span>
        </p>

        {finished ? (
          <>
            <div className="game-rise rounded-xl bg-muted p-3" dir="ltr">
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-primary uppercase">{t('coding.principle')}</p>
              <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm">
                {story.principle.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </div>
            <div className="rounded-xl bg-muted p-3" dir="ltr">
              <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">{t('coding.statement')}</p>
              <p className="text-sm leading-relaxed whitespace-pre-line">{statement}</p>
            </div>
            {story.solved && showSolution && <SolutionDetails solved={story.solved} language="ALGO" />}
            {/* Toujours visible, meme quand le contenu depasse l'ecran */}
            <div className="sticky -bottom-3 z-10 -mx-1 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-card p-2 sm:-bottom-4">
              <Button variant="ghost" onClick={replay}>
                <Clapperboard />
                {t('coding.storyReplay')}
              </Button>
              {story.solved && (
                <SolutionToggle open={showSolution} onToggle={() => setShowSolution((v) => !v)} />
              )}
              <Button
                size="lg"
                className="game-cta px-10 text-base"
                onClick={() => {
                  sfx('click')
                  onStart()
                }}
              >
                <PencilLine />
                {t('coding.storyWrite')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <BitouSays key={step} className="game-rise">
              {story.intro[step].say}
            </BitouSays>
            <Button variant="ghost" size="sm" className="self-end" onClick={skip}>
              <FastForward />
              {t('coding.storySkip')}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function SolutionToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useTranslation()
  return (
    <Button
      variant="outline"
      onClick={() => {
        sfx('click')
        onToggle()
      }}
    >
      {open ? <EyeOff /> : <Eye />}
      {open ? t('coding.storyHideSolution') : t('coding.storySeeSolution')}
    </Button>
  )
}

interface SolutionProps {
  solved: NonNullable<Story['solved']>
  language: CodeLanguage
}

/** Le corrige d'une mission resolue, hors de l'editeur de l'eleve. */
function SolutionDetails({ solved, language }: SolutionProps) {
  const { t } = useTranslation()
  const algo = language === 'ALGO'
  return (
    <div className="game-panel game-rise flex flex-col gap-3 p-3" dir="ltr">
      <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t('coding.solvedTitle')}</p>
      <CodeEditor key={language} game readOnly language={algo ? 'algo' : 'python'} value={algo ? solved.algo : solved.python} />
      {algo && (
        <>
          <TdoEditor rows={solved.tdo} onChange={() => {}} readOnly />
          <dl className="flex flex-col gap-2 text-sm">
            {solved.notes.map((note) => (
              <div key={note.code}>
                <dt className="font-mono text-xs font-semibold text-primary">{note.code}</dt>
                <dd className="text-muted-foreground">{note.why}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </div>
  )
}

/** Dans la mission : le corrige reste ferme tant que l'eleve ne le demande pas. */
export function SolutionPanel(props: SolutionProps) {
  const [open, setOpen] = useState(false)
  return (
    <section className="flex flex-col gap-3">
      <div className="self-center">
        <SolutionToggle open={open} onToggle={() => setOpen((v) => !v)} />
      </div>
      {open && <SolutionDetails {...props} />}
    </section>
  )
}
