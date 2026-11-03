import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn, initials } from '@/core/lib/utils'

export function Avatar({
  user,
  className,
}: {
  user: { firstName: string; lastName: string }
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary',
        className,
      )}
    >
      {initials(user)}
    </span>
  )
}

export function StatusBadge({
  isActive,
  archived,
}: {
  isActive: boolean
  archived?: boolean
}) {
  const { t } = useTranslation()
  if (archived) return <Badge variant="warning">{t('common.archived')}</Badge>
  return isActive ? (
    <Badge variant="success">{t('common.active')}</Badge>
  ) : (
    <Badge variant="danger">{t('common.inactive')}</Badge>
  )
}

const TONES = {
  primary: 'bg-primary-soft text-primary',
  sky: 'bg-sky-soft text-sky',
  violet: 'bg-violet-soft text-violet',
  peach: 'bg-peach-soft text-peach',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
} as const

export type Tone = keyof typeof TONES

export function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = 'primary',
}: {
  label: string
  value: number | string | undefined
  icon: LucideIcon
  loading?: boolean
  tone?: Tone
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn('rounded-2xl p-3.5', TONES[tone])}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-tight text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">
          {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" /> : value}
        </p>
      </div>
    </Card>
  )
}

/** Barre de remplissage d'un groupe (eleves / capacite). */
export function FillBar({ count, capacity }: { count: number; capacity: number }) {
  const ratio = capacity > 0 ? Math.min(1, count / capacity) : 0
  return (
    <div className="flex min-w-28 items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            ratio >= 1 ? 'bg-danger' : ratio >= 0.8 ? 'bg-warning' : 'bg-primary',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {count}/{capacity}
      </span>
    </div>
  )
}
