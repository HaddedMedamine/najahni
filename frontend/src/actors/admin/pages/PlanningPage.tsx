import { Info, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Calendar, sessionEvent } from '@/components/shared/Calendar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select } from '@/components/ui/input'
import type { DateRange } from '@/core/api/types'
import { fullName } from '@/core/lib/utils'
import { useGroups } from '../api/groups.api'
import { useRooms } from '../api/rooms.api'
import { type SessionFilters, useMoveSession, useSessions } from '../api/sessions.api'
import { useTeachers } from '../api/teachers.api'
import { SessionDetailDialog } from '../components/SessionDetailDialog'
import { SessionFormDialog } from '../components/SessionFormDialog'

export function PlanningPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange | null>(null)
  const [filters, setFilters] = useState<SessionFilters>({})
  const [slot, setSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const sessions = useSessions(range, filters)
  const groups = useGroups({ pageSize: 100 })
  const teachers = useTeachers({ pageSize: 100 })
  const rooms = useRooms()
  const move = useMoveSession()

  const events = useMemo(
    () =>
      (sessions.data ?? []).map((s) =>
        sessionEvent({
          id: s.id,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: s.status,
          title: s.group.name,
          subtitle: [s.room?.name, fullName(s.teacher.user)].filter(Boolean).join(' · '),
          colorKey: s.groupId,
          editable: true,
        }),
      ),
    [sessions.data],
  )

  const setFilter = (key: keyof SessionFilters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value || undefined }))

  const openForm = (selection: { start: Date; end: Date } | null) => {
    setSlot(selection)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title={t('planning.title')}
        description={t('planning.subtitle')}
        actions={
          <Button onClick={() => openForm(null)}>
            <Plus />
            {t('planning.newSession')}
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row">
        <Select value={filters.groupId ?? ''} onChange={(e) => setFilter('groupId', e.target.value)}>
          <option value="">{t('planning.allGroups')}</option>
          {groups.data?.items.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <Select value={filters.teacherId ?? ''} onChange={(e) => setFilter('teacherId', e.target.value)}>
          <option value="">{t('planning.allTeachers')}</option>
          {teachers.data?.items.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {fullName(teacher.user)}
            </option>
          ))}
        </Select>
        <Select value={filters.roomId ?? ''} onChange={(e) => setFilter('roomId', e.target.value)}>
          <option value="">{t('planning.allRooms')}</option>
          {rooms.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Card>

      <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        {t('planning.hint')}
      </p>

      <Card className="p-3 sm:p-4">
        <Calendar
          events={events}
          onRangeChange={setRange}
          onEventClick={setSelectedId}
          onSelectSlot={(start, end) => openForm({ start, end })}
          onEventMove={(id, start, end, revert) =>
            move.mutate(
              { id, startsAt: start.toISOString(), endsAt: end.toISOString() },
              {
                onSuccess: () => toast.success(t('planning.moved')),
                // Conflit ou erreur : la seance reprend sa place (le message s'affiche en toast)
                onError: revert,
              },
            )
          }
        />
      </Card>

      <SessionFormDialog open={formOpen} onOpenChange={setFormOpen} slot={slot} defaultGroupId={filters.groupId} />
      <SessionDetailDialog sessionId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  )
}
