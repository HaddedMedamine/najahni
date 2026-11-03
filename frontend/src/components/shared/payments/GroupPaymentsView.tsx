import { ArrowLeft, Info, Undo2, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Avatar } from '@/components/shared/Misc'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { StatusSwitch } from '@/components/shared/StatusSwitch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { GroupPayments, StudentSeries } from '@/core/api/types'
import { formatDate, formatMoney } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'

interface Props {
  data: GroupPayments | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  backHref: string
  onPay: (row: StudentSeries) => void
  onCancel: (row: StudentSeries) => void
  /** Eleve en cours d'enregistrement (desactive sa ligne). */
  pendingStudentId: string | null
}

const STATE_BADGE = { PAID: 'success', DUE: 'danger', PENDING: 'default' } as const

/** Paiements d'un groupe : la serie de chaque eleve et un interrupteur Paye / Non paye. */
export function GroupPaymentsView({
  data,
  isLoading,
  isError,
  onRetry,
  backHref,
  onPay,
  onCancel,
  pendingStudentId,
}: Props) {
  const { t } = useTranslation()
  // Annuler un paiement demande une confirmation (erreur de saisie)
  const [toCancel, setToCancel] = useState<StudentSeries | null>(null)

  if (isLoading) return <TableSkeleton rows={6} />
  if (isError || !data) return <ErrorState onRetry={onRetry} />

  const { group, summary, rows } = data
  const stateLabel = { PAID: t('payments.paid'), DUE: t('payments.due'), PENDING: t('payments.pending') }

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to={backHref}>
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{group.name}</h1>
        <p className="text-sm text-muted-foreground">
          {group.subject} · {t('payments.perSeries', { amount: formatMoney(group.monthlyFee), size: group.monthlySessions })} ·{' '}
          {t('payments.cash')}
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="gap-3 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>{t('payments.title')}</CardTitle>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-success">
                {t('payments.paid')} : {summary.paid}
              </span>
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-danger">
                {t('payments.due')} : {summary.due}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                {t('payments.pending')} : {summary.pending}
              </span>
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary tabular-nums">
                {t('payments.collectedThisMonth')} : {formatMoney(summary.collectedThisMonth)}
              </span>
            </div>
          </div>
        </CardHeader>

        <p className="flex items-start gap-2 border-b border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t('payments.rule', { size: group.monthlySessions })} {t('payments.tapHint')}
          </span>
        </p>

        {rows.length === 0 ? (
          <EmptyState icon={Users} title={t('payments.noStudents')} />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((row) => {
              const paid = row.state === 'PAID'
              const busy = pendingStudentId === row.student.id
              return (
                <li
                  key={row.student.id}
                  className={cn(
                    'flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center',
                    row.state === 'DUE' && 'bg-danger-soft/40',
                    paid && 'bg-success-soft/30',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar user={row.student.user} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{fullName(row.student.user)}</span>
                        <Badge variant={STATE_BADGE[row.state]}>{stateLabel[row.state]}</Badge>
                      </div>
                      {/* Progression de la serie en cours */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex gap-0.5" aria-hidden>
                          {Array.from({ length: row.size }, (_, i) => (
                            <span
                              key={i}
                              className={cn('h-1.5 w-4 rounded-full', i < row.progress ? 'bg-primary' : 'bg-muted')}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {t('payments.seriesProgress', { number: row.series, progress: row.progress, size: row.size })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMoney(row.fee)}
                        {row.dueSeries.length > 0 && (
                          <span className="font-semibold text-danger">
                            {' · '}
                            {t('payments.dueSeries', { list: row.dueSeries.join(', ') })}
                          </span>
                        )}
                        {row.lastPayment && (
                          <>
                            {' · '}
                            {t('payments.paidOn', { number: row.lastPayment.number, date: formatDate(row.lastPayment.paidAt) })}
                            {' · '}
                            {t('payments.receipt', { number: row.lastPayment.receiptNumber })}
                            {row.lastPayment.receivedBy &&
                              ` · ${t('payments.by', { name: fullName(row.lastPayment.receivedBy) })}`}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Annulation possible meme quand l'eleve n'est plus "paye" (ex. paye la serie 1, doit la 2) */}
                    {row.lastPayment && !paid && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t('payments.cancelLast')}
                        aria-label={t('payments.cancelLast')}
                        onClick={() => setToCancel(row)}
                      >
                        <Undo2 />
                      </Button>
                    )}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={paid}
                      aria-label={fullName(row.student.user)}
                      disabled={busy}
                      onClick={() => (paid ? setToCancel(row) : onPay(row))}
                      className="rounded-full outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:opacity-60"
                    >
                      <StatusSwitch
                        on={paid}
                        onLabel={t('payments.paid')}
                        offLabel={row.state === 'DUE' ? t('payments.due') : t('payments.pending')}
                      />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={toCancel !== null}
        onOpenChange={(open) => !open && setToCancel(null)}
        title={t('payments.cancelTitle')}
        description={
          toCancel?.lastPayment
            ? t('payments.cancelText', { name: fullName(toCancel.student.user), number: toCancel.lastPayment.number })
            : undefined
        }
        confirmLabel={t('payments.cancelConfirm')}
        destructive
        onConfirm={() => {
          if (toCancel) onCancel(toCancel)
          setToCancel(null)
        }}
      />
    </>
  )
}
