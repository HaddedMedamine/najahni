import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { CodeLanguage, CodeTrack, DoorData, GridData, StoryData } from '@/components/shared/coding/types'
import type { TdoRow } from '@/core/algo/transpile'

export interface CodingMapLevel {
  id: string
  slug: string
  title: string
  /** Portes du code : porte ou coffre. */
  scene: DoorData['scene'] | null
  unlocked: boolean
  stars: number
  attempts: number
  completed: boolean
}

export interface CodingChapter {
  id: string
  slug: string
  title: string
  description: string
  levels: CodingMapLevel[]
}

export interface CodingMap {
  track: CodeTrack | null
  games: { GRID: CodingChapter[]; PYTHON: CodingChapter[]; STORY: CodingChapter[] }
}

interface LevelBase {
  id: string
  slug: string
  title: string
  statement: string
  bitou: string
  starterCode: string
  hints: string[]
  chapter: { id: string; title: string }
  progress: {
    stars: number
    attempts: number
    completed: boolean
    lastCode: string | null
    language: CodeLanguage
    tdo: TdoRow[] | null
  }
  nextLevelId: string | null
}

export type CodingLevel =
  | (LevelBase & { kind: 'GRID'; data: GridData })
  | (LevelBase & { kind: 'PYTHON'; data: DoorData })
  | (LevelBase & { kind: 'STORY'; data: StoryData })

export interface AttemptResult {
  success: boolean
  stars: number
  bestStars: number
  firstSuccess: boolean
  attempts: number
}

export interface AttemptInput {
  code: string
  success: boolean
  language: CodeLanguage
  tdo?: TdoRow[]
}

const KEY = ['student', 'coding'] as const

export const useCodingMap = () =>
  useQuery({
    queryKey: [...KEY, 'map'],
    queryFn: () => api.get<CodingMap>('/student/coding').then((r) => r.data),
  })

export const useCodingLevel = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'level', id],
    queryFn: () => api.get<CodingLevel>(`/student/coding/levels/${id}`).then((r) => r.data),
  })

export function useCodeAttempt(levelId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AttemptInput) =>
      api.post<AttemptResult>(`/student/coding/levels/${levelId}/attempts`, input).then((r) => r.data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
