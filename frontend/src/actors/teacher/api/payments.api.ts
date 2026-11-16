import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Earnings, GroupPayments, GroupSheet, PaymentsOverview } from '@/core/api/types'

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

/** month = "AAAA-MM", absent = depuis le debut */
export const useTeacherGroupSheet = (groupId: string, month?: string) =>
  useQuery({
    queryKey: [...KEY, 'sheet', groupId, month],
    queryFn: () => api.get<GroupSheet>(`/teacher/payments/groups/${groupId}/sheet`, { params: { month } }).then((r) => r.data),
    enabled: Boolean(groupId),
    // Changer de mois garde la liste a l'ecran ; changer de groupe non
    placeholderData: (previous) => (previous?.group.id === groupId ? previous : undefined),
  })

export interface TogglePayment {
  groupId: string
  studentId: string
  /** Serie que l'eleve paie ; null = annuler son dernier paiement */
  series: number | null
}

export function useTeacherTogglePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ groupId, studentId, series }: TogglePayment) => {
      const url = `/teacher/payments/groups/${groupId}/students/${studentId}/pay`
      return (series !== null ? api.post(url, { series }) : api.delete(url)).then((r) => r.data as { changed: boolean; number: number | null })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
