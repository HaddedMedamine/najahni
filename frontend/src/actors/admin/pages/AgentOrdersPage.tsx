import { Ban, BookOpen, Check, Truck } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type AgentOrder, type AgentOrderStatus, useAgentOrders, useSetOrderStatus } from '../api/agent.api'
import { AgentInbox } from '../components/AgentInbox'

const STATUS_BADGE = { NEW: 'primary', CONFIRMED: 'warning', DELIVERED: 'success', CANCELLED: 'default' } as const
const FILTERS: AgentOrderStatus[] = ['NEW', 'CONFIRMED', 'DELIVERED', 'CANCELLED']

/** Les commandes de livres prises par l'agent. */
export function AgentOrdersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<AgentOrderStatus | undefined>('NEW')
  const query = useAgentOrders({ page, status })
  const setOrder = useSetOrderStatus()

  const action = (order: AgentOrder, next: AgentOrderStatus, label: string, icon: typeof Check, ghost = false) => {
    const Icon = icon
    return (
      <Button
        variant={ghost ? 'ghost' : 'outline'}
        size="sm"
        loading={setOrder.isPending && setOrder.variables?.id === order.id && setOrder.variables.status === next}
        onClick={() => setOrder.mutate({ id: order.id, status: next })}
      >
        <Icon />
        {label}
      </Button>
    )
  }

  return (
    <>
      <PageHeader title={t('agent.ordersTitle')} description={t('agent.ordersSubtitle')} />
      <AgentInbox
        title={t('agent.ordersList')}
        empty={t('agent.noOrders')}
        icon={BookOpen}
        filters={FILTERS}
        filter={status}
        onFilter={(f) => {
          setStatus(f)
          setPage(1)
        }}
        statusLabel={(s) => t(`agent.orderStatus.${s}`)}
        query={query}
        page={page}
        onPage={setPage}
        badges={(order) => <Badge variant={STATUS_BADGE[order.status]}>{t(`agent.orderStatus.${order.status}`)}</Badge>}
        body={(order) => (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-muted/50 px-3 py-2 text-sm">
            <dt className="font-medium text-muted-foreground">{t('agent.books')}</dt>
            <dd className="whitespace-pre-line">{order.items}</dd>
            <dt className="font-medium text-muted-foreground">{t('agent.location')}</dt>
            <dd className="whitespace-pre-line">{order.location}</dd>
          </dl>
        )}
        actions={(order) => (
          <>
            {order.status === 'NEW' && action(order, 'CONFIRMED', t('agent.markConfirmed'), Check)}
            {order.status === 'CONFIRMED' && action(order, 'DELIVERED', t('agent.markDelivered'), Truck)}
            {(order.status === 'NEW' || order.status === 'CONFIRMED') &&
              action(order, 'CANCELLED', t('agent.markCancelled'), Ban, true)}
          </>
        )}
      />
    </>
  )
}
