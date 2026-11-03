import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { AttendanceHistory, DateRange, Exercise, PersonName, StudentSession } from '@/core/api/types'

export interface StudentGroup {
  id: string
  name: string
  subject: string
  joinedAt: string
  teacher: { user: PersonName }
}

const KEY = ['student'] as const

export const useMyStudentGroups = () =>
  useQuery({
    queryKey: [...KEY, 'groups'],
    queryFn: () => api.get<StudentGroup[]>('/student/groups').then((r) => r.data),
  })

export const useMyStudentSessions = (range: DateRange | null) =>
  useQuery({
    queryKey: [...KEY, 'sessions', range],
    queryFn: () => api.get<StudentSession[]>('/student/sessions', { params: range }).then((r) => r.data),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

export const useMyExercises = () =>
  useQuery({
    queryKey: [...KEY, 'exercises'],
    queryFn: () => api.get<Exercise[]>('/student/exercises').then((r) => r.data),
  })

export const studentFileUrl = (exerciseId: string, fileId: string) => `/student/exercises/${exerciseId}/files/${fileId}`

export const useMyAttendance = () =>
  useQuery({
    queryKey: [...KEY, 'attendance'],
    queryFn: () => api.get<AttendanceHistory>('/student/attendance').then((r) => r.data),
  })
