import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatTdo, parseTdo } from '@/core/algo/tdo'
import type { TdoRow } from '@/core/algo/transpile'

interface Props {
  rows: TdoRow[]
  onChange: (rows: TdoRow[]) => void
  readOnly?: boolean
}

const fieldClass =
  'min-h-28 w-full rounded-xl border border-border bg-card p-3 font-mono text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15'

/** Tableau de declaration des objets : un seul champ, ex. "i, j, n : Entier". */
export function TdoEditor({ rows, onChange, readOnly }: Props) {
  const { t } = useTranslation()
  const [text, setText] = useState(() => formatTdo(rows))
  const { errors } = parseTdo(text)

  // Objets changes de l'exterieur (Python traduit en algorithme) : le champ les reprend
  useEffect(() => {
    setText((current) => (formatTdo(parseTdo(current).rows) === formatTdo(rows) ? current : formatTdo(rows)))
  }, [rows])

  if (readOnly) {
    return (
      <div className="flex flex-col gap-2" dir="ltr">
        <p className="text-sm font-semibold">{t('coding.tdo')}</p>
        <pre className="rounded-xl bg-muted p-3 font-mono text-sm whitespace-pre-wrap">{formatTdo(rows) || t('coding.tdoEmpty')}</pre>
      </div>
    )
  }

  return (
    <label className="flex flex-col gap-2" dir="ltr">
      <span className="text-sm font-semibold">{t('coding.tdo')}</span>
      <textarea
        value={text}
        spellCheck={false}
        placeholder={t('coding.tdoPlaceholder')}
        className={fieldClass}
        onChange={(e) => {
          setText(e.target.value)
          onChange(parseTdo(e.target.value).rows)
        }}
      />
      {errors.map((error) => (
        <span key={error.line} className="text-xs font-medium text-danger">
          {t('coding.errorLine', { line: error.line })} : {error.message}
        </span>
      ))}
    </label>
  )
}
