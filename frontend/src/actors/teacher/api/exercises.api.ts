import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { Exercise } from '@/core/api/types'

const KEY = ['teacher', 'exercises'] as const

export const useMyExercises = () =>
  useQuery({
    queryKey: KEY,
    queryFn: () => api.get<Exercise[]>('/teacher/exercises').then((r) => r.data),
  })

export interface ExerciseInput {
  title: string
  description: string
  level: string
  groupIds: string[]
  files: File[]
  /** Progression de l'envoi (0 a 100) */
  onProgress?: (percent: number) => void
}

export function useCreateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ files, groupIds, onProgress, ...fields }: ExerciseInput) => {
      const body = new FormData()
      Object.entries(fields).forEach(([k, v]) => v && body.append(k, v))
      groupIds.forEach((id) => body.append('groupIds', id))
      files.forEach((f) => body.append('files', f))
      return api
        .post<Exercise>('/teacher/exercises', body, {
          onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
        })
        .then((r) => r.data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; title: string; description: string; groupIds: string[] }) =>
      api.patch<Exercise>(`/teacher/exercises/${id}`, input).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteExercise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/teacher/exercises/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export const teacherFileUrl = (exerciseId: string, fileId: string) => `/teacher/exercises/${exerciseId}/files/${fileId}`
