import { useQuery } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { CodingStudentDetail, CodingStudentRow } from '@/components/shared/coding/types'
import { ADMIN_KEY } from './shared'

const KEY = [ADMIN_KEY, 'coding'] as const

export const useCodingStudents = () =>
  useQuery({
    queryKey: [...KEY, 'students'],
    queryFn: () => api.get<CodingStudentRow[]>('/admin/coding/students').then((r) => r.data),
  })

export const useCodingStudent = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'students', id],
    queryFn: () => api.get<CodingStudentDetail>(`/admin/coding/students/${id}`).then((r) => r.data),
  })
