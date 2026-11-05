import { DoorClosed, DoorOpen, Home, KeyRound, Lock, Package, Rat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BitouSays } from '@/components/shared/coding/bitou'
import { GameHud, GAMES, type GameId, GameStage, Stars } from '@/components/shared/coding/GameStage'
import { ErrorState, TableSkeleton } from '@/components/shared/States'
import { sfx } from '@/core/game/sound'
import { cn } from '@/core/lib/utils'
import { type CodingMapLevel, useCodingMap } from '../api/coding.api'

/** Carte d'un jeu : les chapitres sont des etapes d'un chemin qui serpente. */
export function CodingGamePage() {
  const { game = '' } = useParams()
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useCodingMap()

  if (!(game in GAMES)) return <Navigate to="/student/coding" replace />
  const id = game as GameId

  if (isLoading) return <TableSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  const chapters = data.games[GAMES[id].kind]
  const levels = chapters.flatMap((c) => c.levels)
  const done = levels.filter((l) => l.completed).length
  const stars = levels.reduce((sum, l) => sum + l.stars, 0)
  // La souris attend devant la premiere mission pas encore reussie
  const currentId = levels.find((l) => l.unlocked && !l.completed)?.id
  const title = id === 'mouse' ? t('coding.gameMouse') : t('coding.gameDoors')

  return (
    <GameStage game={id}>
      <GameHud
        backTo="/student/coding"
        backLabel={t('coding.title')}
        title={title}
        subtitle={t('coding.progress', { done, total: levels.length })}
      >
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-bold">
          <Stars value={1} className="text-base [&>svg:nth-child(n+2)]:hidden" />
          {stars} / {levels.length * 3}
        </span>
      </GameHud>

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <BitouSays className="game-rise">
          {done === 0
            ? id === 'mouse'
              ? 'El fara tayha 3la darha. Ekteb code w warri-ha el thniya!'
              : 'Kol bab msakker b code. Ekteb el algorithme wala Python, w 7ell el portes el kol!'
            : done === levels.length
              ? 'Kammelt kol chay! Tnajem t3awed bech tkammel el étoiles.'
              : 'Mar7ba bik men jdid! El mission eli jeya testanna fik.'}
        </BitouSays>

        {chapters.map((chapter, ci) => (
          <section key={chapter.id} className="game-panel game-rise flex flex-col gap-5 p-4 sm:p-6">
            <div>
              <p className="text-xs font-bold tracking-wide text-primary uppercase">
                {t('coding.chapter', { n: ci + 1 })}
              </p>
              <h2 className="game-title text-xl">{chapter.title}</h2>
              <p className="text-sm text-muted-foreground">{chapter.description}</p>
            </div>
            <ol className="flex flex-wrap items-start gap-y-7 pt-3">
              {chapter.levels.map((level, li) => (
                <LevelNode
                  key={level.id}
                  game={id}
                  level={level}
                  number={`${ci + 1}.${li + 1}`}
                  current={level.id === currentId}
                  // Le chemin ondule : un noeud sur deux est decale
                  low={li % 2 === 1}
                />
              ))}
              <li className="flex w-24 flex-col items-center gap-1.5 text-center">
                <span
                  className={cn(
                    'flex size-14 items-center justify-center rounded-2xl border-2',
                    chapter.levels.every((l) => l.completed)
                      ? 'border-success bg-success-soft text-success'
                      : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  <Home className="size-7" />
                </span>
                <span className="text-xs text-muted-foreground">{t('coding.house')}</span>
              </li>
            </ol>
          </section>
        ))}
      </main>
    </GameStage>
  )
}

function nodeIcon(level: CodingMapLevel, game: GameId) {
  if (!level.unlocked) return Lock
  if (game === 'mouse') return Rat
  if (level.scene === 'chest') return level.completed ? KeyRound : Package
  return level.completed ? DoorOpen : DoorClosed
}

interface NodeProps {
  game: GameId
  level: CodingMapLevel
  number: string
  current: boolean
  low: boolean
}

function LevelNode({ game, level, number, current, low }: NodeProps) {
  const { t } = useTranslation()
  const Icon = nodeIcon(level, game)
  const body = (
    <span className="flex w-24 flex-col items-center gap-1 text-center">
      <span
        className={cn(
          'game-node flex size-14 items-center justify-center rounded-2xl border-2',
          level.completed && 'border-success bg-success-soft text-success',
          !level.completed && level.unlocked && 'border-primary bg-primary-soft text-primary',
          !level.unlocked && 'border-border bg-muted text-muted-foreground',
          current && 'game-pulse',
        )}
      >
        <Icon className="size-7" />
      </span>
      <span className="text-[11px] font-semibold text-muted-foreground">{number}</span>
      <span className="line-clamp-2 text-xs font-medium">{level.title}</span>
      {level.completed && <Stars value={level.stars} className="text-sm" />}
    </span>
  )
  return (
    <li className={cn('flex items-start', low && 'sm:translate-y-5')}>
      {level.unlocked ? (
        <Link to={`/student/coding/${game}/${level.id}`} onClick={() => sfx('click')}>
          {body}
        </Link>
      ) : (
        <div title={t('coding.locked')}>{body}</div>
      )}
      <span
        aria-hidden
        className={cn(
          'mt-6 h-1 w-3 rounded-full sm:w-6',
          level.completed ? 'bg-success' : 'border-t-2 border-dashed border-border',
        )}
      />
    </li>
  )
}
