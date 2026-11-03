import { Ban, MessageCircle, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { NotificationStatus, WhatsappMessage } from '@/core/api/types'
import { formatDateTime } from '@/core/lib/format'
import { cn } from '@/core/lib/utils'
import { useCancelMessage, useRetryMessage, useWhatsappMessages } from '../../api/whatsapp.api'

const STATUS_BADGE = {
  PENDING: 'primary',
  SENT: 'success',
  FAILED: 'danger',
  CANCELLED: 'default',
} as const

const FILTERS: (NotificationStatus | undefined)[] = [undefined, 'PENDING', 'SENT', 'FAILED', 'CANCELLED']

/** Historique des messages WhatsApp : en attente, envoyes, echoues, annules. */
export function WhatsappMessagesCard() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<NotificationStatus | undefined>()
  const query = useWhatsappMessages({ page, status })
  const retry = useRetryMessage()
  const cancel = useCancelMessage()

  const statusLabel: Record<NotificationStatus, string> = {
    PENDING: t('whatsapp.status.PENDING'),
    SENT: t('whatsapp.status.SENT'),
    FAILED: t('whatsapp.status.FAILED'),
    CANCELLED: t('whatsapp.status.CANCELLED'),
  }
  const typeLabel = {
    absence: t('whatsapp.type.absence'),
    payment_reminder: t('whatsapp.type.payment_reminder'),
    password_reset: t('whatsapp.type.password_reset'),
    test: t('whatsapp.type.test'),
  }

  const when = (m: WhatsappMessage) =>
    m.status === 'SENT' && m.sentAt
      ? t('whatsapp.sentAt', { date: formatDateTime(m.sentAt) })
      : m.status === 'PENDING'
        ? t('whatsapp.scheduledAt', { date: formatDateTime(m.scheduledAt) })
        : formatDateTime(m.scheduledAt)

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{t('whatsapp.history')}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f ?? 'all'}
              type="button"
              onClick={() => {
                setStatus(f)
                setPage(1)
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                status === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary-soft',
              )}
            >
              {f ? statusLabel[f] : t('whatsapp.all')}
            </button>
          ))}
        </div>
      </CardHeader>

      {query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : query.isLoading || !query.data ? (
        <TableSkeleton rows={4} />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon={MessageCircle} title={t('whatsapp.noMessages')} />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {query.data.items.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_BADGE[m.status]}>{statusLabel[m.status]}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">{typeLabel[m.type] ?? m.type}</span>
                    <span className="text-sm font-medium">{m.recipient}</span>
                    {m.phone && (
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {m.phone}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-line rounded-xl bg-muted/50 px-3 py-2 text-sm">{m.content}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {when(m)}
                    {m.error && <span className={cn(m.status === 'FAILED' && 'text-danger')}> · {m.error}</span>}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {(m.status === 'FAILED' || m.status === 'CANCELLED') && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={retry.isPending && retry.variables === m.id}
                      onClick={() => retry.mutate(m.id)}
                    >
                      <RotateCcw />
                      {t('whatsapp.retry')}
                    </Button>
                  )}
                  {m.status === 'PENDING' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={cancel.isPending && cancel.variables === m.id}
                      onClick={() => cancel.mutate(m.id)}
                    >
                      <Ban />
                      {t('whatsapp.cancel')}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pagination page={page} pageSize={query.data.pageSize} total={query.data.total} onChange={setPage} />
        </>
      )}
    </Card>
  )
}
