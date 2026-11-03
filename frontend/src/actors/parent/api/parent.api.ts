import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type {
  AttendanceHistory,
  DateRange,
  PersonName,
  StudentPayments,
  StudentSession,
  UserSummary,
} from '@/core/api/types'

export interface Child {
  id: string
  level: string
  section: string
  archivedAt: string | null
  relationship: string | null
  user: PersonName
  groups: { group: { id: string; name: string; subject: string } }[]
}

export interface ChildDetail {
  id: string
  level: string
  section: string
  user: UserSummary
  groups: {
    group: { id: string; name: string; subject: string; teacher: { user: PersonName } }
  }[]
}

const KEY = ['parent', 'children'] as const

export const useMyChildren = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Child[]>('/parent/children').then((r) => r.data),
  })

export const useChildSessions = (id: string, range: DateRange) =>
  useQuery({
    queryKey: [...KEY, id, 'sessions', range],
    queryFn: () =>
      api.get<StudentSession[]>(`/parent/children/${id}/sessions`, { params: range }).then((r) => r.data),
  })

export const useChildAttendance = (id: string) =>
  useQuery({
    queryKey: [...KEY, id, 'attendance'],
    queryFn: () => api.get<AttendanceHistory>(`/parent/children/${id}/attendance`).then((r) => r.data),
  })

export const useChildPayments = (id: string) =>
  useQuery({
    queryKey: [...KEY, id, 'payments'],
    queryFn: () => api.get<StudentPayments>(`/parent/children/${id}/payments`).then((r) => r.data),
  })

export const useChild = (id: string) =>
  useQuery({
    queryKey: [...KEY, id],
    queryFn: () => api.get<ChildDetail>(`/parent/children/${id}`).then((r) => r.data),
  })
