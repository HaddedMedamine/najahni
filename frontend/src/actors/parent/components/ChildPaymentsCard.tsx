import { Banknote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentPayments } from '@/core/api/types'
import { formatDate, formatMoney } from '@/core/lib/format'
import { cn } from '@/core/lib/utils'

const STATE_BADGE = { PAID: 'success', DUE: 'danger', PENDING: 'default' } as const

/** Paiements de l'enfant : situation dans chaque groupe + series deja payees. */
export function ChildPaymentsCard({ data }: { data: StudentPayments }) {
  const { t } = useTranslation()
  const stateLabel = { PAID: t('payments.paid'), DUE: t('payments.due'), PENDING: t('payments.pending') }

  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>{t('payments.history')}</CardTitle>
      </CardHeader>
      {data.groups.length === 0 ? (
        <EmptyState icon={Banknote} title={t('payments.none')} />
      ) : (
        <ul className="divide-y divide-border">
          {data.groups.map((g) => (
            <li key={g.group.id} className={cn('flex flex-col gap-1 px-5 py-3 text-sm', g.state === 'DUE' && 'bg-danger-soft/40')}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{g.group.subject}</span>
                <Badge variant={STATE_BADGE[g.state]}>{stateLabel[g.state]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('payments.seriesProgress', { number: g.series, progress: g.progress, size: g.size })} · {formatMoney(g.fee)}
              </p>
              {g.dueSeries.length > 0 && (
                <p className="text-xs font-semibold text-danger">
                  {t('payments.dueSeries', { list: g.dueSeries.join(', ') })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {data.history.length > 0 && (
        <>
          <p className="border-t border-border bg-muted/40 px-5 py-2 text-xs font-semibold text-muted-foreground">
            {t('payments.historyTitle')}
          </p>
          <ul className="divide-y divide-border">
            {data.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-xs">
                <span>
                  <span className="font-medium">{h.group.subject}</span> · {t('payments.series', { number: h.number })}
                </span>
                <span className="text-muted-foreground">
                  {formatMoney(h.amount)}
                  {h.payment && ` · ${formatDate(h.payment.paidAt)} · ${t('payments.receipt', { number: h.payment.receiptNumber })}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
