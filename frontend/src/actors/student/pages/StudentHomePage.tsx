import { BookOpen, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AttendanceSummary } from '@/components/shared/AttendanceSummary'
import { PageHeader } from '@/components/shared/PageHeader'
import { CardsSkeleton, EmptyState, ErrorState } from '@/components/shared/States'
import { UpcomingSessions } from '@/components/shared/UpcomingSessions'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/core/auth/auth.store'
import { nextDaysRange } from '@/core/lib/dates'
import { formatDate } from '@/core/lib/format'
import { fullName } from '@/core/lib/utils'
import { useMyAttendance, useMyStudentGroups, useMyStudentSessions } from '../api/student.api'

export function StudentHomePage() {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const { data: groups, isLoading, isError, refetch } = useMyStudentGroups()
  const [range] = useState(() => nextDaysRange(14))
  const upcoming = useMyStudentSessions(range)
  const attendance = useMyAttendance()

  return (
    <>
      <PageHeader
        title={t('dashboard.welcome', { name: user?.firstName ?? '' })}
        description={t('student.subtitle')}
      />
      {isLoading ? (
        <CardsSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : groups!.length === 0 ? (
        <Card>
          <EmptyState icon={UsersRound} title={t('student.noGroups')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups!.map((g) => (
            <Card key={g.id} className="flex gap-4 p-5">
              <div className="h-fit rounded-xl bg-primary-soft p-3">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{g.subject}</p>
                <p className="text-sm text-muted-foreground">{g.name}</p>
                <p className="mt-2 text-sm">{t('student.teacher', { name: fullName(g.teacher.user) })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('students.joinedAt', { date: formatDate(g.joinedAt) })}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {upcoming.data && (
            <UpcomingSessions sessions={upcoming.data.filter((s) => new Date(s.endsAt) >= new Date())} />
          )}
        </div>
        <div className="lg:col-span-3">{attendance.data && <AttendanceSummary data={attendance.data} />}</div>
      </div>
    </>
  )
}
