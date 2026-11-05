import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { CodingStudentDetail, CodingStudentRow } from '@/components/shared/coding/types'

const KEY = ['teacher', 'coding'] as const

export const useTeacherCodingStudents = () =>
  useQuery({
    queryKey: [...KEY, 'students'],
    queryFn: () => api.get<CodingStudentRow[]>('/teacher/coding/students').then((r) => r.data),
  })

export const useTeacherCodingStudent = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'students', id],
    queryFn: () => api.get<CodingStudentDetail>(`/teacher/coding/students/${id}`).then((r) => r.data),
  })
