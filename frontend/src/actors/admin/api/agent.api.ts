import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Page } from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

export type AgentChannel = 'WHATSAPP' | 'PHONE'
export type AgentLeadReason = 'QUESTION' | 'ABSENCE' | 'PAYMENT'
export type AgentLeadStatus = 'NEW' | 'CALLED' | 'DONE'
export type AgentOrderStatus = 'NEW' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED'

interface AgentContact {
  id: string
  name: string
  phone: string
  channel: AgentChannel
  createdAt: string
}

export interface AgentLead extends AgentContact {
  reason: AgentLeadReason
  question: string
  status: AgentLeadStatus
}

export interface AgentOrder extends AgentContact {
  location: string
  items: string
  status: AgentOrderStatus
}

const KEY = [ADMIN_KEY, 'agent'] as const

interface ListParams<S> {
  page: number
  status?: S
}

/** L'agent ajoute des lignes pendant que la page est ouverte. */
const list = <T, S>(path: string, params: ListParams<S>) => ({
  queryKey: [...KEY, path, params],
  queryFn: () => api.get<Page<T>>(`/admin/agent/${path}`, { params: { ...params, pageSize: 20 } }).then((r) => r.data),
  placeholderData: keepPreviousData,
  refetchInterval: 15_000,
})

export const useAgentLeads = (params: ListParams<AgentLeadStatus>) =>
  useQuery(list<AgentLead, AgentLeadStatus>('leads', params))

export const useAgentOrders = (params: ListParams<AgentOrderStatus>) =>
  useQuery(list<AgentOrder, AgentOrderStatus>('orders', params))

export const useSetLeadStatus = () =>
  useAdminMutation(({ id, status }: { id: string; status: AgentLeadStatus }) =>
    api.patch(`/admin/agent/leads/${id}`, { status }).then((r) => r.data),
  )

export const useSetOrderStatus = () =>
  useAdminMutation(({ id, status }: { id: string; status: AgentOrderStatus }) =>
    api.patch(`/admin/agent/orders/${id}`, { status }).then((r) => r.data),
  )
