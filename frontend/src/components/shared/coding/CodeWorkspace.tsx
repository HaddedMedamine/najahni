import { ArrowRightLeft, CircleCheck, CircleX, Code2, EyeOff, KeyRound, Play, RotateCcw } from 'lucide-react'
import { type ReactNode, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { pythonToAlgo } from '@/core/algo/toAlgo'
import { type AlgoError, type TdoRow, transpile } from '@/core/algo/transpile'
import { sfx } from '@/core/game/sound'
import { cn } from '@/core/lib/utils'
import type { FreeRun, RunError, TestCase, TestResult } from '@/core/python/engine'
import { PythonTimeoutError, python } from '@/core/python/runner'
import { BitouSays, DOOR_MESSAGES, explainError, TIMEOUT_MESSAGE } from './bitou'
import { CodeEditor, type CodeEditorHandle } from './CodeEditor'
import { TdoEditor } from './TdoEditor'
import type { CodeLanguage, DoorData } from './types'

interface Props {
  language: CodeLanguage
  onLanguageChange: (language: CodeLanguage) => void
  code: string
  onCodeChange: (code: string) => void
  tdo: TdoRow[]
  onTdoChange: (tdo: TdoRow[]) => void
  data: DoorData
  /** Fin d'une verification (tous les tests reussis ou non). */
  onChecked: (success: boolean) => void
  /** Brouillon traduit depuis Python : bascule l'editeur en algorithme. */
  onConvertedToAlgo: (algo: string, tdo: TdoRow[]) => void
  onReset: () => void
  /** La porte ou le coffre, au-dessus des resultats. */
  scene: ReactNode
  toolbar?: ReactNode
}

// Le clavier n'a pas ces symboles : on les insere d'un clic
const SYMBOLS = ['←', '≠', '≤', '≥', '∈']
const SNIPPETS = [
  { label: 'Si', text: 'Si  Alors\n    \nFinSi' },
  { label: 'Pour', text: 'Pour i de  à  Faire\n    \nFinPour' },
  { label: 'TantQue', text: 'TantQue  Faire\n    \nFinTantQue' },
  { label: 'Répéter', text: "Répéter\n    \nJusqu'à " },
]

const textareaClass =
  'min-h-20 w-full rounded-xl border border-border bg-card p-3 font-mono text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15'

/** Ce qu'un test attend, en texte lisible. */
const expectation = (test: TestCase) =>
  test.expected ?? test.numbers?.join(' … ') ?? test.output?.join(' / ') ?? ''

/**
 * Portes du code : editeur + console. En algorithme, le code (et le TDO) est traduit
 * en Python puis execute ; les erreurs sont ramenees aux lignes de l'algorithme.
 */
export function CodeWorkspace(props: Props) {
  const { language, code, tdo, data, onChecked, toolbar } = props
  const { t } = useTranslation()
  const editor = useRef<CodeEditorHandle>(null)
  const usesInput = data.tests.some((test) => test.inputs)
  const firstInputs = data.tests.find((test) => test.inputs && !test.hidden)?.inputs ?? []
  const [inputs, setInputs] = useState(firstInputs.join('\n'))
  const [busy, setBusy] = useState<'run' | 'check' | null>(null)
  const [output, setOutput] = useState<FreeRun | null>(null)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [algoErrors, setAlgoErrors] = useState<AlgoError[]>([])
  const [showPython, setShowPython] = useState(false)
  const [converted, setConverted] = useState(false)

  // Algorithme -> Python (recalcule a chaque frappe : "Voir en Python" reste a jour)
  const translated = useMemo(
    () =>
      language === 'ALGO'
        ? transpile(
            code,
            tdo.filter((row) => row.name.trim()),
          )
        : null,
    [language, code, tdo],
  )
  const toEditorLine = (line: number | null) =>
    line === null ? null : translated ? (translated.lineMap[line - 1] ?? null) : line

  const execute = async (kind: 'run' | 'check') => {
    sfx('click')
    setFailure(null)
    setOutput(null)
    setResults(null)
    setConverted(false)
    const program = translated ?? { python: code, errors: [] }
    setAlgoErrors(program.errors)
    if (program.errors.length) {
      if (kind === 'check') onChecked(false)
      return
    }
    setBusy(kind)
    try {
      if (kind === 'run') {
        setOutput(
          await python.runFree(
            program.python,
            inputs.split('\n').filter((l) => l !== ''),
          ),
        )
      } else {
        const r = await python.runTests(program.python, data.tests)
        setResults(r)
        onChecked(r.every((x) => x.ok))
      }
    } catch (error) {
      setFailure(error instanceof PythonTimeoutError ? TIMEOUT_MESSAGE : (error as Error).message)
      if (kind === 'check') onChecked(false)
    } finally {
      setBusy(null)
    }
  }

  const toAlgo = () => {
    const draft = pythonToAlgo(code)
    // On garde le TDO deja rempli et on ajoute les objets manquants
    const known = new Set(tdo.map((row) => row.name.toLowerCase()))
    props.onConvertedToAlgo(draft.algo, [...tdo, ...draft.tdo.filter((row) => !known.has(row.name.toLowerCase()))])
    setConverted(true)
    setAlgoErrors([])
    setResults(null)
    setOutput(null)
  }

  const runError: RunError | null = output?.error ?? results?.find((r) => r.error)?.error ?? null
  const errorLine = algoErrors[0]?.line ?? toEditorLine(runError?.line ?? null)
  const passed = results?.filter((r) => r.ok).length ?? 0
  const failed = results !== null && passed < results.length

  return (
    <div className="grid flex-1 gap-4 p-3 sm:p-5 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-muted p-1" role="tablist">
            {(['ALGO', 'PYTHON'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                role="tab"
                aria-selected={language === lang}
                onClick={() => {
                  sfx('click')
                  props.onLanguageChange(lang)
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                  language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {lang === 'ALGO' ? t('coding.langAlgo') : t('coding.langPython')}
              </button>
            ))}
          </div>
          {language === 'ALGO' && (
            <div className="flex flex-wrap gap-1" dir="ltr">
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => editor.current?.insert(symbol)}
                  className="size-8 rounded-lg border border-primary/40 bg-primary-soft text-sm font-bold text-primary hover:-translate-y-0.5"
                >
                  {symbol}
                </button>
              ))}
              {SNIPPETS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => editor.current?.insert(s.text)}
                  className="h-8 rounded-lg border border-border bg-muted px-2 font-mono text-xs text-muted-foreground hover:-translate-y-0.5 hover:text-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <CodeEditor
          key={language}
          handle={editor}
          game
          language={language === 'ALGO' ? 'algo' : 'python'}
          value={code}
          onChange={props.onCodeChange}
          errorLine={errorLine}
          className="h-80 xl:h-[24rem]"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="lg"
            className="game-cta"
            onClick={() => execute('check')}
            loading={busy === 'check'}
            disabled={busy !== null}
          >
            <KeyRound />
            {data.scene === 'chest' ? t('coding.checkChest') : t('coding.check')}
          </Button>
          <Button variant="outline" onClick={() => execute('run')} loading={busy === 'run'} disabled={busy !== null}>
            <Play />
            {t('coding.execute')}
          </Button>
          {language === 'ALGO' ? (
            <Button variant="ghost" size="sm" onClick={() => setShowPython((v) => !v)}>
              <Code2 />
              {showPython ? t('coding.hidePython') : t('coding.showPython')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={toAlgo}>
              <ArrowRightLeft />
              {t('coding.toAlgo')}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={props.onReset}>
            <RotateCcw />
            {t('coding.reset')}
          </Button>
          {toolbar}
        </div>

        {language === 'ALGO' && <TdoEditor rows={tdo} onChange={props.onTdoChange} />}
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-border">{props.scene}</div>

        {converted && <BitouSays>{t('coding.toAlgoDone')}</BitouSays>}

        {algoErrors.length > 0 && (
          <BitouSays tone="error" className="game-rise">
            <span className="font-semibold">{t('coding.algoErrors')}</span>
            <ul className="mt-1 list-disc ps-4 font-mono text-xs">
              {algoErrors.map((e, i) => (
                <li key={i}>
                  {e.line !== null && `${t('coding.errorLine', { line: e.line })} : `}
                  {e.message}
                </li>
              ))}
            </ul>
          </BitouSays>
        )}

        {runError && (
          <BitouSays tone="error" className="game-rise">
            {explainError(runError)}
            <span className="mt-1 block font-mono text-xs opacity-80">
              {toEditorLine(runError.line) !== null &&
                `${t('coding.errorLine', { line: toEditorLine(runError.line) })} · `}
              {runError.type} : {runError.message}
            </span>
          </BitouSays>
        )}
        {failure && <BitouSays tone="error">{failure}</BitouSays>}
        {failed && !runError && (
          <BitouSays tone="error" className="game-rise">
            {DOOR_MESSAGES.locked}
          </BitouSays>
        )}

        {usesInput && (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('coding.inputs')}
            <textarea dir="ltr" value={inputs} onChange={(e) => setInputs(e.target.value)} className={textareaClass} />
          </label>
        )}

        {output && (
          <Card className="p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t('coding.console')}</p>
            <pre dir="ltr" className="max-h-64 overflow-auto text-sm whitespace-pre-wrap">
              {output.stdout || ' '}
            </pre>
          </Card>
        )}

        {results && (
          <Card className="flex flex-col gap-2 p-3">
            <p className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              {t('coding.tests')}
              <span className={cn(passed === results.length ? 'text-success' : 'text-danger')}>
                {passed} / {results.length}
              </span>
            </p>
            {results.map((r, i) => (
              <TestRow key={i} index={i} test={data.tests[i]} result={r} />
            ))}
          </Card>
        )}

        {language === 'ALGO' && showPython && translated && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-muted-foreground">{t('coding.generatedPython')}</p>
            <CodeEditor key={translated.python} game value={translated.python} readOnly className="max-h-72" />
          </div>
        )}
      </div>
    </div>
  )
}

function TestRow({ index, test, result }: { index: number; test: TestCase; result: TestResult }) {
  const { t } = useTranslation()
  const Icon = result.ok ? CircleCheck : CircleX
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs',
        result.ok ? 'border-success/30 bg-success-soft/50' : 'border-danger/30 bg-danger-soft/50',
      )}
    >
      <p className="flex items-center gap-1.5 font-medium">
        <Icon className={cn('size-4', result.ok ? 'text-success' : 'text-danger')} />
        {test.hidden ? (
          <span className="flex items-center gap-1">
            <EyeOff className="size-3.5" />
            {t('coding.hiddenTest')}
          </span>
        ) : (
          t('coding.test', { n: index + 1 })
        )}
      </p>
      {!test.hidden && (
        <dl dir="ltr" className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono">
          {test.expr && (
            <>
              <dt className="text-muted-foreground">&gt;&gt;&gt;</dt>
              <dd>{test.expr}</dd>
            </>
          )}
          {test.inputs && (
            <>
              <dt className="text-muted-foreground">{t('coding.testInputs')}</dt>
              <dd>{test.inputs.join(', ')}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t('coding.expected')}</dt>
          <dd>{expectation(test)}</dd>
          {!result.ok && result.got !== undefined && (
            <>
              <dt className="text-muted-foreground">{t('coding.got')}</dt>
              <dd className="whitespace-pre-wrap">{result.got || '—'}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  )
}
