import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { ListParams, Page, PersonName, UserSummary } from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

export interface Group {
  id: string
  name: string
  level: string
  section: string
  subject: string
  teacherId: string
  monthlySessions: number
  monthlyFee: string
  capacity: number
  archivedAt: string | null
}

export interface GroupListItem extends Group {
  teacher: { id: string; user: PersonName }
  _count: { students: number }
}

export interface GroupDetail extends Group {
  teacher: { id: string; user: UserSummary }
  students: {
    joinedAt: string
    student: { id: string; level: string; section: string; user: UserSummary }
  }[]
  /** Seances terminees. */
  _count: { sessions: number }
}

export interface GroupInput {
  name: string
  level: string
  section: string
  subject: string
  teacherId: string
  monthlySessions: number
  monthlyFee: number
  capacity: number
}

export interface GroupListParams extends ListParams {
  level?: string
  section?: string
  teacherId?: string
}

const KEY = [ADMIN_KEY, 'groups'] as const

export const useGroups = (params: GroupListParams) =>
  useQuery({
    queryKey: [...KEY, 'list', params],
    queryFn: () =>
      api.get<Page<GroupListItem>>('/admin/groups', { params }).then((r) => r.data),
    placeholderData: keepPreviousData,
  })

export const useGroup = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api.get<GroupDetail>(`/admin/groups/${id}`).then((r) => r.data),
  })

export const useCreateGroup = () =>
  useAdminMutation((input: GroupInput) =>
    api.post<GroupDetail>('/admin/groups', input).then((r) => r.data),
  )

export const useUpdateGroup = () =>
  useAdminMutation(({ id, ...input }: Partial<GroupInput> & { id: string }) =>
    api.patch<GroupDetail>(`/admin/groups/${id}`, input).then((r) => r.data),
  )

export const useArchiveGroup = () =>
  useAdminMutation(({ id, archived }: { id: string; archived: boolean }) =>
    api.post(`/admin/groups/${id}/${archived ? 'archive' : 'restore'}`),
  )

export const useDeleteGroup = () =>
  useAdminMutation((id: string) => api.delete(`/admin/groups/${id}`))

export const useAddGroupStudents = () =>
  useAdminMutation(({ id, studentIds }: { id: string; studentIds: string[] }) =>
    api
      .post<{ added: number }>(`/admin/groups/${id}/students`, { studentIds })
      .then((r) => r.data),
  )

export const useRemoveGroupStudent = () =>
  useAdminMutation(({ id, studentId }: { id: string; studentId: string }) =>
    api.delete(`/admin/groups/${id}/students/${studentId}`),
  )
