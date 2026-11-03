import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { PersonName } from '@/core/api/types'

export interface TeacherGroup {
  id: string
  name: string
  level: string
  section: string
  subject: string
  capacity: number
  monthlySessions: number
  _count: { students: number }
}

export interface TeacherGroupDetail extends Omit<TeacherGroup, '_count'> {
  students: { student: { id: string; level: string; section: string; user: PersonName } }[]
}

const KEY = ['teacher'] as const

export const useMyGroups = () =>
  useQuery({
    queryKey: [...KEY, 'groups'],
    queryFn: () => api.get<TeacherGroup[]>('/teacher/groups').then((r) => r.data),
  })

export const useMyGroup = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'groups', id],
    queryFn: () => api.get<TeacherGroupDetail>(`/teacher/groups/${id}`).then((r) => r.data),
  })
