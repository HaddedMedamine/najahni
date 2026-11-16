import { type LucideIcon, MessageCircle, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { Page } from '@/core/api/types'
import { formatDateTime } from '@/core/lib/format'
import { cn } from '@/core/lib/utils'
import type { AgentChannel } from '../api/agent.api'

interface Row {
  id: string
  name: string
  phone: string
  channel: AgentChannel
  createdAt: string
}

interface Props<T extends Row, S extends string> {
  title: string
  empty: string
  icon: LucideIcon
  filters: S[]
  filter?: S
  onFilter: (status: S | undefined) => void
  statusLabel: (status: S) => string
  query: { data?: Page<T>; isError: boolean; isLoading: boolean; refetch: () => unknown }
  page: number
  onPage: (page: number) => void
  /** Motif, statut... a cote du nom. */
  badges: (row: T) => ReactNode
  body: (row: T) => ReactNode
  actions: (row: T) => ReactNode
}

/** Liste commune aux rappels et aux commandes : qui, quand, par quel canal, et quoi faire. */
export function AgentInbox<T extends Row, S extends string>(props: Props<T, S>) {
  const { query, filter, onFilter } = props
  const { t } = useTranslation()
  const chip = (active: boolean) =>
    cn(
      'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary-soft',
    )

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{props.title}</CardTitle>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={chip(filter === undefined)} onClick={() => onFilter(undefined)}>
            {t('agent.all')}
          </button>
          {props.filters.map((f) => (
            <button key={f} type="button" className={chip(filter === f)} onClick={() => onFilter(f)}>
              {props.statusLabel(f)}
            </button>
          ))}
        </div>
      </CardHeader>

      {query.isError ? (
        <ErrorState onRetry={query.refetch} />
      ) : query.isLoading || !query.data ? (
        <TableSkeleton rows={4} />
      ) : query.data.items.length === 0 ? (
        <EmptyState icon={props.icon} title={props.empty} />
      ) : (
        <>
          <ul className="divide-y divide-border">
            {query.data.items.map((row) => {
              const Channel = row.channel === 'PHONE' ? Phone : MessageCircle
              return (
                <li key={row.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {props.badges(row)}
                      <span className="text-sm font-semibold">{row.name}</span>
                      <a href={`tel:+${row.phone}`} dir="ltr" className="text-sm text-primary hover:underline">
                        +{row.phone}
                      </a>
                    </div>
                    <div className="mt-1.5">{props.body(row)}</div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Channel className="size-3.5" />
                      {t(`agent.channel.${row.channel}`)} · {formatDateTime(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">{props.actions(row)}</div>
                </li>
              )
            })}
          </ul>
          <Pagination page={props.page} pageSize={query.data.pageSize} total={query.data.total} onChange={props.onPage} />
        </>
      )}
    </Card>
  )
}
