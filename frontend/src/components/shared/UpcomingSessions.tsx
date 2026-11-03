import { CalendarClock, DoorOpen, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AttendanceBadge, SessionStatusBadge } from '@/components/shared/SessionBadges'
import { EmptyState } from '@/components/shared/States'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { StudentSession } from '@/core/api/types'
import { formatSessionSlot } from '@/core/lib/format'
import { cn, fullName } from '@/core/lib/utils'
import { groupColor } from './Calendar'

/** Liste compacte des seances d'un eleve (prochaines ou recentes). */
export function UpcomingSessions({
  sessions,
  title,
}: {
  sessions: StudentSession[]
  title?: string
}) {
  const { t } = useTranslation()
  return (
    <Card>
      <CardHeader className="border-b border-border pb-4">
        <CardTitle>{title ?? t('planning.upcoming')}</CardTitle>
      </CardHeader>
      {sessions.length === 0 ? (
        <EmptyState icon={CalendarClock} title={t('planning.noUpcoming')} />
      ) : (
        <ul className="divide-y divide-border">
          {sessions.map((s) => (
            <li
              key={s.id}
              className={cn('flex gap-3 px-5 py-3', s.status === 'CANCELLED' && 'opacity-60')}
            >
              <span className="mt-1 h-10 w-1 shrink-0 rounded-full" style={{ background: groupColor(s.group.id) }} />
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('font-medium', s.status === 'CANCELLED' && 'line-through')}>
                    {s.group.subject}
                  </span>
                  {s.status !== 'PLANNED' && <SessionStatusBadge status={s.status} />}
                  {s.attendance && <AttendanceBadge status={s.attendance.status} />}
                </div>
                <p className="text-muted-foreground">{formatSessionSlot(s.startsAt, s.endsAt)}</p>
                <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                  <span>{fullName(s.teacher.user)}</span>
                  {s.room && (
                    <span className="flex items-center gap-1">
                      <DoorOpen className="size-3" />
                      {s.room.name}
                    </span>
                  )}
                  {s.isOnline && s.meetingUrl && (
                    <a href={s.meetingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Video className="size-3" />
                      {t('planning.online')}
                    </a>
                  )}
                </p>
                {s.homework && (
                  <p className="mt-1 text-xs">
                    <span className="font-medium">{t('planning.homework')} :</span> {s.homework}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
