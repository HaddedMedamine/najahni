import { Code2, Play } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { BitouAvatar } from '@/components/shared/coding/bitou'
import { DoorScene } from '@/components/shared/coding/DoorScene'
import { GridBoard } from '@/components/shared/coding/GridBoard'
import { PenguinScene } from '@/components/shared/coding/story/PenguinScene'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Card } from '@/components/ui/card'
import { sfx } from '@/core/game/sound'
import { type CodingChapter, useCodingMap } from '../api/coding.api'

const PREVIEW_WORLD = { map: ['#########', '#S.C...X#', '#.###.###', '#...C..H#', '#########'] }

/** Les deux jeux de la partie Coder : un clic ouvre le jeu et ses missions. */
export function CodingPage() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useCodingMap()

  if (isLoading) return <TableSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />

  return (
    <>
      <PageHeader title={t('coding.title')} description={t('coding.subtitle')} />
      {!data.track ? (
        <Card>
          <EmptyState icon={Code2} title={t('coding.noTrack')} />
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {data.games.STORY.length > 0 && (
            <GameCard
              to="/student/coding/bac"
              theme="quest"
              title={t('coding.gameBac')}
              description={t('coding.gameBacDesc')}
              chapters={data.games.STORY}
              art={<PenguinScene values={[45, 80, 30, 65, 95]} target="desc" events={[]} last={[]} ms={300} outcome={null} />}
            />
          )}
          <GameCard
            to="/student/coding/mouse"
            theme="garden"
            title={t('coding.gameMouse')}
            description={t('coding.gameMouseDesc')}
            chapters={data.games.GRID}
            art={<GridBoard world={PREVIEW_WORLD} frame={null} />}
          />
          {(data.games.PYTHON.length > 0 || data.games.STORY.length === 0) && (
            <GameCard
              to="/student/coding/doors"
              theme="temple"
              title={t('coding.gameDoors')}
              description={t('coding.gameDoorsDesc')}
              chapters={data.games.PYTHON}
              art={<DoorScene scene="door" state="idle" />}
            />
          )}
        </div>
      )}
    </>
  )
}

interface GameCardProps {
  to: string
  theme: 'garden' | 'temple' | 'quest'
  title: string
  description: string
  chapters: CodingChapter[]
  art: ReactNode
}

function GameCard({ to, theme, title, description, chapters, art }: GameCardProps) {
  const { t } = useTranslation()
  const levels = chapters.flatMap((c) => c.levels)
  const done = levels.filter((l) => l.completed).length
  const stars = levels.reduce((sum, l) => sum + l.stars, 0)

  const body = (
    <div
      className="game-stage group relative flex h-full flex-col gap-4 overflow-hidden rounded-3xl p-5 shadow-xl transition-transform hover:-translate-y-1"
      data-theme={theme}
    >
      <div className="game-sky" aria-hidden />
      <div className="relative overflow-hidden rounded-2xl border border-border">{art}</div>
      <div className="relative flex items-start gap-3">
        <BitouAvatar className="size-12" happy />
        <div className="min-w-0 flex-1">
          <h2 className="game-title text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="relative mt-auto flex items-center justify-between gap-3">
        {levels.length > 0 ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold text-muted-foreground">
                {t('coding.progress', { done, total: levels.length })} · ⭐ {stars}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(done / levels.length) * 100}%` }} />
              </div>
            </div>
            <span className="game-cta inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground">
              <Play className="size-4" />
              {done > 0 ? t('coding.continue') : t('coding.play')}
            </span>
          </>
        ) : (
          <p className="text-sm font-semibold text-muted-foreground">{t('coding.soon')}</p>
        )}
      </div>
    </div>
  )

  return levels.length > 0 ? (
    <Link to={to} onClick={() => sfx('click')} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}
