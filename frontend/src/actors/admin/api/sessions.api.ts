import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { AttendanceStatus, DateRange, PersonName, SessionStatus } from '@/core/api/types'
import { ADMIN_KEY, useAdminMutation } from './shared'

export interface SessionItem {
  id: string
  groupId: string
  teacherId: string
  roomId: string | null
  seriesId: string | null
  startsAt: string
  endsAt: string
  status: SessionStatus
  isOnline: boolean
  meetingUrl: string | null
  contentCovered: string | null
  homework: string | null
  group: { id: string; name: string; subject: string; level: string; section: string }
  teacher: { id: string; user: PersonName }
  room: { id: string; name: string } | null
  _count: { attendances: number }
}

export interface SessionDetail extends SessionItem {
  attendances: {
    status: AttendanceStatus
    note: string | null
    student: { id: string; user: PersonName }
  }[]
}

export interface SessionFilters {
  groupId?: string
  teacherId?: string
  roomId?: string
}

export interface SessionInput {
  groupId: string
  startsAt: string
  endsAt: string
  roomId?: string
  teacherId?: string
  isOnline?: boolean
  meetingUrl?: string
  repeatWeeks?: number
}

const KEY = [ADMIN_KEY, 'sessions'] as const

export const useSessions = (range: DateRange | null, filters: SessionFilters) =>
  useQuery({
    queryKey: [...KEY, 'list', range, filters],
    queryFn: () =>
      api.get<SessionItem[]>('/admin/sessions', { params: { ...range, ...filters } }).then((r) => r.data),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

export const useSession = (id: string | null) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api.get<SessionDetail>(`/admin/sessions/${id}`).then((r) => r.data),
    enabled: id !== null,
  })

export const useCreateSession = () =>
  useAdminMutation((input: SessionInput) =>
    api.post<SessionItem[]>('/admin/sessions', input).then((r) => r.data),
  )

export const useMoveSession = () =>
  useAdminMutation(
    ({ id, ...input }: { id: string; startsAt?: string; endsAt?: string; roomId?: string | null }) =>
      api.patch<SessionItem>(`/admin/sessions/${id}`, input).then((r) => r.data),
  )

export const useCancelSession = () =>
  useAdminMutation((id: string) => api.post(`/admin/sessions/${id}/cancel`))

export const useDeleteSession = () =>
  useAdminMutation(({ id, scope }: { id: string; scope: 'one' | 'following' }) =>
    api
      .delete<{ deleted: number }>(`/admin/sessions/${id}`, { params: { scope } })
      .then((r) => r.data),
  )
