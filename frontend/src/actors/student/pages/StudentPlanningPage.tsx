import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, sessionEvent } from '@/components/shared/Calendar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/card'
import type { DateRange } from '@/core/api/types'
import { fullName } from '@/core/lib/utils'
import { useMyStudentSessions } from '../api/student.api'

export function StudentPlanningPage() {
  const { t } = useTranslation()
  const [range, setRange] = useState<DateRange | null>(null)
  const { data } = useMyStudentSessions(range)

  const events = useMemo(
    () =>
      (data ?? []).map((s) =>
        sessionEvent({
          id: s.id,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          status: s.status,
          title: s.group.subject,
          subtitle: [s.room?.name, fullName(s.teacher.user)].filter(Boolean).join(' · '),
          colorKey: s.group.id,
        }),
      ),
    [data],
  )

  return (
    <>
      <PageHeader title={t('planning.title')} />
      <Card className="p-3 sm:p-4">
        <Calendar events={events} onRangeChange={setRange} />
      </Card>
    </>
  )
}
