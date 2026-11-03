import { ArrowLeft, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { AttendanceSummary } from '@/components/shared/AttendanceSummary'
import { Avatar } from '@/components/shared/Misc'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/shared/States'
import { UpcomingSessions } from '@/components/shared/UpcomingSessions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { nextDaysRange } from '@/core/lib/dates'
import { fullName } from '@/core/lib/utils'
import { useChild, useChildAttendance, useChildPayments, useChildSessions } from '../api/parent.api'
import { ChildPaymentsCard } from '../components/ChildPaymentsCard'

export function ParentChildDetailPage() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { data: child, isLoading, isError, refetch } = useChild(id)
  const [range] = useState(() => nextDaysRange(14))
  const upcoming = useChildSessions(id, range)
  const attendance = useChildAttendance(id)
  const payments = useChildPayments(id)

  if (isLoading) return <TableSkeleton rows={4} />
  if (isError || !child) return <ErrorState onRetry={refetch} />

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link to="/parent">
          <ArrowLeft className="rtl:rotate-180" />
          {t('common.back')}
        </Link>
      </Button>

      <div className="mb-6 flex items-center gap-4">
        <Avatar user={child.user} className="size-14 text-lg" />
        <div>
          <h1 className="text-2xl font-semibold">{fullName(child.user)}</h1>
          <p className="text-sm text-muted-foreground">
            {child.level} · {child.section}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('parent.groups')}</CardTitle>
        </CardHeader>
        <CardContent>
          {child.groups.length === 0 ? (
            <EmptyState icon={BookOpen} title={t('students.noGroup')} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {child.groups.map(({ group }) => (
                <div key={group.id} className="flex gap-3 rounded-lg border border-border p-4">
                  <BookOpen className="size-5 shrink-0 text-primary" />
                  <div className="text-sm">
                    <p className="font-semibold">{group.subject}</p>
                    <p className="text-muted-foreground">{group.name}</p>
                    <p className="mt-1">{t('student.teacher', { name: fullName(group.teacher.user) })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {payments.data && <ChildPaymentsCard data={payments.data} />}
          {upcoming.data && (
            <UpcomingSessions sessions={upcoming.data.filter((s) => new Date(s.endsAt) >= new Date())} />
          )}
        </div>
        <div className="lg:col-span-3">{attendance.data && <AttendanceSummary data={attendance.data} />}</div>
      </div>
    </>
  )
}
