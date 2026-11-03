import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type {
  AccountInput,
  ListParams,
  Page,
  UserSummary,
  WithTemporaryPassword,
} from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'
import type { StudentRef } from './students.api'

export interface ParentItem {
  id: string
  user: UserSummary
  children: { relationship: string | null; student: StudentRef }[]
}

export interface ParentInput extends AccountInput {
  studentIds?: string[]
}

export type ParentUpdate = Partial<Omit<ParentInput, 'password' | 'studentIds'>> & {
  isActive?: boolean
}

const KEY = [ADMIN_KEY, 'parents'] as const

export const useParents = (params: ListParams) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () =>
      api.get<Page<ParentItem>>('/admin/parents', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useCreateParent = () =>
  useAdminMutation((input: ParentInput) =>
    api
      .post<WithTemporaryPassword<ParentItem>>('/admin/parents', input)
      .then((r) => r.data),
  )

export const useUpdateParent = () =>
  useAdminMutation(({ id, ...input }: ParentUpdate & { id: string }) =>
    api.patch<ParentItem>(`/admin/parents/${id}`, input).then((r) => r.data),
  )

export const useDeleteParent = () =>
  useAdminMutation((id: string) => api.delete(`/admin/parents/${id}`))

export const useLinkChild = () =>
  useAdminMutation(
    ({ id, ...input }: { id: string; studentId: string; relationship?: string }) =>
      api.post<ParentItem>(`/admin/parents/${id}/children`, input).then((r) => r.data),
  )

export const useUnlinkChild = () =>
  useAdminMutation(({ id, studentId }: { id: string; studentId: string }) =>
    api.delete(`/admin/parents/${id}/children/${studentId}`),
  )
