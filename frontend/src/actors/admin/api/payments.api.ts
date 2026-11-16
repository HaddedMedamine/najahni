import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Earnings, GroupPayments, PaymentsOverview } from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

const KEY = [ADMIN_KEY, 'payments'] as const

export const usePaymentsOverview = (teacherId?: string) =>
  useQuery({
    queryKey: [...KEY, 'overview', teacherId],
    queryFn: () => api.get<PaymentsOverview>('/admin/payments', { params: { teacherId } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

/** month = "AAAA-MM" */
export const useEarnings = (month: string, teacherId?: string) =>
  useQuery({
    queryKey: [...KEY, 'earnings', month, teacherId],
    queryFn: () => api.get<Earnings>('/admin/payments/earnings', { params: { month, teacherId } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useGroupPayments = (groupId: string) =>
  useQuery({
    queryKey: [...KEY, 'group', groupId],
    queryFn: () => api.get<GroupPayments>(`/admin/payments/groups/${groupId}`).then((r) => r.data),
  })

export const useTogglePayment = () =>
  useAdminMutation(({ groupId, studentId, series }: { groupId: string; studentId: string; series: number | null }) => {
    const url = `/admin/payments/groups/${groupId}/students/${studentId}/pay`
    return (series !== null ? api.post(url, { series }) : api.delete(url)).then((r) => r.data as { changed: boolean; number: number | null })
  })
