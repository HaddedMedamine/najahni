import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { sfx } from '@/core/game/sound'
import type { TraceEvent } from '@/core/python/engine'
import { stepEnds } from './trace'

const SOUNDS: Partial<Record<TraceEvent['t'], Parameters<typeof sfx>[0]>> = {
  get: 'step',
  set: 'hop',
  field: 'drop',
  look: 'step',
  mget: 'step',
  mset: 'hop',
  call: 'hop',
  ret: 'drop',
  var: 'step',
  open: 'open',
  write: 'drop',
  read: 'pick',
  eof: 'alert',
  close: 'turn',
}

/** Une animation dure ~16 s au plus, quelle que soit la longueur du programme. */
const stepDuration = (steps: number) => Math.min(560, Math.max(110, 16000 / Math.max(steps, 1)))

interface Run {
  events: TraceEvent[]
  ends: number[]
  ms: number
  onEnd?: () => void
}

/** Rejoue une trace etape par etape ; la scene se dessine a partir de `events`. */
export function useTracePlayer() {
  const [run, setRun] = useState<Run | null>(null)
  const [step, setStep] = useState(0)
  const ended = useRef(true)

  const finish = useCallback((current: Run | null) => {
    if (ended.current) return
    ended.current = true
    current?.onEnd?.()
  }, [])

  const play = useCallback((events: TraceEvent[], onEnd?: () => void, ms?: number) => {
    const ends = stepEnds(events)
    ended.current = false
    setStep(0)
    setRun({ events, ends, ms: ms ?? stepDuration(ends.length), onEnd })
  }, [])

  const reset = useCallback(() => {
    ended.current = true
    setRun(null)
    setStep(0)
  }, [])

  const total = run?.ends.length ?? 0
  useEffect(() => {
    if (!run || ended.current) return
    if (step >= total) {
      // Le dernier geste se termine avant la suite
      const timer = window.setTimeout(() => finish(run), run.ms)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => setStep((n) => n + 1), run.ms)
    return () => window.clearTimeout(timer)
  }, [run, step, total, finish])

  const applied = run && step > 0 ? run.ends[step - 1] : 0
  const before = run && step > 1 ? run.ends[step - 2] : 0
  const last = useMemo(() => run?.events.slice(before, applied) ?? [], [run, before, applied])

  // Un son par etape
  useEffect(() => {
    const event = last.at(-1)
    const name = event && SOUNDS[event.t]
    if (name) sfx(name)
  }, [last])

  return {
    play,
    reset,
    /** Passe a la fin de l'animation. */
    skip: () => {
      setStep(total)
      finish(run)
    },
    /** Evenements deja joues, et ceux de l'etape en cours. */
    events: useMemo(() => run?.events.slice(0, applied) ?? [], [run, applied]),
    last,
    ms: run?.ms ?? 400,
    playing: run !== null && step < total,
    /** Ligne du programme en cours (Python). */
    line: last.at(-1)?.line ?? null,
  }
}
