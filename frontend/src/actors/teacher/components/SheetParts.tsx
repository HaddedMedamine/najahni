import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { GroupSheet } from '@/core/api/types'
import { formatDate, formatDay, formatMonth } from '@/core/lib/format'
import { cn } from '@/core/lib/utils'

type Presence = GroupSheet['rows'][number]['presences'][number]

const PAID = 'border-success/40 bg-success-soft text-success'
const UNPAID = 'border-border bg-card text-foreground'

/** Dates de presence d'un eleve : vert = payee, blanc = non payee. */
export function PresenceDates({ presences }: { presences: Presence[] }) {
  const { t } = useTranslation()
  if (presences.length === 0) return <p className="text-sm text-muted-foreground">{t('sheet.noPresence')}</p>
  return (
    <div className="flex flex-wrap content-start items-start gap-1.5">
      {presences.map((p) => (
        <span
          key={p.sessionId}
          dir="ltr"
          title={t('sheet.detail', {
            date: formatDate(p.startsAt),
            series: p.series,
            state: t(p.paid ? 'sheet.paid' : 'sheet.unpaid'),
          })}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium tabular-nums',
            p.paid ? PAID : UNPAID,
          )}
        >
          {p.paid && <Check className="size-3" aria-hidden />}
          {formatDay(p.startsAt)}
        </span>
      ))}
    </div>
  )
}

export function PresenceCounts({ presences }: { presences: Presence[] }) {
  const { t } = useTranslation()
  if (presences.length === 0) return null
  const paid = presences.filter((p) => p.paid).length
  return (
    <p className="text-xs text-muted-foreground">{t('sheet.counts', { paid, unpaid: presences.length - paid })}</p>
  )
}

export function SheetLegend({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex flex-wrap gap-3 text-xs text-muted-foreground', className)}>
      <span className="flex items-center gap-1.5">
        <span className={cn('inline-flex size-4 items-center justify-center rounded border', PAID)}>
          <Check className="size-3" aria-hidden />
        </span>
        {t('sheet.paid')}
      </span>
      <span className="flex items-center gap-1.5">
        <span className={cn('size-4 rounded border', UNPAID)} />
        {t('sheet.unpaid')}
      </span>
    </div>
  )
}

interface MonthFilterProps {
  months: string[]
  month?: string
  onChange: (month?: string) => void
}

export function MonthFilter({ months, month, onChange }: MonthFilterProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant={month ? 'outline' : 'default'} aria-pressed={!month} onClick={() => onChange()}>
        {t('sheet.allMonths')}
      </Button>
      {months.map((m) => (
        <Button
          key={m}
          size="sm"
          className="capitalize"
          variant={m === month ? 'default' : 'outline'}
          aria-pressed={m === month}
          onClick={() => onChange(m)}
        >
          {formatMonth(m)}
        </Button>
      ))}
    </div>
  )
}
