import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { NotificationStatus, NotificationType, Page, WhatsappMessage, WhatsappStatus } from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

const KEY = [ADMIN_KEY, 'whatsapp'] as const

/** Etat de la connexion : rafraichi souvent pendant l'affichage du QR code. */
export const useWhatsappStatus = () =>
  useQuery({
    queryKey: [...KEY, 'status'],
    queryFn: () => api.get<WhatsappStatus>('/admin/whatsapp').then((r) => r.data),
    refetchInterval: (query) => {
      const state = query.state.data?.state
      return state === 'QR' || state === 'CONNECTING' ? 2_000 : 15_000
    },
  })

export interface MessagesParams {
  page: number
  status?: NotificationStatus
  type?: NotificationType
}

export const useWhatsappMessages = (params: MessagesParams) =>
  useQuery({
    queryKey: [...KEY, 'messages', params],
    queryFn: () =>
      api.get<Page<WhatsappMessage>>('/admin/whatsapp/messages', { params: { ...params, pageSize: 20 } }).then((r) => r.data),
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
  })

export const useWhatsappConnect = () =>
  useAdminMutation(() => api.post<WhatsappStatus>('/admin/whatsapp/connect').then((r) => r.data))

export const useWhatsappLogout = () =>
  useAdminMutation(() => api.post<WhatsappStatus>('/admin/whatsapp/logout').then((r) => r.data))

export const useWhatsappTest = () =>
  useAdminMutation((phone: string) => api.post('/admin/whatsapp/test', { phone }).then((r) => r.data))

export const useRetryMessage = () =>
  useAdminMutation((id: string) => api.post(`/admin/whatsapp/messages/${id}/retry`).then((r) => r.data))

export const useCancelMessage = () =>
  useAdminMutation((id: string) => api.post(`/admin/whatsapp/messages/${id}/cancel`).then((r) => r.data))
