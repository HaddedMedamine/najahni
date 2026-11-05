import { CalendarClock, ChevronRight, DoorOpen, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Calendar, groupColor, reservedEvent, sessionEvent } from '@/components/shared/Calendar'
import { PageHeader } from '@/components/shared/PageHeader'
import { PlanningPalette } from '@/components/shared/PlanningPalette'
import { type PendingDrop, RepeatDropDialog } from '@/components/shared/RepeatDropDialog'
import { SessionStatusBadge } from '@/components/shared/SessionBadges'
import { EmptyState } from '@/components/shared/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import type { DateRange } from '@/core/api/types'
import { nextDaysRange } from '@/core/lib/dates'
import { formatTime } from '@/core/lib/format'
import {
  useCreateTeacherSession,
  useRoomOccupancy,
  useTeacherRooms,
  useTeacherSessions,
  useUpdateTeacherSession,
} from '../api/sessions.api'
import { useMyGroups } from '../api/teacher.api'

export function TeacherPlanningPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [range, setRange] = useState<DateRange | null>(null)
  const [today] = useState(() => nextDaysRange(1))
  // Reservations affichees : '' = aucune, 'all' = toutes les salles, sinon l'id d'une salle
  const [roomView, setRoomView] = useState('')
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)
  const sessions = useTeacherSessions(range)
  const todaySessions = useTeacherSessions(today)
  const groups = useMyGroups()
  const rooms = useTeacherRooms()
  const occupancy = useRoomOccupancy(range, roomView !== '')
  const create = useCreateTeacherSession()
  const update = useUpdateTeacherSession()

  const events = useMemo(() => {
    const mine = (sessions.data ?? []).map((s) =>
      sessionEvent({
        id: s.id,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        status: s.status,
        title: s.group.name,
        subtitle: s.room?.name,
        colorKey: s.groupId,
        editable: true,
      }),
    )
    // Creneaux pris par les autres enseignants dans la (ou les) salle(s) choisie(s)
    const reserved = roomView
      ? (occupancy.data ?? [])
          .filter((r) => !r.mine && (roomView === 'all' || r.room.id === roomView))
          .map((r) =>
            reservedEvent({
              ...r,
              label: `${r.room.name} · ${t('planning.reserved')}`,
            }),
          )
      : []
    return [...mine, ...reserved]
  }, [sessions.data, occupancy.data, roomView, t])

  const roomName = (id: string) => rooms.data?.find((r) => r.id === id)?.name ?? ''

  return (
    <>
      <PageHeader title={t('planning.title')} />

      {/* Seances du jour : acces direct a l'appel */}
      <Card className="mb-6">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle>{t('planning.today')}</CardTitle>
        </CardHeader>
        {todaySessions.data && todaySessions.data.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t('planning.noSessionsToday')} />
        ) : (
          <ul className="divide-y divide-border">
            {todaySessions.data?.map((s) => (
              <li key={s.id}>
                <Link to={`/teacher/sessions/${s.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50">
                  <span className="h-10 w-1 rounded-full" style={{ background: groupColor(s.groupId) }} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.group.name}</p>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      {formatTime(s.startsAt)} – {formatTime(s.endsAt)}
                      {s.room && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="size-3.5" />
                          {s.room.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <SessionStatusBadge status={s.status} />
                  <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <PlanningPalette
          groups={(groups.data ?? []).map((g) => ({
            id: g.id,
            name: g.name,
            subtitle: [g.subject, g.level].filter(Boolean).join(' · '),
          }))}
          rooms={rooms.data ?? []}
        />

        <div className="flex min-w-0 flex-col gap-3">
          <Card className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
            <label htmlFor="roomView" className="flex items-center gap-2 text-sm font-medium sm:shrink-0">
              <DoorOpen className="size-4 text-muted-foreground" />
              {t('planning.roomsOccupancy')}
            </label>
            <Select id="roomView" value={roomView} onChange={(e) => setRoomView(e.target.value)}>
              <option value="">{t('planning.hideOccupancy')}</option>
              <option value="all">{t('planning.allRooms')}</option>
              {rooms.data?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </Card>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            {t('planning.teacherHint')}
          </p>

          <Card className="p-3 sm:p-4">
            <Calendar
              events={events}
              onRangeChange={setRange}
              onEventClick={(id) => navigate(`/teacher/sessions/${id}`)}
              onEventMove={(id, start, end, revert) =>
                update.mutate(
                  {
                    id,
                    startsAt: start.toISOString(),
                    endsAt: end.toISOString(),
                  },
                  // Conflit ou erreur : la seance reprend sa place (le message s'affiche en toast)
                  {
                    onSuccess: () => toast.success(t('planning.moved')),
                    onError: revert,
                  },
                )
              }
              onGroupDrop={(groupId, start, end) => {
                const group = groups.data?.find((g) => g.id === groupId)
                if (group)
                  setPendingDrop({
                    groupId,
                    groupName: group.name,
                    monthlySessions: group.monthlySessions,
                    start,
                    end,
                  })
              }}
              onRoomDrop={(id, roomId) =>
                update.mutate(
                  { id, roomId },
                  {
                    onSuccess: () => toast.success(t('planning.roomBooked', { room: roomName(roomId) })),
                  },
                )
              }
            />
          </Card>
        </div>
      </div>

      <RepeatDropDialog
        drop={pendingDrop}
        onClose={() => setPendingDrop(null)}
        loading={create.isPending}
        onConfirm={(weeks) =>
          pendingDrop &&
          create.mutate(
            {
              groupId: pendingDrop.groupId,
              startsAt: pendingDrop.start.toISOString(),
              endsAt: pendingDrop.end.toISOString(),
              repeatWeeks: weeks,
            },
            {
              onSuccess: (created) => {
                toast.success(t('planning.created', { count: created.length }))
                setPendingDrop(null)
              },
            },
          )
        }
      />
    </>
  )
}
