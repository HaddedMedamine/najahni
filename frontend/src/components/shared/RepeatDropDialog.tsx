import { CalendarDays, CalendarRange, Repeat } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MAX_REPEAT_WEEKS, schoolYearEnd, weeksUntilSchoolYearEnd } from '@/core/lib/dates'
import { formatDate, formatSessionSlot } from '@/core/lib/format'

/** Groupe depose sur un creneau, en attente du choix de repetition. */
export interface PendingDrop {
  groupId: string
  groupName: string
  /** Seances par cycle : nombre propose par defaut. */
  monthlySessions?: number
  start: Date
  end: Date
}

interface Props {
  drop: PendingDrop | null
  onClose: () => void
  /** `weeks` = 1 pour une seance unique. */
  onConfirm: (weeks: number) => void
  loading?: boolean
}

/** Apres un glisser-deposer : une seance, chaque semaine jusqu'a la fin de l'annee, ou N seances. */
export function RepeatDropDialog({ drop, ...props }: Props) {
  // Remonte a chaque depot : le nombre propose repart de celui du groupe
  return drop ? <RepeatChoices key={`${drop.groupId}-${drop.start.getTime()}`} drop={drop} {...props} /> : null
}

function RepeatChoices({ drop, onClose, onConfirm, loading }: Props & { drop: PendingDrop }) {
  const { t } = useTranslation()
  const [count, setCount] = useState(() => String(Math.min(drop.monthlySessions || 4, MAX_REPEAT_WEEKS)))

  const yearWeeks = weeksUntilSchoolYearEnd(drop.start)
  const weeks = Number(count)
  const countValid = Number.isInteger(weeks) && weeks >= 1 && weeks <= MAX_REPEAT_WEEKS

  return (
    <Dialog open onOpenChange={(open) => !open && !loading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('planning.repeatTitle')}</DialogTitle>
          <DialogDescription>
            {drop.groupName} · {formatSessionSlot(drop.start.toISOString(), drop.end.toISOString())}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          <Choice
            icon={<CalendarDays />}
            title={t('planning.repeatOnce')}
            disabled={loading}
            onClick={() => onConfirm(1)}
          />
          <Choice
            icon={<Repeat />}
            title={t('planning.repeatWeekly', { date: formatDate(schoolYearEnd(drop.start).toISOString()) })}
            hint={t('planning.repeatWeeklyHint', { count: yearWeeks })}
            disabled={loading}
            onClick={() => onConfirm(yearWeeks)}
          />
          <form
            className="flex items-end gap-2 rounded-xl border border-border p-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (countValid) onConfirm(weeks)
            }}
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium">
              <span className="flex items-center gap-2">
                <CalendarRange className="size-4 text-muted-foreground" />
                {t('planning.repeatCount')}
              </span>
              <Input
                type="number"
                min={1}
                max={MAX_REPEAT_WEEKS}
                dir="ltr"
                value={count}
                aria-invalid={!countValid}
                onChange={(e) => setCount(e.target.value)}
              />
            </label>
            <Button type="submit" disabled={!countValid} loading={loading}>
              {t('common.create')}
            </Button>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

interface ChoiceProps {
  icon: ReactNode
  title: string
  hint?: string
  disabled?: boolean
  onClick: () => void
}

function Choice({ icon, title, hint, disabled, onClick }: ChoiceProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border p-3 text-start text-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary"
    >
      {icon}
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  )
}
