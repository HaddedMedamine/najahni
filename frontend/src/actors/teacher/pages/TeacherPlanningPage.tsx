import { CalendarClock, ChevronRight, DoorOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, groupColor, sessionEvent } from '@/components/shared/Calendar'
import { PageHeader } from '@/components/shared/PageHeader'
import { SessionStatusBadge } from '@/components/shared/SessionBadges'
import { EmptyState } from '@/components/shared/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { DateRange } from '@/core/api/types'
import { nextDaysRange } from '@/core/lib/dates'
import { formatTime } from '@/core/lib/format'
import { useTeacherSessions } from '../api/sessions.api'

export function TeacherPlanningPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [range, setRange] = useState<DateRange | null>(null)
  const [today] = useState(() => nextDaysRange(1))
  const sessions = useTeacherSessions(range)
  const todaySessions = useTeacherSessions(today)

  const events = useMemo(
    () =>
      (sessions.data ?? []).map((s) =>
        sessionEvent({
          id: s.id,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: s.status,
          title: s.group.name,
          subtitle: s.room?.name,
          colorKey: s.groupId,
        }),
      ),
    [sessions.data],
  )

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

      <Card className="p-3 sm:p-4">
        <Calendar
          events={events}
          onRangeChange={setRange}
          onEventClick={(id) => navigate(`/teacher/sessions/${id}`)}
        />
      </Card>
    </>
  )
}
