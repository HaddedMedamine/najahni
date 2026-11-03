import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/core/api/client'
import type { AttendanceStatus, DateRange, PersonName, SessionStatus } from '@/core/api/types'

export interface TeacherSession {
  id: string
  groupId: string
  startsAt: string
  endsAt: string
  status: SessionStatus
  isOnline: boolean
  meetingUrl: string | null
  group: { id: string; name: string; subject: string }
  room: { id: string; name: string } | null
  _count: { attendances: number }
}

export interface RosterEntry {
  student: { id: string; user: PersonName }
  attendance: { status: AttendanceStatus; note: string | null } | null
}

export interface TeacherSessionDetail extends Omit<TeacherSession, '_count'> {
  contentCovered: string | null
  homework: string | null
  startedAt: string | null
  endedAt: string | null
  group: { id: string; name: string; subject: string; level: string; section: string }
  roster: RosterEntry[]
}

/** Eleve present qui vient de terminer sa serie de N seances. */
export interface CompletedSeries {
  student: { id: string; user: PersonName }
  number: number
}

const KEY = ['teacher', 'sessions'] as const

export const useTeacherSessions = (range: DateRange | null) =>
  useQuery({
    queryKey: [...KEY, 'list', range],
    queryFn: () => api.get<TeacherSession[]>('/teacher/sessions', { params: range }).then((r) => r.data),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  })

export const useTeacherSession = (id: string) =>
  useQuery({
    queryKey: [...KEY, 'detail', id],
    queryFn: () => api.get<TeacherSessionDetail>(`/teacher/sessions/${id}`).then((r) => r.data),
  })

/** Les mutations renvoient la seance a jour : on la met directement dans le cache. */
function useSessionMutation<TVariables>(
  id: string,
  request: (variables: TVariables) => Promise<TeacherSessionDetail>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: (session) => {
      queryClient.setQueryData([...KEY, 'detail', id], session)
      void queryClient.invalidateQueries({ queryKey: [...KEY, 'list'] })
    },
  })
}

export const useStartSession = (id: string) =>
  useSessionMutation(id, () =>
    api.post<TeacherSessionDetail>(`/teacher/sessions/${id}/start`).then((r) => r.data),
  )

export const useMarkAttendance = (id: string) =>
  useSessionMutation(id, (records: { studentId: string; status: AttendanceStatus }[]) =>
    api.put<TeacherSessionDetail>(`/teacher/sessions/${id}/attendance`, { records }).then((r) => r.data),
  )

export const useSaveNotes = (id: string) =>
  useSessionMutation(id, (notes: { contentCovered?: string; homework?: string }) =>
    api.patch<TeacherSessionDetail>(`/teacher/sessions/${id}/notes`, notes).then((r) => r.data),
  )

export function useCompleteSession(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api
        .post<{ session: TeacherSessionDetail; completedSeries: CompletedSeries[] }>(
          `/teacher/sessions/${id}/complete`,
        )
        .then((r) => r.data),
    onSuccess: ({ session }) => {
      queryClient.setQueryData([...KEY, 'detail', id], session)
      void queryClient.invalidateQueries({ queryKey: [...KEY, 'list'] })
      // Les series des eleves ont avance : le tableau des paiements change
      void queryClient.invalidateQueries({ queryKey: ['teacher', 'payments'] })
    },
  })
}
