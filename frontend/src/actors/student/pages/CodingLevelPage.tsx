import { Clapperboard, Loader2, Target } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { BitouSays, SUCCESS_MESSAGES } from '@/components/shared/coding/bitou'
import { CodeWorkspace } from '@/components/shared/coding/CodeWorkspace'
import { DoorScene, type SceneState } from '@/components/shared/coding/DoorScene'
import {
  GameHud,
  GAMES,
  type GameId,
  GameStage,
  HintsButton,
  MissionBriefing,
  Stars,
  VictoryOverlay,
} from '@/components/shared/coding/GameStage'
import { MouseWorkspace } from '@/components/shared/coding/MouseWorkspace'
import { SolutionPanel, StoryIntro } from '@/components/shared/coding/story/StoryIntro'
import { StoryScene } from '@/components/shared/coding/story/StoryScene'
import { useTracePlayer } from '@/components/shared/coding/story/useTracePlayer'
import type { CodeLanguage } from '@/components/shared/coding/types'
import { Button } from '@/components/ui/button'
import { ErrorState, TableSkeleton } from '@/components/shared/States'
import type { TdoRow } from '@/core/algo/transpile'
import { sfx } from '@/core/game/sound'
import { readStorage, writeStorage } from '@/core/lib/storage'
import type { TestResult } from '@/core/python/engine'
import { python, usePythonStatus } from '@/core/python/runner'
import { type AttemptResult, type CodingLevel, useCodeAttempt, useCodingLevel } from '../api/coding.api'

type Level<K extends CodingLevel['kind']> = Extract<CodingLevel, { kind: K }>

export function CodingLevelPage() {
  const { game = '', id = '' } = useParams()
  const { data, isLoading, isError, refetch } = useCodingLevel(id)

  // Python se charge pendant que l'eleve lit sa mission
  useEffect(() => {
    python.warmUp().catch(() => {})
  }, [])

  if (!(game in GAMES)) return <Navigate to="/student/coding" replace />
  if (isLoading) return <TableSkeleton />
  if (isError || !data) return <ErrorState onRetry={refetch} />
  return (
    <GameStage game={game as GameId}>
      {data.kind === 'GRID' && <MouseLevel key={data.id} level={data} />}
      {data.kind === 'PYTHON' && <DoorLevel key={data.id} level={data} />}
      {data.kind === 'STORY' && <StoryLevel key={data.id} level={data} />}
    </GameStage>
  )
}

// Brouillons par niveau dans le navigateur (le serveur garde le code de chaque essai)
const draftKey = (levelId: string, part: 'PYTHON' | 'ALGO' | 'TDO') => `najahni.coding.${levelId}.${part}`

/** Code a reprendre. Une mission reussie repart de zero : l'eleve la reecrit lui-meme. */
const resume = (level: CodingLevel, part: 'PYTHON' | 'ALGO', sameLanguage: boolean) =>
  level.progress.completed
    ? null
    : (readStorage(draftKey(level.id, part)) ?? (sameLanguage ? level.progress.lastCode : null))

function readTdo(level: CodingLevel): TdoRow[] {
  if (level.progress.completed) return []
  try {
    const draft = readStorage(draftKey(level.id, 'TDO'))
    if (draft) return JSON.parse(draft) as TdoRow[]
  } catch {
    // brouillon illisible : on repart du dernier essai
  }
  return level.progress.tdo ?? []
}

/** Barre, mission, briefing et victoire : commun aux jeux. */
function LevelFrame({
  game,
  level,
  result,
  onStay,
  saveFailed,
  briefing,
  children,
}: {
  game: GameId
  level: CodingLevel
  result: AttemptResult | null
  onStay: () => void
  /** L'essai n'a pas pu etre enregistre : la mission suivante ne s'ouvrira pas. */
  saveFailed: boolean
  /** Remplace l'ecran de mission ; l'eleve peut le revoir depuis la barre. */
  briefing?: (start: () => void) => ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const status = usePythonStatus()
  const [started, setStarted] = useState(false)
  const map = `/student/coding/${game}`

  return (
    <>
      <GameHud backTo={map} backLabel={t('coding.backToMap')} title={level.title} subtitle={level.chapter.title}>
        {status === 'loading' && (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" title={t('coding.firstLoad')}>
            <Loader2 className="size-3.5 animate-spin" />
            {t('coding.loadingPython')}
          </span>
        )}
        {level.progress.completed && <Stars value={level.progress.stars} className="text-lg" />}
        {briefing && (
          <Button variant="outline" onClick={() => setStarted(false)} title={t('coding.storyReplay')}>
            <Clapperboard />
            <span className="hidden sm:inline">{t('coding.storyReplay')}</span>
          </Button>
        )}
        <HintsButton hints={level.hints} />
      </GameHud>

      <p className="flex items-start gap-2 px-3 pt-3 text-sm whitespace-pre-line sm:px-5" dir="ltr">
        <Target className="mt-0.5 size-4 shrink-0 text-primary" />
        {level.statement}
      </p>

      {saveFailed && (
        <BitouSays tone="error" className="game-rise px-3 pt-3 sm:px-5">
          {t('coding.saveFailed')}
        </BitouSays>
      )}

      {children}

      {!started &&
        (briefing ? (
          briefing(() => setStarted(true))
        ) : (
          <MissionBriefing
            label={level.chapter.title}
            title={level.title}
            statement={level.statement}
            bitou={level.bitou}
            onStart={() => setStarted(true)}
          />
        ))}
      {result && (
        <VictoryOverlay
          stars={result.stars}
          title={
            game === 'doors'
              ? level.kind === 'PYTHON' && level.data.scene === 'chest'
                ? t('coding.successChest')
                : t('coding.successTitle')
              : t('coding.missionDone')
          }
          message={
            SUCCESS_MESSAGES[result.attempts % SUCCESS_MESSAGES.length] +
            (result.stars < 3 ? '\nTnajem t3awed bech tjib 3 étoiles!' : '')
          }
          nextLabel={level.nextLevelId ? t('coding.next') : t('coding.backToMap')}
          onNext={() => navigate(level.nextLevelId ? `${map}/${level.nextLevelId}` : map)}
          onStay={onStay}
        />
      )}
    </>
  )
}

function MouseLevel({ level }: { level: Level<'GRID'> }) {
  const attempt = useCodeAttempt(level.id)
  const [code, setCode] = useState(() => resume(level, 'PYTHON', true) ?? level.starterCode)
  const [result, setResult] = useState<AttemptResult | null>(null)

  const changeCode = (value: string) => {
    setCode(value)
    writeStorage(draftKey(level.id, 'PYTHON'), value)
  }

  const finished = (success: boolean) =>
    attempt.mutate(
      { code, success, language: 'PYTHON' },
      {
        onSuccess: (r) => {
          if (r.success) setResult(r)
        },
      },
    )

  return (
    <LevelFrame
      game="mouse"
      level={level}
      result={result}
      saveFailed={attempt.isError}
      onStay={() => setResult(null)}
    >
      <MouseWorkspace
        code={code}
        onCodeChange={changeCode}
        data={level.data}
        onFinished={finished}
        onReset={() => changeCode(level.starterCode)}
      />
    </LevelFrame>
  )
}

/** Le programme d'une mission : algorithme, Python et TDO, avec leurs brouillons. */
function useProgram(level: Level<'PYTHON'> | Level<'STORY'>) {
  const last = level.progress
  // Premiere visite : on commence par l'algorithme, comme en classe
  const [language, setLanguage] = useState<CodeLanguage>(last.attempts > 0 ? last.language : 'ALGO')
  const [pythonCode, setPythonCode] = useState(
    () => resume(level, 'PYTHON', last.language === 'PYTHON') ?? level.starterCode,
  )
  const [algoCode, setAlgoCode] = useState(
    () => resume(level, 'ALGO', last.language === 'ALGO') ?? level.data.algo.starter,
  )
  const [tdo, setTdo] = useState<TdoRow[]>(() => readTdo(level))

  const code = language === 'ALGO' ? algoCode : pythonCode
  const setCode = (value: string) => {
    if (language === 'ALGO') setAlgoCode(value)
    else setPythonCode(value)
    writeStorage(draftKey(level.id, language), value)
  }
  const changeTdo = (rows: TdoRow[]) => {
    setTdo(rows)
    writeStorage(draftKey(level.id, 'TDO'), JSON.stringify(rows))
  }

  return {
    language,
    onLanguageChange: setLanguage,
    code,
    onCodeChange: setCode,
    tdo,
    onTdoChange: changeTdo,
    onConvertedToAlgo: (algo: string, rows: TdoRow[]) => {
      setAlgoCode(algo)
      writeStorage(draftKey(level.id, 'ALGO'), algo)
      changeTdo(rows)
      setLanguage('ALGO')
    },
    onReset: () => setCode(language === 'ALGO' ? level.data.algo.starter : level.starterCode),
  }
}

function DoorLevel({ level }: { level: Level<'PYTHON'> }) {
  const attempt = useCodeAttempt(level.id)
  const program = useProgram(level)
  const { code, language, tdo } = program
  const [scene, setScene] = useState<SceneState>('idle')
  const [result, setResult] = useState<AttemptResult | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const checked = (success: boolean) => {
    window.clearTimeout(timer.current)
    setScene(success ? 'open' : 'locked')
    sfx(success ? 'open' : 'lock')
    // Le cadenas tremble puis redevient normal ; la porte reste ouverte
    if (!success) timer.current = window.setTimeout(() => setScene('idle'), 900)
    attempt.mutate(
      { code, success, language, tdo: language === 'ALGO' ? tdo : undefined },
      {
        onSuccess: (r) => {
          // On laisse la souris passer la porte avant l'ecran de victoire
          if (r.success) timer.current = window.setTimeout(() => setResult(r), 1900)
        },
      },
    )
  }

  return (
    <LevelFrame
      game="doors"
      level={level}
      result={result}
      saveFailed={attempt.isError}
      onStay={() => {
        setResult(null)
        setScene('idle')
      }}
    >
      <CodeWorkspace
        {...program}
        data={level.data}
        onChecked={checked}
        scene={<DoorScene scene={level.data.scene} state={scene} />}
      />
    </LevelFrame>
  )
}

// Instructions des fichiers, a inserer d'un clic
const FILE_SNIPPETS = [
  { label: 'Ouvrir', text: 'Ouvrir("sac.txt", F, "r")' },
  { label: 'Lire_ligne', text: 'Lire_ligne(F, ch)' },
  { label: 'Ecrire_nl', text: 'Ecrire_nl(F, ch)' },
  { label: 'Fin_fichier', text: 'Fin_fichier(F)' },
  { label: 'Fermer', text: 'Fermer(F)' },
]

/** Aventure Bac : introduction, puis la scene rejoue ce que le programme a vraiment fait. */
function StoryLevel({ level }: { level: Level<'STORY'> }) {
  const { t } = useTranslation()
  const { story } = level.data
  const attempt = useCodeAttempt(level.id)
  const program = useProgram(level)
  const { code, language, tdo } = program
  const player = useTracePlayer()
  const [outcome, setOutcome] = useState<'win' | 'lose' | null>(null)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const finish = (success: boolean) => {
    setOutcome(success ? 'win' : 'lose')
    sfx(success ? 'open' : 'lock')
    attempt.mutate(
      { code, success, language, tdo: language === 'ALGO' ? tdo : undefined },
      {
        onSuccess: (r) => {
          // On laisse la scene feter la reussite avant l'ecran de victoire
          if (r.success) timer.current = window.setTimeout(() => setResult(r), 1700)
        },
      },
    )
  }

  const replay = (results: TestResult[]) => {
    setOutcome(null)
    player.play(results[0]?.trace ?? [], () => finish(results.every((r) => r.ok)))
  }

  return (
    <LevelFrame
      game="bac"
      level={level}
      result={result}
      saveFailed={attempt.isError}
      onStay={() => setResult(null)}
      briefing={(start) => (
        <StoryIntro
          label={level.chapter.title}
          title={level.title}
          statement={level.statement}
          story={story}
          onStart={start}
        />
      )}
    >
      <CodeWorkspace
        {...program}
        data={level.data}
        onChecked={finish}
        story={{
          onResults: replay,
          playing: player.playing,
          runLine: player.line,
          checkLabel: t('coding.run'),
          snippets: story.stage.type === 'shop' ? FILE_SNIPPETS : [],
          aside: story.solved && <SolutionPanel solved={story.solved} language={language} />,
        }}
        scene={
          <div className="relative">
            <StoryScene stage={story.stage} events={player.events} last={player.last} ms={player.ms} outcome={outcome} />
            {player.playing && (
              <Button variant="outline" size="sm" className="absolute end-2 bottom-2" onClick={player.skip}>
                {t('coding.storySkip')}
              </Button>
            )}
          </div>
        }
      />
    </LevelFrame>
  )
}
