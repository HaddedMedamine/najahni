import { ChevronLeft, ChevronRight, Coins, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { groupColor } from '@/components/shared/Calendar'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { Earnings } from '@/core/api/types'
import { currentMonthKey, shiftMonthKey } from '@/core/lib/dates'
import { formatDate, formatMoney, formatMonth } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'

interface Props {
  data: Earnings | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  /** Mois affiche "AAAA-MM" */
  month: string
  onMonthChange: (month: string) => void
  /** Vue admin : detail par enseignant + enseignant de chaque groupe. */
  showTeacher?: boolean
}

/** Argent encaisse pendant un mois : total, 12 derniers mois, detail par groupe et paiements. */
export function EarningsView({ data, isLoading, isError, onRetry, month, onMonthChange, showTeacher }: Props) {
  const { t } = useTranslation()
  const thisMonth = currentMonthKey()

  const navigator = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onMonthChange(shiftMonthKey(month, -1))} aria-label={t('earnings.previous')}>
        <ChevronLeft className="rtl:rotate-180" />
      </Button>
      <span className="min-w-36 text-center font-semibold capitalize">{formatMonth(month)}</span>
      <Button
        variant="outline"
        size="icon"
        disabled={month >= thisMonth}
        onClick={() => onMonthChange(shiftMonthKey(month, 1))}
        aria-label={t('earnings.next')}
      >
        <ChevronRight className="rtl:rotate-180" />
      </Button>
      {month !== thisMonth && (
        <Button variant="ghost" size="sm" onClick={() => onMonthChange(thisMonth)}>
          {t('earnings.thisMonth')}
        </Button>
      )}
    </div>
  )

  if (isError) return <ErrorState onRetry={onRetry} />
  if (isLoading || !data) return <CardsSkeleton count={3} />

  const diff = data.total - data.previousTotal
  const max = Math.max(...data.months.map((m) => m.total), 1)

  return (
    <div className="flex flex-col gap-6">
      {navigator}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Total du mois */}
        <Card className="flex flex-col justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-success-soft p-3 text-success">
              <Coins className="size-5" />
            </span>
            <p className="text-sm text-muted-foreground">
              {t('earnings.collectedIn', { month: formatMonth(month) })}
            </p>
          </div>
          <p className="text-4xl font-semibold tabular-nums">{formatMoney(data.total)}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-muted px-2.5 py-1 font-semibold text-muted-foreground">
              {t('earnings.paymentsCount', { count: data.count })}
            </span>
            {(data.total > 0 || data.previousTotal > 0) && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold',
                  diff >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                )}
              >
                {diff >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                {diff >= 0 ? '+' : '−'}
                {formatMoney(Math.abs(diff))} {t('earnings.vsPrevious')}
              </span>
            )}
          </div>
        </Card>

        {/* 12 derniers mois : cliquer sur une barre pour voir ce mois */}
        <Card className="p-6 lg:col-span-2">
          <p className="mb-4 text-sm font-semibold text-muted-foreground">{t('earnings.last12')}</p>
          <div className="flex h-44 items-end gap-1.5 sm:gap-2.5">
            {data.months.map((m) => (
              <button
                key={m.month}
                type="button"
                onClick={() => onMonthChange(m.month)}
                title={`${formatMonth(m.month)} : ${formatMoney(m.total)}`}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              >
                <div
                  className={cn(
                    'w-full rounded-t-lg transition-colors',
                    m.month === month ? 'bg-primary' : 'bg-primary-soft group-hover:bg-primary/40',
                  )}
                  style={{ height: `${Math.max((m.total / max) * 100, m.total > 0 ? 4 : 1.5)}%` }}
                />
                <span
                  className={cn(
                    'text-[11px] capitalize text-muted-foreground',
                    m.month === month && 'font-semibold text-foreground',
                  )}
                >
                  {formatMonth(m.month, 'short')}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {data.count === 0 ? (
        <Card>
          <EmptyState icon={Coins} title={t('earnings.none', { month: formatMonth(month) })} />
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="border-b border-border pb-4">
                <CardTitle>{t('earnings.byGroup')}</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-border">
                {data.byGroup.map((g) => (
                  <li key={g.group.id} className="flex flex-col gap-2 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: groupColor(g.group.id) }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{g.group.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {g.group.subject} · {t('earnings.paymentsCount', { count: g.count })}
                          {showTeacher && ` · ${fullName(g.teacher.user)}`}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums">{formatMoney(g.total)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-success" style={{ width: `${(g.total / data.total) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            {showTeacher && (
              <Card>
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle>{t('earnings.byTeacher')}</CardTitle>
                </CardHeader>
                <ul className="divide-y divide-border">
                  {data.byTeacher.map((row) => (
                    <li key={row.teacher.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div>
                        <p className="font-medium">{fullName(row.teacher.user)}</p>
                        <p className="text-xs text-muted-foreground">{t('earnings.paymentsCount', { count: row.count })}</p>
                      </div>
                      <span className="font-semibold tabular-nums">{formatMoney(row.total)}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Paiements recus pendant le mois */}
          <Card>
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>{t('earnings.payments')}</CardTitle>
            </CardHeader>
            <ul className="divide-y divide-border">
              {data.payments.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="rounded-xl bg-success-soft p-2 text-success">
                    <Receipt className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{fullName(p.student.user)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.group.subject} · {t('payments.series', { number: p.series })} · {formatDate(p.paidAt)} ·{' '}
                      {t('payments.receipt', { number: p.receiptNumber })}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums text-success">{formatMoney(p.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  )
}
