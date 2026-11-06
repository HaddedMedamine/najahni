import type { TraceEvent } from '@/core/python/engine'
import type { StoryStage } from '../types'
import { PenguinScene } from './PenguinScene'
import { ShopScene } from './ShopScene'

interface Props {
  stage: StoryStage
  events: TraceEvent[]
  last: TraceEvent[]
  ms: number
  outcome: 'win' | 'lose' | null
}

/** Le decor d'une mission, dans l'etat atteint par `events`. */
export function StoryScene({ stage, ...play }: Props) {
  return stage.type === 'penguins' ? (
    <PenguinScene values={stage.values} target={stage.target} {...play} />
  ) : (
    <ShopScene bags={stage.bags} {...play} />
  )
}
