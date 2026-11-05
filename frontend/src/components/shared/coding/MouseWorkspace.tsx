import { Play, RotateCcw, Square } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { sfx } from '@/core/game/sound'
import { cn } from '@/core/lib/utils'
import type { GridRun } from '@/core/python/engine'
import { GRID_COMMANDS, GRID_SENSORS } from '@/core/python/grid'
import { PythonTimeoutError, python } from '@/core/python/runner'
import { BitouSays, explainError, GRID_MESSAGES, TIMEOUT_MESSAGE } from './bitou'
import { CodeEditor, type CodeEditorHandle } from './CodeEditor'
import { GridBoard } from './GridBoard'
import type { GridData } from './types'

const SPEEDS = { slow: 650, normal: 380, fast: 160 } as const

interface Props {
  code: string
  onCodeChange: (code: string) => void
  data: GridData
  /** Fin d'une execution : reussie ou non (enregistree comme essai). */
  onFinished: (success: boolean) => void
  onReset: () => void
  toolbar?: ReactNode
}

/** Mission souris : le code est execute, puis rejoue pas a pas sur le jardin. */
export function MouseWorkspace({ code, onCodeChange, data, onFinished, onReset, toolbar }: Props) {
  const { t } = useTranslation()
  const editor = useRef<CodeEditorHandle>(null)
  const [worldIndex, setWorldIndex] = useState(0)
  const [run, setRun] = useState<GridRun | null>(null)
  const [runId, setRunId] = useState(0)
  const [frameIndex, setFrameIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(null)
  const [speed, setSpeed] = useState<keyof typeof SPEEDS>('normal')
  const finished = useRef<(() => void) | null>(null)

  const frames = run?.worlds[worldIndex]?.frames ?? []
  const frame = run ? (frames[frameIndex] ?? null) : null

  // Animation : une etape toutes les SPEEDS[speed] ms, puis le message de Bitou
  useEffect(() => {
    if (!playing) return
    if (frameIndex >= frames.length - 1) {
      setPlaying(false)
      finished.current?.()
      finished.current = null
      return
    }
    const timer = window.setTimeout(() => setFrameIndex((i) => i + 1), SPEEDS[speed])
    return () => window.clearTimeout(timer)
  }, [playing, frameIndex, frames.length, speed])

  // Un son par etape
  useEffect(() => {
    if (!playing || !frame || frameIndex === 0) return
    const before = frames[frameIndex - 1]
    if (frame.event === 'pick') sfx('pick')
    else if (frame.event === 'bump' || frame.event === 'nothing' || frame.event === 'limit') sfx('bump')
    else if (frame.event === 'cat') sfx('cat')
    else if (before.dir !== frame.dir) sfx('turn')
    else sfx('step')
    // Seul le changement d'etape declenche un son
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameIndex, runId])

  const launch = async () => {
    sfx('click')
    setBusy(true)
    setMessage(null)
    try {
      const result = await python.runGrid(code, data.worlds)
      // On rejoue la premiere grille ratee (ou la premiere si tout est reussi)
      const shown = Math.max(
        0,
        result.worlds.findIndex((w) => w.outcome !== 'success'),
      )
      setRun(result)
      setRunId((n) => n + 1)
      setWorldIndex(shown)
      setFrameIndex(0)
      setPlaying(true)
      finished.current = () => {
        const outcome = result.worlds[shown].outcome
        if (result.error) {
          sfx('bump')
          setMessage({
            tone: 'error',
            text: `${explainError(result.error)}\n${result.error.type} : ${result.error.message}`,
          })
        } else if (result.success) {
          setMessage({ tone: 'success', text: GRID_MESSAGES.success })
        } else {
          if (outcome === 'not-home' || outcome === 'cheese-left') sfx('lock')
          const other = data.worlds.length > 1 ? `\n(${t('coding.world', { n: shown + 1 })})` : ''
          setMessage({ tone: 'error', text: GRID_MESSAGES[outcome] + other })
        }
        onFinished(result.success)
      }
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof PythonTimeoutError ? TIMEOUT_MESSAGE : (error as Error).message,
      })
      onFinished(false)
    } finally {
      setBusy(false)
    }
  }

  const stop = () => {
    setPlaying(false)
    setFrameIndex(frames.length - 1)
    finished.current?.()
    finished.current = null
  }

  const showWorld = (index: number) => {
    sfx('click')
    setWorldIndex(index)
    setRun(null)
    setMessage(null)
  }

  const chips = (entries: Record<string, string>, tone: string) =>
    Object.keys(entries).map((name) => (
      <button
        key={name}
        type="button"
        onClick={() => {
          sfx('click')
          editor.current?.insert(`${name}()`)
        }}
        className={cn('rounded-lg border px-2 py-1 font-mono text-xs transition-transform hover:-translate-y-0.5', tone)}
      >
        {name}()
      </button>
    ))

  return (
    <div className="grid flex-1 gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap gap-1.5" dir="ltr">
          {chips(GRID_COMMANDS, 'border-primary/40 bg-primary-soft text-primary')}
          {chips(GRID_SENSORS, 'border-border bg-muted text-muted-foreground')}
        </div>
        <CodeEditor
          handle={editor}
          game
          value={code}
          onChange={onCodeChange}
          runLine={playing ? (frame?.line ?? null) : null}
          errorLine={run?.error?.line ?? null}
          className="min-h-72 flex-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          {playing ? (
            <Button size="lg" variant="outline" onClick={stop}>
              <Square />
              {t('coding.stop')}
            </Button>
          ) : (
            <Button size="lg" className="game-cta" onClick={launch} loading={busy}>
              <Play />
              {t('coding.run')}
            </Button>
          )}
          <Button variant="ghost" onClick={onReset}>
            <RotateCcw />
            {t('coding.reset')}
          </Button>
          {toolbar}
          <label className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
            {t('coding.speed')}
            <Select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as keyof typeof SPEEDS)}
              className="h-9 w-20"
            >
              <option value="slow">🐢</option>
              <option value="normal">🐭</option>
              <option value="fast">⚡</option>
            </Select>
          </label>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {data.worlds.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {data.worlds.map((_, i) => {
              const outcome = run?.worlds[i]?.outcome
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => showWorld(i)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold',
                    i === worldIndex ? 'border-primary bg-primary-soft text-primary' : 'border-border',
                    outcome === 'success' && 'border-success text-success',
                    outcome && outcome !== 'success' && 'border-danger text-danger',
                  )}
                >
                  {outcome === 'success' ? '✓ ' : outcome ? '✗ ' : ''}
                  {t('coding.world', { n: i + 1 })}
                </button>
              )
            })}
          </div>
        )}
        <div className="game-panel flex items-center justify-center p-3">
          <GridBoard
            key={`${worldIndex}-${runId}`}
            world={data.worlds[worldIndex]}
            frame={frame}
            step={frameIndex}
            stepMs={SPEEDS[speed]}
            moving={playing}
          />
        </div>
        {message && (
          <BitouSays tone={message.tone} className="game-rise">
            {message.text}
          </BitouSays>
        )}
        {run?.stdout && (
          <pre dir="ltr" className="max-h-32 overflow-auto rounded-xl bg-muted p-3 text-xs">
            {run.stdout}
          </pre>
        )}
      </div>
    </div>
  )
}
