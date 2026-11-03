import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type {
  AccountInput,
  ListParams,
  Page,
  UserSummary,
  WithTemporaryPassword,
} from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

export interface TeacherListItem {
  id: string
  subjects: string[]
  user: UserSummary
  _count: { groups: number }
}

export interface TeacherDetail extends Omit<TeacherListItem, '_count'> {
  groups: { id: string; name: string; subject: string; _count: { students: number } }[]
}

export interface TeacherInput extends AccountInput {
  subjects: string[]
}

export type TeacherUpdate = Partial<Omit<TeacherInput, 'password'>> & {
  isActive?: boolean
}

const KEY = [ADMIN_KEY, 'teachers'] as const

export const useTeachers = (params: ListParams) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () =>
      api.get<Page<TeacherListItem>>('/admin/teachers', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useCreateTeacher = () =>
  useAdminMutation((input: TeacherInput) =>
    api
      .post<WithTemporaryPassword<TeacherDetail>>('/admin/teachers', input)
      .then((r) => r.data),
  )

export const useUpdateTeacher = () =>
  useAdminMutation(({ id, ...input }: TeacherUpdate & { id: string }) =>
    api.patch<TeacherDetail>(`/admin/teachers/${id}`, input).then((r) => r.data),
  )

/** L'admin active son propre espace enseignant (meme compte). */
export function useEnableSelfTeacher() {
  const queryClient = useQueryClient()
  return useAdminMutation(async (subjects: string[]) => {
    const { data } = await api.post<TeacherDetail>('/admin/teachers/me', { subjects })
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    return data
  })
}

export const useDeleteTeacher = () =>
  useAdminMutation((id: string) => api.delete(`/admin/teachers/${id}`))
