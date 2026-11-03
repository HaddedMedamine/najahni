import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type {
  AccountInput,
  ListParams,
  Page,
  PersonName,
  UserSummary,
  WithTemporaryPassword,
} from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

export interface StudentListItem {
  id: string
  level: string
  section: string
  parentPhone: string | null
  monthlyFee: string | null
  birthDate: string | null
  archivedAt: string | null
  user: UserSummary
  groups: { group: { id: string; name: string } }[]
}

export interface StudentDetail extends Omit<StudentListItem, 'groups'> {
  parents: {
    relationship: string | null
    parent: { id: string; user: UserSummary }
  }[]
  groups: {
    joinedAt: string
    group: { id: string; name: string; subject: string; monthlyFee: string }
  }[]
}

export interface StudentInput extends AccountInput {
  level: string
  section: string
  parentPhone?: string
  monthlyFee?: number
  birthDate?: string
  groupIds?: string[]
  parentIds?: string[]
}

export type StudentUpdate = Partial<Omit<StudentInput, 'password' | 'groupIds' | 'parentIds'>>

export interface StudentListParams extends ListParams {
  level?: string
  section?: string
  groupId?: string
}

/** Eleve tel qu'il apparait dans d'autres ressources (groupe, parent). */
export interface StudentRef {
  id: string
  level: string
  section: string
  user: PersonName
}

const KEY = [ADMIN_KEY, 'students'] as const

export const useStudents = (params: StudentListParams) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () =>
      api.get<Page<StudentListItem>>('/admin/students', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useStudent = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api.get<StudentDetail>(`/admin/students/${id}`).then((r) => r.data),
  })

export const useCreateStudent = () =>
  useAdminMutation((input: StudentInput) =>
    api
      .post<WithTemporaryPassword<StudentDetail>>('/admin/students', input)
      .then((r) => r.data),
  )

export const useUpdateStudent = () =>
  useAdminMutation(({ id, ...input }: StudentUpdate & { id: string }) =>
    api.patch<StudentDetail>(`/admin/students/${id}`, input).then((r) => r.data),
  )

export const useArchiveStudent = () =>
  useAdminMutation(({ id, archived }: { id: string; archived: boolean }) =>
    api.post(`/admin/students/${id}/${archived ? 'archive' : 'restore'}`),
  )

export const useDeleteStudent = () =>
  useAdminMutation((id: string) => api.delete(`/admin/students/${id}`))
