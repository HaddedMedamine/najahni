import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Earnings, GroupPayments, PaymentsOverview } from '@/core/api/types'

const KEY = ['teacher', 'payments'] as const

export const useTeacherPayments = () =>
  useQuery({
    queryKey: [...KEY, 'overview'],
    queryFn: () => api.get<PaymentsOverview>('/teacher/payments').then((r) => r.data),
  })

/** month = "AAAA-MM" */
export const useTeacherEarnings = (month: string) =>
  useQuery({
    queryKey: [...KEY, 'earnings', month],
    queryFn: () => api.get<Earnings>('/teacher/payments/earnings', { params: { month } }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useTeacherGroupPayments = (groupId: string) =>
  useQuery({
    queryKey: [...KEY, 'group', groupId],
    queryFn: () => api.get<GroupPayments>(`/teacher/payments/groups/${groupId}`).then((r) => r.data),
  })

export interface TogglePayment {
  groupId: string
  studentId: string
  /** true = l'eleve paie ; false = annuler son dernier paiement */
  paid: boolean
}

export function useTeacherTogglePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, studentId, paid }: TogglePayment) => {
      const url = `/teacher/payments/groups/${groupId}/students/${studentId}/pay`
      return (paid ? api.post(url) : api.delete(url)).then((r) => r.data as { changed: boolean; number: number | null })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
