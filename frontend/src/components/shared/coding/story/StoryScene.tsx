import type { TraceEvent } from '@/core/python/engine'
import type { StoryStage } from '../types'
import { ArchiveScene } from './ArchiveScene'
import { CardScene } from './CardScene'
import { CinemaScene } from './CinemaScene'
import { DollScene, MachineScene, StairsScene, TargetScene } from './NumberScenes'
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
  switch (stage.type) {
    case 'penguins':
      return <PenguinScene values={stage.values} target={stage.target} {...play} />
    case 'shop':
      return <ShopScene bags={stage.bags} {...play} />
    case 'cards':
      return <CardScene title={stage.title} fields={stage.fields} count={stage.count} {...play} />
    case 'cinema':
      return <CinemaScene rows={stage.rows} mode={stage.mode} {...play} />
    case 'archive':
      return <ArchiveScene drawers={stage.drawers} {...play} />
    case 'dolls':
      return <DollScene {...play} />
    case 'stairs':
      return <StairsScene length={stage.length} {...play} />
    case 'machine':
      return <MachineScene vars={stage.vars} {...play} />
    case 'target':
      return <TargetScene variable={stage.variable} exact={stage.exact} min={stage.min} max={stage.max} {...play} />
  }
}
